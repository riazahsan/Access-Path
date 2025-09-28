import React, { useState } from 'react';
import { AccessibilityFilter } from '@/types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { getAccessibilityDataCounts } from '@/utils/accessibilityData';

interface LayerControlMenuProps {
  filters: AccessibilityFilter;
  onFiltersChange: (filters: AccessibilityFilter) => void;
  routeCount?: number;
  className?: string;
}

const LayerControlMenu: React.FC<LayerControlMenuProps> = ({
  filters,
  onFiltersChange,
  routeCount = 0,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (filterKey: keyof AccessibilityFilter, value: boolean) => {
    console.log(`🔄 LayerControl: Changing ${filterKey} to ${value}`);
    onFiltersChange({
      ...filters,
      [filterKey]: value
    });
  };

  // Get real data counts
  const dataCounts = getAccessibilityDataCounts();

  const filterOptions = [
    {
      key: 'showAccessible' as keyof AccessibilityFilter,
      label: 'Accessible Routes',
      description: 'Fully accessible pathways',
      color: 'bg-green-500',
      legendColor: '#22c55e',
      count: dataCounts.accessRoutes + routeCount
    },
    {
      key: 'showPartial' as keyof AccessibilityFilter,
      label: 'Accessible Entrances',
      description: 'Accessible building entrances (pink spheres)',
      color: 'bg-pink-500',
      legendColor: '#ec4899',
      count: dataCounts.accessibleEntrances
    },
    {
      key: 'showCurbCuts' as keyof AccessibilityFilter,
      label: 'Curb Cuts',
      description: 'Wheelchair accessible curb ramps',
      color: 'bg-blue-500',
      legendColor: '#3b82f6',
      count: dataCounts.curbCuts
    },
    {
      key: 'showParking' as keyof AccessibilityFilter,
      label: 'ADA Parking',
      description: 'Accessible parking spaces',
      color: 'bg-purple-500',
      legendColor: '#8b5cf6',
      count: dataCounts.adaParkingSpaces
    },
    {
      key: 'showElevators' as keyof AccessibilityFilter,
      label: 'Elevators',
      description: 'Building elevators for accessibility',
      color: 'bg-orange-500',
      legendColor: '#f97316',
      count: dataCounts.elevators
    }
  ];

  const activeLayersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className={`fixed top-20 left-4 z-30 ${className}`}>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white hover:bg-gray-50 text-gray-800 shadow-lg border border-gray-200 flex items-center gap-2"
        size="sm"
      >
        <Layers className="h-4 w-4" />
        <span>Layers</span>
        <Badge variant="secondary" className="text-xs">
          {activeLayersCount}
        </Badge>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Expanded Menu */}
      {isExpanded && (
        <Card className="mt-2 p-4 shadow-lg border-0 bg-white/95 backdrop-blur-sm max-w-[280px]">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Map Layers
              </h3>
              <p className="text-sm text-gray-600">
                Toggle accessibility features on the map
              </p>
            </div>

            {/* Filter Checkboxes */}
            <div className="space-y-3">
              {filterOptions.map((option) => (
                <div key={option.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={option.key}
                    checked={filters[option.key]}
                    onCheckedChange={(checked) => 
                      handleFilterChange(option.key, checked as boolean)
                    }
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`w-4 h-1 rounded ${option.color}`}
                        style={{ backgroundColor: option.legendColor }}
                      />
                      <label 
                        htmlFor={option.key}
                        className="text-sm font-medium cursor-pointer select-none text-gray-700 flex-1"
                      >
                        {option.label}
                      </label>
                      {option.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>


            {/* Active Layers Counter */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 text-xs">Active Layers:</span>
                <Badge variant="outline" className="text-xs">
                  {activeLayersCount} / {filterOptions.length}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LayerControlMenu;
