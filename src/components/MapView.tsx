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
  const [mapboxToken, setMapboxToken] = useState<string>('pk.eyJ1IjoicmlhemExNjIiLCJhIjoiY21nMmhkeG05MDdtcDJycG95aDNkNGRrayJ9.okIiL_beCCP6u1W6kdX02w');
  const [tokenError, setTokenError] = useState<boolean>(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      // Initialize map with token
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-80.4201, 37.2296], // Virginia Tech coordinates
        zoom: 16,
        pitch: 0,
        bearing: 0
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        if (!map.current) return;

        // Add route source
        map.current.addSource('routes', {
          type: 'geojson',
          data: routes
        });

        // Add accessible routes layer
        map.current.addLayer({
          id: 'accessible-routes',
          type: 'line',
          source: 'routes',
          filter: ['==', ['get', 'accessibility'], 'accessible'],
          paint: {
            'line-color': 'hsl(159, 84%, 35%)', // Success green
            'line-width': [
              'case',
              ['==', ['get', 'id'], selectedRoute || ''],
              6, // Wider for selected route
              4
            ],
            'line-opacity': 0.8
          }
        });

        // Add partial accessibility routes layer
        map.current.addLayer({
          id: 'partial-routes',
          type: 'line',
          source: 'routes',
          filter: ['==', ['get', 'accessibility'], 'partial'],
          paint: {
            'line-color': 'hsl(45, 93%, 47%)', // Warning orange
            'line-width': [
              'case',
              ['==', ['get', 'id'], selectedRoute || ''],
              6,
              4
            ],
            'line-opacity': 0.8,
            'line-dasharray': [2, 2] // Dashed for partial accessibility
          }
        });

        // Add building markers (placeholder for future implementation)
        routes.features.forEach((feature) => {
          const coords = feature.geometry.coordinates[0];
          
          // Create custom marker
          const marker = new mapboxgl.Marker({
            color: 'hsl(159, 84%, 35%)',
            scale: 0.8
          })
            .setLngLat(coords as [number, number])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div class="p-2">
                    <h3 class="font-semibold text-sm">${feature.properties.name}</h3>
                    <p class="text-xs text-muted-foreground">
                      ${feature.properties.estimatedTime} min walk
                    </p>
                    <p class="text-xs">
                      Accessibility: <span class="font-medium">${feature.properties.accessibility}</span>
                    </p>
                  </div>
                `)
            )
            .addTo(map.current!);
        });

        // Add click handlers for route selection
        map.current.on('click', 'accessible-routes', (e) => {
          if (e.features && e.features[0] && onRouteSelect) {
            const routeId = e.features[0].properties?.id;
            if (routeId) onRouteSelect(routeId);
          }
        });

        map.current.on('click', 'partial-routes', (e) => {
          if (e.features && e.features[0] && onRouteSelect) {
            const routeId = e.features[0].properties?.id;
            if (routeId) onRouteSelect(routeId);
          }
        });

        // Change cursor on hover
        map.current.on('mouseenter', 'accessible-routes', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'accessible-routes', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
      });

      setTokenError(false);
    } catch (error) {
      console.error('Mapbox initialization error:', error);
      setTokenError(true);
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, routes, selectedRoute, onRouteSelect]);

  // Update route visibility based on filters
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const accessibleVisible = filters.showAccessible;
    const partialVisible = filters.showPartial;

    map.current.setLayoutProperty(
      'accessible-routes',
      'visibility',
      accessibleVisible ? 'visible' : 'none'
    );

    map.current.setLayoutProperty(
      'partial-routes', 
      'visibility',
      partialVisible ? 'visible' : 'none'
    );
  }, [filters]);

  if (!mapboxToken) {
    return (
      <div className="relative w-full h-screen bg-accent flex items-center justify-center">
        <Card className="p-6 max-w-md mx-4 shadow-accessible">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary">Mapbox Token Required</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Enter your Mapbox public token to view the campus map
              </p>
            </div>
            
            {tokenError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Invalid token. Please check your Mapbox public token.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbH..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Get your token from{' '}
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  mapbox.com
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Map overlay gradient for better UI visibility */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/20 to-transparent" />
      </div>
    </div>
  );
};

export default MapView;