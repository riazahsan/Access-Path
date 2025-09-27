import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RouteFeature, AccessibilityFilter } from '@/types';
import { MapPin, Clock, Navigation, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RouteControlsProps {
  routes: RouteFeature[];
  selectedRoute?: string;
  filters: AccessibilityFilter;
  onRouteSelect: (routeId: string) => void;
  onFiltersChange: (filters: AccessibilityFilter) => void;
}

const RouteControls: React.FC<RouteControlsProps> = ({
  routes,
  selectedRoute,
  filters,
  onRouteSelect,
  onFiltersChange
}) => {
  const getAccessibilityIcon = (accessibility: string) => {
    switch (accessibility) {
      case 'accessible':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const getAccessibilityBadge = (accessibility: string) => {
    switch (accessibility) {
      case 'accessible':
        return <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20">Accessible</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-warning/10 text-warning hover:bg-warning/20">Partial</Badge>;
      default:
        return <Badge variant="destructive">Not Accessible</Badge>;
    }
  };

  const filteredRoutes = routes.filter(route => {
    const { accessibility } = route.properties;
    if (accessibility === 'accessible' && !filters.showAccessible) return false;
    if (accessibility === 'partial' && !filters.showPartial) return false;
    if (accessibility === 'not-accessible' && !filters.showNonAccessible) return false;
    return true;
  });

  return (
    <Card className="absolute top-4 left-4 w-80 max-h-[calc(100vh-2rem)] overflow-hidden shadow-accessible z-10 bg-card/95 backdrop-blur-sm border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-primary">Campus Routes</h2>
        </div>
        
        {/* Quick route selector */}
        <Select value={selectedRoute || ''} onValueChange={onRouteSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a route..." />
          </SelectTrigger>
          <SelectContent>
            {filteredRoutes.map((route) => (
              <SelectItem key={route.properties.id} value={route.properties.id}>
                <div className="flex items-center gap-2">
                  {getAccessibilityIcon(route.properties.accessibility)}
                  <span className="truncate">{route.properties.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {/* Accessibility filters */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Show Routes:</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.showAccessible ? "default" : "outline"}
              size="sm"
              onClick={() => onFiltersChange({ ...filters, showAccessible: !filters.showAccessible })}
              className="text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Accessible
            </Button>
            <Button
              variant={filters.showPartial ? "secondary" : "outline"}
              size="sm"
              onClick={() => onFiltersChange({ ...filters, showPartial: !filters.showPartial })}
              className="text-xs"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Partial
            </Button>
          </div>
        </div>

        {/* Route list */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Available Routes:</h3>
          {filteredRoutes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No routes match your current filters
            </p>
          ) : (
            <div className="space-y-2">
              {filteredRoutes.map((route) => (
                <div
                  key={route.properties.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-soft ${
                    selectedRoute === route.properties.id
                      ? 'border-primary bg-primary/5 shadow-soft'
                      : 'border-border hover:border-primary/40 bg-card'
                  }`}
                  onClick={() => onRouteSelect(route.properties.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium leading-tight">
                        {route.properties.name}
                      </h4>
                      {getAccessibilityIcon(route.properties.accessibility)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {route.properties.estimatedTime} min
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {route.properties.difficulty}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {getAccessibilityBadge(route.properties.accessibility)}
                      <span className="text-xs text-muted-foreground capitalize">
                        {route.properties.surfaceType}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteControls;