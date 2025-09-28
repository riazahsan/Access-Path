import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { RouteCollection, AccessibilityFilter } from '@/types';
import { Card } from '@/components/ui/card';
import { getRoute } from '@/components/mapboxRoutes';

interface MapViewProps {
  routes: RouteCollection;
  selectedRoute?: string;
  filters: AccessibilityFilter;
  onRouteSelect?: (routeId: string) => void;
  onFiltersChange?: (filters: AccessibilityFilter) => void;
}

const MapView: React.FC<MapViewProps> = ({ 
  routes, 
  selectedRoute, 
  filters,
  onRouteSelect,
  onFiltersChange
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [mapboxToken] = useState<string>(
    "pk.eyJ1Ijoic2FtaXJraGF0dGFrIiwiYSI6ImNtZzJoZHNhNzB5czEyanEyY2RmbXdtM3kifQ.2xIoUu6wrMN5ALJbue0cEg"
  );
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  // Constant starting point
  const start: [number, number] = [-80.423710, 37.225825];

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/samirkhattak/cmg2ldrpo000o01s14dc45qyz?fresh=true",
        center: start,
        zoom: 14,
        pitch: 0,
        bearing: 0
      });

      // Controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        if (!map.current) return;

        setIsMapLoaded(true);

        // Max bounds
        const bounds: mapboxgl.LngLatBoundsLike = [
          [-80.437, 37.210],
          [-80.398, 37.250]
        ];
        map.current.setMaxBounds(bounds);

        // --- Origin Circle (constant) ---
        map.current.addSource("origin-circle", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: { type: "Point", coordinates: start },
              },
            ],
          },
        });

        map.current.addLayer({
          id: "origin-circle",
          type: "circle",
          source: "origin-circle",
          paint: { "circle-radius": 10, "circle-color": "#4ce05b" },
        });

        // --- Destination Circle (initially empty) ---
        map.current.addSource("destination-circle", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.current.addLayer({
          id: "destination-circle",
          type: "circle",
          source: "destination-circle",
          paint: { "circle-radius": 10, "circle-color": "#f30" },
        });

        // --- Map click handler to set destination and route ---
        map.current.on("click", (event) => {
          const coords: [number, number] = [event.lngLat.lng, event.lngLat.lat];

          const endGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
            type: "FeatureCollection",
            features: [
              { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: coords } },
            ],
          };

          // Update destination circle
          (map.current!.getSource("destination-circle") as mapboxgl.GeoJSONSource).setData(endGeoJSON);

          // Fetch and draw route
          getRoute(map.current!, start, coords);
        });

        // --- Demo Routes ---
        if (routes?.features?.length > 0) {
          map.current.addSource('demo-routes', { type: 'geojson', data: routes });

          map.current.addLayer({
            id: 'demo-accessible-routes',
            type: 'line',
            source: 'demo-routes',
            filter: ['==', ['get', 'accessibility'], 'accessible'],
            paint: {
              'line-color': '#22c55e',
              'line-width': ['case', ['==', ['get', 'id'], selectedRoute || ''], 6, 4],
              'line-opacity': 0.8
            }
          });

          map.current.addLayer({
            id: 'demo-partial-routes',
            type: 'line',
            source: 'demo-routes',
            filter: ['==', ['get', 'accessibility'], 'partial'],
            paint: {
              'line-color': '#f59e0b',
              'line-width': ['case', ['==', ['get', 'id'], selectedRoute || ''], 6, 4],
              'line-opacity': 0.8,
              'line-dasharray': [2, 2]
            }
          });

          routes.features.forEach(feature => {
            const coords = feature.geometry.coordinates[0];
            new mapboxgl.Marker({ color: '#22c55e', scale: 0.8 })
              .setLngLat(coords as [number, number])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 }).setHTML(`
                  <div style="padding: 8px;">
                    <h3 style="margin:0 0 5px 0; font-size:14px; font-weight:600;">${feature.properties.name}</h3>
                    <p style="margin:0; font-size:12px; color:#666;">${feature.properties.estimatedTime} min walk</p>
                    <p style="margin:5px 0 0 0; font-size:12px;">Accessibility: <span style="font-weight:500;">${feature.properties.accessibility}</span></p>
                  </div>
                `)
              )
              .addTo(map.current!);
          });

          map.current.on('click', 'demo-accessible-routes', e => {
            if (e.features?.[0]?.properties?.id && onRouteSelect) {
              onRouteSelect(e.features[0].properties.id);
            }
          });
          map.current.on('click', 'demo-partial-routes', e => {
            if (e.features?.[0]?.properties?.id && onRouteSelect) {
              onRouteSelect(e.features[0].properties.id);
            }
          });
        }
      });

      map.current.on('error', e => console.error('Mapbox error:', e));

    } catch (error) {
      console.error('Mapbox initialization error:', error);
    }

    return () => map.current?.remove();
  }, [mapboxToken, routes, selectedRoute, onRouteSelect]);

  // --- Layer visibility based on filters ---
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    console.log('🔄 Updating layer visibility with filters:', filters);

    const demoLayers: [string, boolean][] = [
      ['demo-accessible-routes', filters.showAccessible],
      ['demo-partial-routes', filters.showPartial],
    ];

    demoLayers.forEach(([layerId, visible]) => {
      if (map.current!.getLayer(layerId)) {
        map.current!.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        console.log(`✅ Toggled demo layer "${layerId}": ${visible ? 'visible' : 'hidden'}`);
      }
    });


    // Get all available layers from the Mapbox style
    const style = map.current.getStyle();
    if (style && style.layers) {
      const availableLayers = style.layers.map(layer => layer.id);
      console.log('Available layers:', availableLayers);

      // Auto-detect accessibility layers by name patterns - more specific matching
      const detectedLayers = {
        accessibleRoutes: availableLayers.filter(id => 
          (id.toLowerCase().includes('route') || id.toLowerCase().includes('path')) &&
          !id.toLowerCase().includes('entrance')
        ),
        accessibleEntrances: availableLayers.filter(id => 
          id.toLowerCase().includes('entrance') && 
          !id.toLowerCase().includes('route') &&
          !id.toLowerCase().includes('path')
        ),
        curbCuts: availableLayers.filter(id => 
          id.toLowerCase().includes('curb') ||
          id.toLowerCase().includes('ramp')
        ),
        parking: availableLayers.filter(id => 
          id.toLowerCase().includes('parking') ||
          id.toLowerCase().includes('ada')
        ),
        elevators: availableLayers.filter(id => 
          id.toLowerCase().includes('elevator') ||
          id.toLowerCase().includes('lift')
        )
      };

      console.log('Detected accessibility layers:', detectedLayers);

      // Toggle accessible routes
      detectedLayers.accessibleRoutes.forEach(layerId => {
        try {
          if (map.current?.getLayer(layerId)) {
            map.current.setLayoutProperty(
              layerId,
              'visibility',
              filters.showAccessible ? 'visible' : 'none'
            );
            console.log(`✅ Toggled accessible routes layer "${layerId}": ${filters.showAccessible ? 'visible' : 'hidden'}`);
          }
        } catch (error) {
          console.warn(`Error toggling layer "${layerId}":`, error);
        }
      });

      // Toggle accessible entrances
      detectedLayers.accessibleEntrances.forEach(layerId => {
        try {
          if (map.current?.getLayer(layerId)) {
            map.current.setLayoutProperty(
              layerId,
              'visibility',
              filters.showPartial ? 'visible' : 'none'
            );
            console.log(`✅ Toggled accessible entrances layer "${layerId}": ${filters.showPartial ? 'visible' : 'hidden'}`);
          }
        } catch (error) {
          console.warn(`Error toggling layer "${layerId}":`, error);
        }
      });

      // Toggle curb cuts
      detectedLayers.curbCuts.forEach(layerId => {
        try {
          if (map.current?.getLayer(layerId)) {
            map.current.setLayoutProperty(
              layerId,
              'visibility',
              filters.showCurbCuts ? 'visible' : 'none'
            );
            console.log(`✅ Toggled curb cuts layer "${layerId}": ${filters.showCurbCuts ? 'visible' : 'hidden'}`);
          }
        } catch (error) {
          console.warn(`Error toggling layer "${layerId}":`, error);
        }
      });

      // Toggle parking
      detectedLayers.parking.forEach(layerId => {
        try {
          if (map.current?.getLayer(layerId)) {
            map.current.setLayoutProperty(
              layerId,
              'visibility',
              filters.showParking ? 'visible' : 'none'
            );
            console.log(`✅ Toggled parking layer "${layerId}": ${filters.showParking ? 'visible' : 'hidden'}`);
          }
        } catch (error) {
          console.warn(`Error toggling layer "${layerId}":`, error);
        }
      });

      // Toggle elevators
      detectedLayers.elevators.forEach(layerId => {
        try {
          if (map.current?.getLayer(layerId)) {
            map.current.setLayoutProperty(
              layerId,
              'visibility',
              filters.showElevators ? 'visible' : 'none'
            );
            console.log(`✅ Toggled elevators layer "${layerId}": ${filters.showElevators ? 'visible' : 'hidden'}`);
          }
        } catch (error) {
          console.warn(`Error toggling layer "${layerId}":`, error);
        }
      });
    }

  }, [filters, isMapLoaded]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Sidebar for directions */}
      <div
        id="instructions"
        className="instructions"
        style={{
          position: "absolute",
          margin: "20px",
          width: "25%",
          top: 0,
          bottom: "20%",
          padding: "20px",
          backgroundColor: "#fff",
          overflowY: "scroll",
          fontFamily: "sans-serif",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          borderRadius: "8px",
          zIndex: 1,
        }}
      ></div>

      {/* Map overlay gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/20 to-transparent" />
      </div>

      {/* Loading indicator */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MapView;
