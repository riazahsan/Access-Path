import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AccessibilityFilter } from '@/types';
import { Card } from '@/components/ui/card';
import { getRoute } from '@/components/mapboxRoutes';
import { type ConstructionBlockade } from '@/components/ConstructionDropdown';
import { useTheme } from '@/contexts/ThemeContext';
import { useMap } from '@/contexts/MapContext';

interface MapViewProps {
  selectedRoute?: string;
  filters: AccessibilityFilter;
  onRouteSelect?: (routeId: string) => void;
  plannedRoute?: {
    start: [number, number];
    end: [number, number];
    startName: string;
    endName: string;
  } | null;
  constructionBlockades: ConstructionBlockade[];
  onConstructionBlockadesChange: (blockades: ConstructionBlockade[]) => void;
}

const MapView: React.FC<MapViewProps> = ({
  selectedRoute,
  filters,
  onRouteSelect,
  plannedRoute,
  constructionBlockades,
  onConstructionBlockadesChange
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { map, isMapLoaded, setIsMapLoaded } = useMap();
  const routeMarkers = useRef<mapboxgl.Marker[]>([]);
  const currentRoute = useRef<{
    start: [number, number];
    end: [number, number];
    startName: string;
    endName: string;
  } | null>(null);

  const [mapboxToken] = useState<string>(
    "pk.eyJ1Ijoic2FtaXJraGF0dGFrIiwiYSI6ImNtZzJoZHNhNzB5czEyanEyY2RmbXdtM3kifQ.2xIoUu6wrMN5ALJbue0cEg"
  );
  const { theme } = useTheme();

  // Start location (dynamic from geolocation)
  const [start, setStart] = useState<[number, number] | null>(null);

  // Function to clear existing route markers
  const clearRouteMarkers = () => {
    routeMarkers.current.forEach(marker => marker.remove());
    routeMarkers.current = [];
  };

  // Function to add persistent route markers
  const addRouteMarkers = (startCoord: [number, number], endCoord: [number, number], startName: string, endName: string) => {
    // Clear existing markers first
    clearRouteMarkers();

    if (!map.current) return;

    try {
      const startMarker = new mapboxgl.Marker({
        color: '#4ce05b',
        scale: 1.2,
        draggable: false
      })
        .setLngLat(startCoord)
        .setPopup(
          new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false
          }).setHTML(`
            <div style="padding: 8px; text-align: center;">
              <h3 style="margin:0 0 5px 0; font-size:14px; font-weight:600; color: #059669;">📍 Start</h3>
              <p style="margin:0; font-size:12px; color:#666;">${startName}</p>
            </div>
          `)
        )
        .addTo(map.current);

      const endMarker = new mapboxgl.Marker({
        color: '#f30',
        scale: 1.2,
        draggable: false
      })
        .setLngLat(endCoord)
        .setPopup(
          new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false
          }).setHTML(`
            <div style="padding: 8px; text-align: center;">
              <h3 style="margin:0 0 5px 0; font-size:14px; font-weight:600; color: #dc2626;">🎯 Destination</h3>
              <p style="margin:0; font-size:12px; color:#666;">${endName}</p>
            </div>
          `)
        )
        .addTo(map.current);

      // Store references to prevent removal
      routeMarkers.current = [startMarker, endMarker];
      console.log('✅ Added persistent route markers');
    } catch (error) {
      console.error('❌ Error adding route markers:', error);
    }
  };

  // Get user’s location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setStart(coords);
        },
        err => {
          console.error("Geolocation error:", err);
          // fallback (Blacksburg, VA)
          setStart([-80.423710, 37.225825]);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.warn("Geolocation not supported");
      setStart([-80.423710, 37.225825]);
    }
  }, []);

  // Update origin circle when user location changes
  useEffect(() => {
    if (start && map.current && isMapLoaded) {
      const originSource = map.current.getSource("origin-circle") as mapboxgl.GeoJSONSource;
      if (originSource) {
        const originGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
          type: "FeatureCollection",
          features: [
            { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: start } },
          ],
        };
        originSource.setData(originGeoJSON);
        console.log('🎯 Updated origin circle to user location:', start);
      }
    }
  }, [start, isMapLoaded]);

  // Listen for route planning events
  useEffect(() => {
    const handleDrawRoute = (event: CustomEvent<{
      start: [number, number];
      end: [number, number];
      startName: string;
      endName: string;
    }>) => {
      console.log('📍 MapView received route event:', event.detail);
      const { start: startCoord, end: endCoord, startName, endName } = event.detail;

      if (map.current && startCoord && endCoord && isMapLoaded) {
        console.log('🗺️ Map is ready, drawing route...');

        setTimeout(() => {
          if (!map.current) return;

          try {
            // Update destination circle to show the end point
            const endGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
              type: "FeatureCollection",
              features: [
                { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: endCoord } },
              ],
            };

            const destinationSource = map.current.getSource("destination-circle") as mapboxgl.GeoJSONSource;
            if (destinationSource) {
              destinationSource.setData(endGeoJSON);
            }

            // Update origin circle to show the start point
            const startGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
              type: "FeatureCollection",
              features: [
                { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: startCoord } },
              ],
            };

            const originSource = map.current.getSource("origin-circle") as mapboxgl.GeoJSONSource;
            if (originSource) {
              originSource.setData(startGeoJSON);
            }
          } catch (error) {
            console.error('❌ Error updating sources in event handler:', error);
          }

          // Add persistent building markers
          addRouteMarkers(startCoord, endCoord, startName, endName);

          // Use the existing getRoute function to draw the route and update instructions
          try {
            getRoute(map.current, startCoord, endCoord, constructionBlockades).then((result) => {
              if (result) {
                // Update the instructions panel with building names and accessibility info
                const instructions = document.getElementById("instructions");
                if (instructions) {
                  const duration = Math.floor(result.duration / 60);
                  const distance = Math.round(result.distance);

                  // Find the trip duration paragraph and update the prompt
                  let updatedContent = instructions.innerHTML;
                  updatedContent = updatedContent.replace(
                    '📍 Click the map to get directions to another destination',
                    `🏢 Accessible route planned from <strong>${startName}</strong> to <strong>${endName}</strong>`
                  );

                  // Add accessibility note if not already present
                  if (!updatedContent.includes('♿')) {
                    updatedContent = updatedContent.replace(
                      `<p><strong>Trip duration: ${duration} min 👩‍🦽 </strong></p>`,
                      `<p><strong>Trip duration: ${duration} min 👩‍🦽 | Distance: ${distance}m</strong></p>
                       <p style="color: #059669; font-size: 0.9em;">♿ This route is optimized for wheelchair accessibility</p>`
                    );
                  }

                  instructions.innerHTML = updatedContent;
                }
              }
            }).catch((error) => {
              console.error('❌ getRoute failed in event handler:', error);
            });
          } catch (error) {
            console.error('❌ Error calling getRoute in event handler:', error);
          }
        }, 500); // Wait 500ms for map to be fully ready
      }
    };

    console.log('🎧 MapView: Setting up drawRoute event listener');
    window.addEventListener('drawRoute', handleDrawRoute as EventListener);
    return () => {
      console.log('🗑️ MapView: Cleaning up drawRoute event listener');
      window.removeEventListener('drawRoute', handleDrawRoute as EventListener);
    };
  }, []);

  // Watch for plannedRoute prop changes
  useEffect(() => {
    if (plannedRoute && map.current && isMapLoaded) {
      console.log('🎯 MapView: Received plannedRoute prop:', plannedRoute);
      console.log('🎯 Map loaded status:', isMapLoaded);

      const { start: startCoord, end: endCoord, startName, endName } = plannedRoute;

      // Store the current route for potential restoration
      currentRoute.current = plannedRoute;

      // Wait a small amount to ensure map is fully ready
      setTimeout(() => {
        if (!map.current) return;

        try {
          // Update destination circle to show the end point
          const endGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
            type: "FeatureCollection",
            features: [
              { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: endCoord } },
            ],
          };

          const destinationSource = map.current.getSource("destination-circle") as mapboxgl.GeoJSONSource;
          if (destinationSource) {
            destinationSource.setData(endGeoJSON);
            console.log('✅ Updated destination circle');
          }

          // Update origin circle to show the start point
          const startGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
            type: "FeatureCollection",
            features: [
              { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: startCoord } },
            ],
          };

          const originSource = map.current.getSource("origin-circle") as mapboxgl.GeoJSONSource;
          if (originSource) {
            originSource.setData(startGeoJSON);
            console.log('✅ Updated origin circle');
          }
        } catch (error) {
          console.error('❌ Error updating map sources:', error);
        }

        // Add persistent building markers
        addRouteMarkers(startCoord, endCoord, startName, endName);

        // Use the existing getRoute function to draw the route and update instructions
        try {
          getRoute(map.current, startCoord, endCoord, constructionBlockades).then((result) => {
            if (result) {
              console.log('✅ Route drawn successfully:', result);
              // Update the instructions panel with building names and accessibility info
              const instructions = document.getElementById("instructions");
              if (instructions) {
                const duration = Math.floor(result.duration / 60);
                const distance = Math.round(result.distance);

                // Find the trip duration paragraph and update the prompt
                let updatedContent = instructions.innerHTML;
                updatedContent = updatedContent.replace(
                  '📍 Click the map to get directions to another destination',
                  `🏢 Accessible route planned from <strong>${startName}</strong> to <strong>${endName}</strong>`
                );

                // Add accessibility note if not already present
                if (!updatedContent.includes('♿')) {
                  updatedContent = updatedContent.replace(
                    `<p><strong>Trip duration: ${duration} min 👩‍🦽 </strong></p>`,
                    `<p><strong>Trip duration: ${duration} min 👩‍🦽 | Distance: ${distance}m</strong></p>
                     <p style="color: #059669; font-size: 0.9em;">♿ This route is optimized for wheelchair accessibility</p>`
                  );
                }

                instructions.innerHTML = updatedContent;
              }
            }
          }).catch((error) => {
            console.error('❌ Route drawing failed:', error);
          });
        } catch (error) {
          console.error('❌ Error calling getRoute:', error);
        }
      }, 500); // Wait 500ms for map to be fully ready
    }
  }, [plannedRoute, isMapLoaded]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !start) return;

    try {
      mapboxgl.accessToken = mapboxToken;

      // Choose map style based on theme
      const getMapStyle = () => {
        switch (theme) {
          case 'dark':
            return 'mapbox://styles/mapbox/dark-v11';
          case 'high-contrast':
            return 'mapbox://styles/mapbox/dark-v11'; // Use dark for high contrast base
          default:
            return "mapbox://styles/samirkhattak/cmg2ldrpo000o01s14dc45qyz?fresh=true";
        }
      };

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: getMapStyle(),
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

        // --- Origin Circle (user location) ---
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

        // --- Destination Circle ---
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

        // --- Map click handler: route from user location to click ---
        map.current.on("click", (event) => {
          const coords: [number, number] = [event.lngLat.lng, event.lngLat.lat];

          // Clear building markers from planned route
          clearRouteMarkers();

          // Clear the current route reference since this is a manual click
          currentRoute.current = null;

          const endGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
            type: "FeatureCollection",
            features: [
              { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: coords } },
            ],
          };

          // Update destination circle
          (map.current!.getSource("destination-circle") as mapboxgl.GeoJSONSource).setData(endGeoJSON);

          // Reset origin circle to user's current location (not the planned route start)
          if (start) {
            const originGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
              type: "FeatureCollection",
              features: [
                { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: start } },
              ],
            };
            (map.current!.getSource("origin-circle") as mapboxgl.GeoJSONSource).setData(originGeoJSON);
          }

          // Fetch and draw route
          if (start) {
            getRoute(map.current!, start, coords, constructionBlockades);
          }
        });

        console.log('🗺️ Map initialization complete');

        // Restore any existing route after map initialization
        if (currentRoute.current) {
          console.log('🔄 Restoring route after map initialization');
          setTimeout(() => {
            if (currentRoute.current && map.current) {
              const { start: startCoord, end: endCoord, startName, endName } = currentRoute.current;
              addRouteMarkers(startCoord, endCoord, startName, endName);
              getRoute(map.current, startCoord, endCoord, constructionBlockades);
            }
          }, 1000);
        }
      });

      map.current.on('error', e => console.error('Mapbox error:', e));

    } catch (error) {
      console.error('Mapbox initialization error:', error);
    }

    return () => {
      clearRouteMarkers();
      map.current?.remove();
    };
  }, [mapboxToken, start]); // Only recreate map if token or start location changes


  // Debug: Log all available layers when map loads
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    console.log('🗺️ Available map layers:');
    const style = map.current.getStyle();
    if (style.layers) {
      style.layers.forEach((layer, index) => {
        console.log(`${index}: ${layer.id} (${layer.type})`);
      });
    }
  }, [isMapLoaded]);

  // --- Layer visibility based on filters ---
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Exact layer mappings based on actual Mapbox style layers
    const layerMappings: Record<string, string[]> = {
      showAccessible: ['Accessibility Routes'],
      showEntrances: ['Accessibile Entrances'], // Note: Mapbox style has typo "Accessibile"
      showAisles: ['Accessibility Aisles'],
      showCurbCuts: ['Curb Cuts'],
      showParking: ['ADA Parking Spots'],
      showAccessible2: ['accessroutes2-1zv1wp']
    };

    console.log('📋 Layer mappings:', layerMappings);

    // Apply visibility changes
    Object.entries(layerMappings).forEach(([filterKey, layerIds]) => {
      const isVisible = filters[filterKey as keyof AccessibilityFilter];
      layerIds.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
          console.log(`🔄 Set ${layerId} visibility to ${isVisible ? 'visible' : 'none'}`);
        } else {
          console.warn(`⚠️ Layer ${layerId} not found in map`);
        }
      });
    });

  }, [filters, isMapLoaded]);

  // Update map style when theme changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const getMapStyle = () => {
      switch (theme) {
        case 'dark':
          return 'mapbox://styles/mapbox/dark-v11';
        case 'high-contrast':
          return 'mapbox://styles/mapbox/dark-v11';
        default:
          return "mapbox://styles/samirkhattak/cmg2ldrpo000o01s14dc45qyz?fresh=true";
      }
    };

    map.current.setStyle(getMapStyle());
    console.log('🎨 Map style updated for theme:', theme);

    // Add event listener to restore all map elements after style loads
    const restoreMapElements = () => {
      if (!map.current || !start) return;

      // Wait a bit for style to fully load
      setTimeout(() => {
        if (!map.current) return;

        try {
          // Restore origin circle (user location)
          if (!map.current.getSource("origin-circle")) {
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

            console.log('🎯 Origin circle restored after style change');
          }

          // Restore destination circle
          if (!map.current.getSource("destination-circle")) {
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

            console.log('🎯 Destination circle restored after style change');
          }

          // Restore map click handler
          map.current.off('click'); // Remove any existing click handlers
          map.current.on("click", (event) => {
            const coords: [number, number] = [event.lngLat.lng, event.lngLat.lat];

            // Clear building markers from planned route
            clearRouteMarkers();

            // Clear the current route reference since this is a manual click
            currentRoute.current = null;

            const endGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
              type: "FeatureCollection",
              features: [
                { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: coords } },
              ],
            };

            // Update destination circle
            (map.current!.getSource("destination-circle") as mapboxgl.GeoJSONSource).setData(endGeoJSON);

            // Reset origin circle to user's current location (not the planned route start)
            if (start) {
              const originGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: start } },
                ],
              };
              (map.current!.getSource("origin-circle") as mapboxgl.GeoJSONSource).setData(originGeoJSON);
            }

            // Fetch and draw route
            if (start) {
              getRoute(map.current!, start, coords, constructionBlockades);
            }
          });

          console.log('🖱️ Map click handler restored after style change');


        } catch (error) {
          console.warn('Could not restore map elements:', error);
        }
      }, 500); // Increased timeout to ensure style is fully loaded
    };

    map.current.once('styledata', restoreMapElements);
  }, [theme, isMapLoaded, start, selectedRoute, onRouteSelect, constructionBlockades]);

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
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          overflowY: "scroll",
          fontFamily: "sans-serif",
          boxShadow: theme === 'dark' ? "0 4px 12px rgba(0,0,0,0.6)" : "0 2px 6px rgba(0,0,0,0.3)",
          borderRadius: "8px",
          border: theme === 'high-contrast' ? "2px solid var(--border-color)" : "1px solid var(--border-color)",
          zIndex: 1,
        }}
      >
        <div style={{
          marginBottom: "15px",
          padding: "10px",
          background: "var(--bg-secondary)",
          borderRadius: "6px",
          border: theme === 'high-contrast' ? "1px solid var(--border-color)" : "none"
        }}>
          <h4 style={{
            margin: "0 0 8px 0",
            fontWeight: "bold",
            fontSize: "14px",
            color: "var(--text-primary)"
          }}>♿ Route Accessibility</h4>
          <div style={{ fontSize: "12px", lineHeight: "1.4", color: "var(--text-primary)" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ width: "16px", height: "3px", backgroundColor: "var(--route-accessible)", marginRight: "8px", borderRadius: "2px" }}></div>
              <span>High accessibility (80%+)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ width: "16px", height: "3px", backgroundColor: "var(--route-moderate)", marginRight: "8px", borderRadius: "2px" }}></div>
              <span>Moderate accessibility (50-80%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ width: "16px", height: "3px", backgroundColor: "var(--route-limited)", marginRight: "8px", borderRadius: "2px" }}></div>
              <span>Limited accessibility (&lt;50%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: "16px", height: "3px", backgroundColor: "var(--route-default)", marginRight: "8px", borderRadius: "2px" }}></div>
              <span>Not optimized</span>
            </div>
          </div>
        </div>
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
