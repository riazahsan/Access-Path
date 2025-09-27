import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Navigation, 
  MapPin, 
  Target, 
  Plus, 
  X, 
  ArrowRight,
  CheckCircle,
  Clock,
  Footprints,
  AlertCircle
} from 'lucide-react';
import { Waypoint, RoutePlanningState } from '@/types';
import WaypointInput from './WaypointInput';

interface RoutePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoutePlan: (waypoints: Waypoint[]) => void;
  onMapClick?: (coordinates: [number, number]) => void;
  onSearch?: (query: string) => Promise<{ coordinates: [number, number]; address: string }[]>;
  onGeolocation?: () => Promise<[number, number]>;
  className?: string;
}

const RoutePlanningModal: React.FC<RoutePlanningModalProps> = ({
  isOpen,
  onClose,
  onRoutePlan,
  onMapClick,
  onSearch,
  onGeolocation,
  className = ''
}) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [currentStep, setCurrentStep] = useState<'start' | 'waypoints' | 'end' | 'planning'>('start');
  const [isPlanning, setIsPlanning] = useState(false);
  const [isMapClickMode, setIsMapClickMode] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setWaypoints([]);
      setCurrentStep('start');
      setIsPlanning(false);
      setIsMapClickMode(false);
    }
  }, [isOpen]);

  // Handle map click mode
  const handleMapClickMode = () => {
    setIsMapClickMode(true);
    onClose(); // Close modal temporarily
  };

  // Handle coordinates received from map click
  const handleMapCoordinates = (coordinates: [number, number]) => {
    if (isMapClickMode && onMapClick) {
      onMapClick(coordinates);
      setIsMapClickMode(false);
    }
  };

  // Handle waypoint addition
  const handleWaypointAdd = (waypoint: Waypoint) => {
    setWaypoints(prev => [...prev, waypoint]);
    
    // Update current step
    if (waypoints.length === 0) {
      setCurrentStep('waypoints');
    } else if (waypoints.length >= 1) {
      setCurrentStep('end');
    }
  };

  // Handle waypoint removal
  const handleWaypointRemove = (waypointId: string) => {
    setWaypoints(prev => {
      const newWaypoints = prev.filter(wp => wp.id !== waypointId);
      
      // Update current step
      if (newWaypoints.length === 0) {
        setCurrentStep('start');
      } else if (newWaypoints.length === 1) {
        setCurrentStep('waypoints');
      }
      
      return newWaypoints;
    });
  };

  // Handle waypoint update
  const handleWaypointUpdate = (waypointId: string, updates: Partial<Waypoint>) => {
    setWaypoints(prev => 
      prev.map(wp => wp.id === waypointId ? { ...wp, ...updates } : wp)
    );
  };

  // Handle route planning
  const handleRoutePlan = async () => {
    if (waypoints.length < 2) return;
    
    setIsPlanning(true);
    try {
      await onRoutePlan(waypoints);
      onClose();
    } catch (error) {
      console.error('Route planning failed:', error);
    } finally {
      setIsPlanning(false);
    }
  };

  // Get step progress
  const getStepProgress = () => {
    const totalSteps = 3; // start, waypoints, end
    const currentStepIndex = currentStep === 'start' ? 0 : 
                            currentStep === 'waypoints' ? 1 : 
                            currentStep === 'end' ? 2 : 3;
    return (currentStepIndex / totalSteps) * 100;
  };

  // Get step description
  const getStepDescription = () => {
    switch (currentStep) {
      case 'start':
        return 'Add your starting point to begin planning your route';
      case 'waypoints':
        return 'Add any intermediate stops along your route (optional)';
      case 'end':
        return 'Add your destination to complete the route';
      default:
        return 'Planning your accessible route...';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Plan Your Route
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Route Planning Progress</span>
              <Badge variant="outline">
                {waypoints.length} waypoints
              </Badge>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
            <p className="text-xs text-gray-600">{getStepDescription()}</p>
          </div>

          {/* Waypoints List */}
          {waypoints.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Route Overview</h3>
              <div className="space-y-2">
                {waypoints.map((waypoint, index) => (
                  <div key={waypoint.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {waypoint.type === 'start' ? (
                        <Navigation className="w-4 h-4 text-green-600" />
                      ) : waypoint.type === 'end' ? (
                        <Target className="w-4 h-4 text-red-600" />
                      ) : (
                        <MapPin className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm font-medium">{waypoint.name}</span>
                    </div>
                    
                    {index < waypoints.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waypoint Input */}
          <WaypointInput
            waypoints={waypoints}
            onWaypointAdd={handleWaypointAdd}
            onWaypointRemove={handleWaypointRemove}
            onWaypointUpdate={handleWaypointUpdate}
            onMapClick={handleMapClickMode}
            onSearch={onSearch}
            onGeolocation={onGeolocation}
            maxWaypoints={10}
          />

          {/* Route Planning Actions */}
          {waypoints.length >= 2 && (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Route Ready</p>
                  <p className="text-xs text-green-700">
                    {waypoints.length} waypoints • Ready to plan
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRoutePlan}
                disabled={isPlanning}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPlanning ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Planning...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    Plan Route
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Click on the map to add waypoints</p>
            <p>• Use search to find specific locations</p>
            <p>• Use "My Location" to start from your current position</p>
            <p>• You can add up to 10 waypoints for complex routes</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoutePlanningModal;
