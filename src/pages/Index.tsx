import React, { useState, useCallback } from 'react';
import MapView from '@/components/MapView';
import RouteControls from '@/components/RouteControls';
import Header from '@/components/Header';
import RoutePlanningModal from '@/components/RoutePlanningModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AccessibilityFilter, Waypoint, RouteResponse } from '@/types';
import { demoRoutes } from '@/data/demoRoutes';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

const Index = () => {
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [filters, setFilters] = useState<AccessibilityFilter>({
    showAccessible: true,
    showPartial: true,
    showCurbCuts: true,
    showParking: true,
    showElevators: true,
  });
  
  // Route planning state
  const [isRoutePlanningOpen, setIsRoutePlanningOpen] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  
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

  // Route planning handlers
  const handleRoutePlanningOpen = useCallback(() => {
    setIsRoutePlanningOpen(true);
  }, []);

  const handleRoutePlanningClose = useCallback(() => {
    setIsRoutePlanningOpen(false);
  }, []);

  const handleRoutePlan = useCallback(async (routeResponse: RouteResponse) => {
    if (routeResponse.success && routeResponse.route) {
      // Convert route response to waypoints for compatibility
      const newWaypoints: Waypoint[] = routeResponse.route.coordinates.map((coord, index) => ({
        id: `route-point-${index}`,
        name: index === 0 ? 'Start' : index === routeResponse.route!.coordinates.length - 1 ? 'End' : `Point ${index}`,
        coordinates: coord,
        type: index === 0 ? 'start' : index === routeResponse.route!.coordinates.length - 1 ? 'end' : 'waypoint',
        timestamp: new Date()
      }));

      setWaypoints(newWaypoints);
      toast({
        title: "Route Planned Successfully",
        description: `${routeResponse.route.distance.toFixed(0)}m accessible route planned (${routeResponse.route.duration.toFixed(0)} min walk)`,
      });
    } else {
      toast({
        title: "Route Planning Failed",
        description: routeResponse.error || "Unable to generate route",
        variant: "destructive"
      });
    }
    setIsRoutePlanningOpen(false);
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
          filters={filters}
          onFiltersChange={handleFiltersChange}
          routeCount={demoRoutes.features.length}
        />

        {/* Plan Route Button */}
        <div className="absolute top-4 right-4 z-20">
          <Button
            onClick={handleRoutePlanningOpen}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Plan Route
          </Button>
        </div>
      </div>

      {/* Route Planning Modal */}
      <RoutePlanningModal
        isOpen={isRoutePlanningOpen}
        onClose={handleRoutePlanningClose}
        onRoutePlan={handleRoutePlan}
      />

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
