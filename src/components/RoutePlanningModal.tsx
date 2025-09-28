import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Navigation,
  MapPin,
  Search,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  Star
} from 'lucide-react';
import { Building, RouteRequest, RouteResponse } from '@/types';
import { buildings, searchBuildings } from '@/data/buildings';
import { useToast } from '@/hooks/use-toast';

interface RoutePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoutePlan: (startBuilding: Building, endBuilding: Building) => void;
  className?: string;
}

const RoutePlanningModal: React.FC<RoutePlanningModalProps> = ({
  isOpen,
  onClose,
  onRoutePlan,
  className = ''
}) => {
  const [startBuilding, setStartBuilding] = useState<Building | null>(null);
  const [endBuilding, setEndBuilding] = useState<Building | null>(null);
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<Building[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<Building[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  const { toast } = useToast();

  // Handle start building search
  const handleStartSearch = useCallback((query: string) => {
    setStartQuery(query);
    if (query.trim()) {
      const suggestions = searchBuildings(query).slice(0, 5);
      setStartSuggestions(suggestions);
      setShowStartSuggestions(true);
    } else {
      setStartSuggestions([]);
      setShowStartSuggestions(false);
    }
  }, []);

  // Handle end building search
  const handleEndSearch = useCallback((query: string) => {
    setEndQuery(query);
    if (query.trim()) {
      const suggestions = searchBuildings(query).slice(0, 5);
      setEndSuggestions(suggestions);
      setShowEndSuggestions(true);
    } else {
      setEndSuggestions([]);
      setShowEndSuggestions(false);
    }
  }, []);

  // Select start building
  const selectStartBuilding = useCallback((building: Building) => {
    setStartBuilding(building);
    setStartQuery(building.name);
    setShowStartSuggestions(false);
  }, []);

  // Select end building
  const selectEndBuilding = useCallback((building: Building) => {
    setEndBuilding(building);
    setEndQuery(building.name);
    setShowEndSuggestions(false);
  }, []);


  // Handle route planning
  const handleRoutePlan = async () => {
    if (!startBuilding || !endBuilding) {
      toast({
        title: "Missing Information",
        description: "Please select both start and end buildings.",
        variant: "destructive"
      });
      return;
    }

    if (startBuilding.id === endBuilding.id) {
      toast({
        title: "Same Building Selected",
        description: "Please select different buildings for start and end points.",
        variant: "destructive"
      });
      return;
    }

    setIsPlanning(true);
    try {
      console.log('🏢 RoutePlanningModal: Planning route between:', {
        start: startBuilding,
        end: endBuilding
      });

      // Pass buildings to parent component for route generation
      onRoutePlan(startBuilding, endBuilding);
      toast({
        title: "Route Planning Started",
        description: `Planning accessible route from ${startBuilding.name} to ${endBuilding.name}`,
      });
      onClose();
    } catch (error) {
      console.error('Route planning failed:', error);
      toast({
        title: "Route Planning Failed",
        description: "Unable to generate route. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPlanning(false);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setStartBuilding(null);
    setEndBuilding(null);
    setStartQuery('');
    setEndQuery('');
    setStartSuggestions([]);
    setEndSuggestions([]);
    setShowStartSuggestions(false);
    setShowEndSuggestions(false);
    setIsPlanning(false);
  };

  // Handle modal close
  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderBuildingCard = (building: Building, onSelect: (building: Building) => void) => (
    <Card
      key={building.id}
      className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onSelect(building)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium">{building.name}</h4>
          {building.shortName && (
            <p className="text-xs text-gray-500">{building.shortName}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {building.accessibilityRating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span className="text-xs">{building.accessibilityRating}/5</span>
            </div>
          )}
          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      {building.amenities && building.amenities.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {building.amenities.slice(0, 2).map((amenity, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {building.amenities.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{building.amenities.length - 2} more
            </Badge>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Plan Accessible Route
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Route Overview */}
          {startBuilding && endBuilding && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 flex-1">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">{startBuilding.name}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-green-600" />
              <div className="flex items-center gap-2 flex-1">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">{endBuilding.name}</span>
              </div>
            </div>
          )}

          {/* Start Building Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              From (Start Building)
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search for starting building..."
                  value={startQuery}
                  onChange={(e) => handleStartSearch(e.target.value)}
                  onFocus={() => startQuery && setShowStartSuggestions(true)}
                  className="pl-10"
                />
              </div>
              {showStartSuggestions && startSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {startSuggestions.map((building) =>
                      renderBuildingCard(building, selectStartBuilding)
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* End Building Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              To (Destination Building)
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search for destination building..."
                  value={endQuery}
                  onChange={(e) => handleEndSearch(e.target.value)}
                  onFocus={() => endQuery && setShowEndSuggestions(true)}
                  className="pl-10"
                />
              </div>
              {showEndSuggestions && endSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {endSuggestions.map((building) =>
                      renderBuildingCard(building, selectEndBuilding)
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Route Planning Button */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4" />
              {startBuilding && endBuilding ?
                'Ready to plan accessible route' :
                'Select both buildings to continue'
              }
            </div>
            <Button
              onClick={handleRoutePlan}
              disabled={!startBuilding || !endBuilding || isPlanning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPlanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Planning Route...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Plan Route
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              <span>Routes are optimized for wheelchair accessibility</span>
            </div>
            <p>• All suggested routes avoid stairs and prefer ramps</p>
            <p>• Buildings are rated by accessibility features</p>
            <p>• Search by building name or nickname (e.g., "Squires" for "Squires Student Center")</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoutePlanningModal;