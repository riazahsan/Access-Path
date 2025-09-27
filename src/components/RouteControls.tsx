import React from 'react';
import { AccessibilityFilter } from '@/types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface RouteControlsProps {
  filters: AccessibilityFilter;
  onFiltersChange: (filters: AccessibilityFilter) => void;
  routeCount?: number;
}

const RouteControls: React.FC<RouteControlsProps> = ({
  filters,
  onFiltersChange,
  routeCount = 0
}) => {
  const handleFilterChange = (filterKey: keyof AccessibilityFilter, value: boolean) => {
    onFiltersChange({
      ...filters,
      [filterKey]: value
    });
  };

  const filterOptions = [
    {
      key: 'showAccessible' as keyof AccessibilityFilter,
      label: 'Accessible Routes',
      description: 'Fully accessible pathways',
      color: 'bg-green-500',
      count: routeCount
    },
    {
      key: 'showPartial' as keyof AccessibilityFilter,
      label: 'Partially Accessible',
      description: 'Routes with limited accessibility',
      color: 'bg-yellow-500',
      count: 0
    },
    {
      key: 'showCurbCuts' as keyof AccessibilityFilter,
      label: 'Curb Cuts',
      description: 'Wheelchair accessible curb ramps',
      color: 'bg-blue-500',
      count: 0
    },
    {
      key: 'showParking' as keyof AccessibilityFilter,
      label: 'ADA Parking',
      description: 'Accessible parking spaces',
      color: 'bg-purple-500',
      count: 0
    },
    {
      key: 'showElevators' as keyof AccessibilityFilter,
      label: 'Elevators',
      description: 'Building elevators for accessibility',
      color: 'bg-indigo-500',
      count: 0
    }
  ];

  return (
    <Card className="p-4 shadow-accessible">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            Accessibility Features
          </h3>
          <p className="text-sm text-muted-foreground">
            Toggle different accessibility features on the map
          </p>
        </div>

        <div className="space-y-3">
          {filterOptions.map((option) => (
            <div key={option.key} className="flex items-start space-x-3">
              <Checkbox
                id={option.key}
                checked={filters[option.key]}
                onCheckedChange={(checked) => 
                  handleFilterChange(option.key, checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-1 rounded ${option.color}`} />
                  <label 
                    htmlFor={option.key}
                    className="text-sm font-medium cursor-pointer select-none"
                  >
                    {option.label}
                  </label>
                  {option.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {option.count}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Layers:</span>
            <Badge variant="outline">
              {Object.values(filters).filter(Boolean).length} / {filterOptions.length}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RouteControls;