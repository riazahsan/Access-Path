import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Accessibility, Map, Info, Plus } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import ConstructionDropdown, { type ConstructionBlockade } from '@/components/ConstructionDropdown';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { RouteResponse } from '@/types';

interface HeaderProps {
  onInfoClick?: () => void;
  onPlanRouteClick?: () => void;
  map?: any;
  isMapLoaded?: boolean;
  constructionBlockades?: ConstructionBlockade[];
  onConstructionBlockadesChange?: (blockades: ConstructionBlockade[]) => void;
  plannedRoute?: {
    start: [number, number];
    end: [number, number];
    startName: string;
    endName: string;
  } | null;
  currentRouteResponse?: RouteResponse | null;
}

const Header: React.FC<HeaderProps> = ({
  onInfoClick,
  onPlanRouteClick,
  map,
  isMapLoaded,
  constructionBlockades,
  onConstructionBlockadesChange,
  plannedRoute,
  currentRouteResponse
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-gradient-primary text-primary-foreground shadow-accessible">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Accessibility className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Campus Navigator</h1>
                <p className="text-xs text-primary-foreground/80">Wheelchair Accessible Routes</p>
              </div>
            </div>
          </div>

          {/* Status and actions */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/20 text-primary-foreground hover:bg-white/30">
              <Map className="h-3 w-3 mr-1" />
              Virginia Tech
            </Badge>

            {/* Control buttons */}
            <div className="flex items-center gap-2">
              <ThemeToggle className="text-primary-foreground" />

              {onPlanRouteClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPlanRouteClick}
                  className="text-primary-foreground hover:bg-white/20"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Plan Route
                </Button>
              )}

              {map && onConstructionBlockadesChange && (
                <div className="[&_button]:text-primary-foreground [&_button]:hover:bg-white/20 [&_button]:bg-transparent [&_button]:border-white/30">
                  <ConstructionDropdown
                    map={map}
                    isMapLoaded={isMapLoaded || false}
                    onBlockadesChange={onConstructionBlockadesChange}
                    className="text-primary-foreground hover:bg-white/20 bg-transparent border-white/30"
                  />
                </div>
              )}

              {plannedRoute && currentRouteResponse && (
                <div className="[&_button]:text-primary-foreground [&_button]:hover:bg-white/20 [&_button]:bg-transparent [&_button]:border-white/30">
                  <QRCodeGenerator
                    routeResponse={currentRouteResponse}
                    plannedRoute={plannedRoute}
                  />
                </div>
              )}

              {onInfoClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onInfoClick}
                  className="text-primary-foreground hover:bg-white/20"
                >
                  <Info className="h-4 w-4 mr-1" />
                  About
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;