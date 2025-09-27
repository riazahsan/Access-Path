import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Accessibility, Map, Info } from 'lucide-react';

interface HeaderProps {
  onInfoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onInfoClick }) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-gradient-primary text-primary-foreground shadow-accessible">
      <div className="container mx-auto px-4 py-3">
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
    </header>
  );
};

export default Header;