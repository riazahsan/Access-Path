import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { RouteCollection, AccessibilityFilter } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface MapViewProps {
  routes: RouteCollection;
  selectedRoute?: string;
  filters: AccessibilityFilter;
  onRouteSelect?: (routeId: string) => void;
}

const MapView: React.FC<MapViewProps> = ({ 
  routes, 
  selectedRoute, 
  filters,
  onRouteSelect 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Use your actual token from the HTML file
  const [mapboxToken] = useState<string>("pk.eyJ1Ijoic2FtaXJraGF0dGFrIiwiYSI6ImNtZzJoZHNhNzB5czEyanEyY2RmbXdtM3kifQ.2xIoUu6wrMN5ALJbue0cEg");
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      // Initialize map with your custom style
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/samirkhattak/cmg2ldrpo000o01s14dc45qyz?fresh=true",
        center: [-80.416748046875, 37.229217529296875],
        zoom: 14,
        pitch: 0,
        bearing: 0
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add geolocation control
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
        
        console.log("Map loaded with published style!");
        setIsMapLoaded(true);
        
        const style = map.current.getStyle();
        console.log("Total sources:", Object.keys(style.sources).length);
        console.log("Total layers:", style.layers.length);
        
        // List all layers for debugging
        console.log("All layers:");
        style.layers.forEach(layer => {
          console.log("  - " + layer.id + " (type: " + layer.type + ")");
        });

        // Find accessibility layers
        const accessibilityLayers = style.layers.filter(layer => {
          const id = layer.id.toLowerCase();
          return id.includes('access') || 
                 id.includes('curb') || 
                 id.includes('parking') || 
                 id.includes('entrance') || 
                 id.includes('elevator') ||
                 id.includes('ada');
        });

        console.log("Found accessibility layers:", accessibilityLayers.length);
        accessibilityLayers.forEach(layer => {
          console.log("  -> " + layer.id);
        });

        // Add demo routes if available
        if (routes && routes.features && routes.features.length > 0) {
          // Add route source
          map.current.addSource('demo-routes', {
            type: 'geojson',
            data: routes
          });

          // Add accessible routes layer
          map.current.addLayer({
            id: 'demo-accessible-routes',
            type: 'line',
            source: 'demo-routes',
            filter: ['==', ['get', 'accessibility'], 'accessible'],
            paint: {
              'line-color': '#22c55e',
              'line-width': [
                'case',
                ['==', ['get', 'id'], selectedRoute || ''],
                6,
                4
              ],
              'line-opacity': 0.8
            }
          });

          // Add partial accessibility routes layer
          map.current.addLayer({
            id: 'demo-partial-routes',
            type: 'line',
            source: 'demo-routes',
            filter: ['==', ['get', 'accessibility'], 'partial'],
            paint: {
              'line-color': '#f59e0b',
              'line-width': [
                'case',
                ['==', ['get', 'id'], selectedRoute || ''],
                6,
                4
              ],
              'line-opacity': 0.8,
              'line-dasharray': [2, 2]
            }
          });

          // Add route markers
          routes.features.forEach((feature) => {
            const coords = feature.geometry.coordinates[0];
            
            const marker = new mapboxgl.Marker({
              color: '#22c55e',
              scale: 0.8
            })
              .setLngLat(coords as [number, number])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`
                    <div style="padding: 8px;">
                      <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">${feature.properties.name}</h3>
                      <p style="margin: 0; font-size: 12px; color: #666;">
                        ${feature.properties.estimatedTime} min walk
                      </p>
                      <p style="margin: 5px 0 0 0; font-size: 12px;">
                        Accessibility: <span style="font-weight: 500;">${feature.properties.accessibility}</span>
                      </p>
                    </div>
                  `)
              )
              .addTo(map.current!);
          });

          // Add click handlers for demo routes
          map.current.on('click', 'demo-accessible-routes', (e) => {
            if (e.features && e.features[0] && onRouteSelect) {
              const routeId = e.features[0].properties?.id;
              if (routeId) onRouteSelect(routeId);
            }
          });

          map.current.on('click', 'demo-partial-routes', (e) => {
            if (e.features && e.features[0] && onRouteSelect) {
              const routeId = e.features[0].properties?.id;
              if (routeId) onRouteSelect(routeId);
            }
          });
        }
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
      });

    } catch (error) {
      console.error('Mapbox initialization error:', error);
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, routes, selectedRoute, onRouteSelect]);

  // Update layer visibility based on filters
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Toggle demo routes based on filters
    if (map.current.getLayer('demo-accessible-routes')) {
      map.current.setLayoutProperty(
        'demo-accessible-routes',
        'visibility',
        filters.showAccessible ? 'visible' : 'none'
      );
    }

    if (map.current.getLayer('demo-partial-routes')) {
      map.current.setLayoutProperty(
        'demo-partial-routes', 
        'visibility',
        filters.showPartial ? 'visible' : 'none'
      );
    }

    // TODO: Toggle actual Mapbox Studio layers based on filters
    // Update these layer IDs based on your actual Mapbox Studio layer names
    const layerMappings = {
      showAccessible: ['Accessibility Routes', 'Accessible Entrances'],
      showCurbCuts: ['Curb Cuts'],
      showParking: ['ADA Parking Spots'],
      showElevators: ['Elevators']
    };

    Object.entries(layerMappings).forEach(([filterKey, layerIds]) => {
      const isVisible = filters[filterKey as keyof AccessibilityFilter];
      layerIds.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(
            layerId,
            'visibility',
            isVisible ? 'visible' : 'none'
          );
        }
      });
    });

  }, [filters, isMapLoaded]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Map overlay gradient for better UI visibility */}
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