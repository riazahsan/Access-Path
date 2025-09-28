import React, { useState, useCallback } from 'react';
import MapView from '@/components/MapView';
import LayerControlMenu from '@/components/LayerControlMenu';
import Header from '@/components/Header';
import RoutePlanningModal from '@/components/RoutePlanningModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AccessibilityFilter, Waypoint, Building } from '@/types';
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
  const [plannedRoute, setPlannedRoute] = useState<{
    start: [number, number];
    end: [number, number];
    startName: string;
    endName: string;
  } | null>(null);
  
  const { toast } = useToast();

  const handleRouteSelect = useCallback((routeId: string) => {
    setSelectedRoute(routeId);
    toast({
      title: "Route Selected",
      description: "Route has been selected",
    });
  }, [toast]);

  const handleFiltersChange = useCallback((newFilters: AccessibilityFilter) => {
    console.log('🔄 Index: Received filter change:', newFilters);
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

  const handleRoutePlan = useCallback(async (startBuilding: Building, endBuilding: Building) => {
    try {
      // Create waypoints for the selected buildings
      const startWaypoint: Waypoint = {
        id: 'start',
        name: startBuilding.name,
        coordinates: startBuilding.coordinates,
        type: 'start',
        timestamp: new Date()
      };

      const endWaypoint: Waypoint = {
        id: 'end',
        name: endBuilding.name,
        coordinates: endBuilding.coordinates,
        type: 'end',
        timestamp: new Date()
      };

      setWaypoints([startWaypoint, endWaypoint]);

      // Set the planned route state which will be passed to MapView
      const routeData = {
        start: startBuilding.coordinates,
        end: endBuilding.coordinates,
        startName: startBuilding.name,
        endName: endBuilding.name
      };

      console.log('🚀 Setting planned route state:', routeData);
      setPlannedRoute(routeData);

      // Also dispatch the event as backup
      window.dispatchEvent(new CustomEvent('drawRoute', {
        detail: routeData
      }));

      toast({
        title: "Route Planning Complete",
        description: `Route from ${startBuilding.name} to ${endBuilding.name} will be displayed on the map`,
      });
    } catch (error) {
      console.error('Route planning failed:', error);
      toast({
        title: "Route Planning Failed",
        description: "Unable to generate route. Please try again.",
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
          routes={{ type: 'FeatureCollection', features: [] }}
          selectedRoute={selectedRoute}
          filters={filters}
          onRouteSelect={handleRouteSelect}
          onFiltersChange={handleFiltersChange}
          plannedRoute={plannedRoute}
        />
        
        {/* Layer control menu */}
        <LayerControlMenu
          filters={filters}
          onFiltersChange={handleFiltersChange}
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
