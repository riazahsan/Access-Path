import React, { useState, useCallback } from 'react';
import MapView from '@/components/MapView';
import RouteControls from '@/components/RouteControls';
import Header from '@/components/Header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AccessibilityFilter } from '@/types';
import { demoRoutes } from '@/data/demoRoutes';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [filters, setFilters] = useState<AccessibilityFilter>({
    showAccessible: true,
    showPartial: true,
    showNonAccessible: false,
    surfaceTypes: ['paved', 'mixed'],
    maxDifficulty: 'challenging'
  });
  
  const { toast } = useToast();

  const handleRouteSelect = useCallback((routeId: string) => {
    setSelectedRoute(routeId);
    const route = demoRoutes.features.find(f => f.properties.id === routeId);
    if (route) {
      toast({
        title: "Route Selected",
        description: `${route.properties.name} - ${route.properties.estimatedTime} min walk`,
      });
    }
  }, [toast]);

  const handleFiltersChange = useCallback((newFilters: AccessibilityFilter) => {
    setFilters(newFilters);
  }, []);

  const handleInfoClick = useCallback(() => {
    toast({
      title: "Campus Navigator",
      description: "Helping you find wheelchair accessible routes across Virginia Tech campus.",
    });
  }, [toast]);

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Header */}
      <Header onInfoClick={handleInfoClick} />
      
      {/* Main content area - adjusted for header */}
      <div className="relative w-full h-screen pt-16">
        {/* Map view */}
        <MapView
          routes={demoRoutes}
          selectedRoute={selectedRoute}
          filters={filters}
          onRouteSelect={handleRouteSelect}
        />
        
        {/* Route controls overlay */}
        <RouteControls
          routes={demoRoutes.features}
          selectedRoute={selectedRoute}
          filters={filters}
          onRouteSelect={handleRouteSelect}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Info Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <div />
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <div className="h-5 w-5 bg-gradient-primary rounded" />
              </div>
              About Campus Navigator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>
              Campus Navigator helps students and visitors find wheelchair accessible routes 
              across Virginia Tech campus.
            </p>
            <div className="space-y-2">
              <h4 className="font-medium">Features:</h4>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>• Wheelchair accessible route planning</li>
                <li>• Real-time navigation with Mapbox</li>
                <li>• Building accessibility information</li>
                <li>• Surface type and difficulty ratings</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              This is a demo version. Add your GeoJSON data and Mapbox token to customize for your campus.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
