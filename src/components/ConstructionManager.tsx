import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Construction,
  MapPin,
  Calendar,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';

export interface ConstructionBlockade {
  id: string;
  coordinates: [number, number];
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  startDate: string;
  endDate?: string;
  type: 'construction' | 'maintenance' | 'closure' | 'other';
  radius: number; // meters - area of effect
  reportedBy?: string;
  createdAt: string;
}

interface ConstructionManagerProps {
  map: mapboxgl.Map | null;
  isMapLoaded: boolean;
  onBlockadesChange: (blockades: ConstructionBlockade[]) => void;
  className?: string;
}

const ConstructionManager: React.FC<ConstructionManagerProps> = ({
  map,
  isMapLoaded,
  onBlockadesChange,
  className
}) => {
  const [blockades, setBlockades] = useState<ConstructionBlockade[]>(() => {
    const saved = localStorage.getItem('construction-blockades');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddMode, setIsAddMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBlockade, setSelectedBlockade] = useState<ConstructionBlockade | null>(null);
  const [newBlockade, setNewBlockade] = useState({
    title: '',
    description: '',
    severity: 'medium' as const,
    type: 'construction' as const,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    radius: 50
  });

  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  // Save blockades to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('construction-blockades', JSON.stringify(blockades));
    onBlockadesChange(blockades);
  }, [blockades, onBlockadesChange]);

  // Add markers to map when blockades or map changes
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    // Remove existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers
    blockades.forEach(blockade => {
      const markerElement = document.createElement('div');
      markerElement.className = 'construction-marker';
      markerElement.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s;
        background-color: ${getSeverityColor(blockade.severity)};
      `;

      markerElement.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
        </svg>
      `;

      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.1)';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      markerElement.addEventListener('click', () => {
        setSelectedBlockade(blockade);
        setIsDialogOpen(true);
      });

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat(blockade.coordinates)
        .addTo(map);

      // Add popup on hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15
      }).setHTML(`
        <div style="padding: 8px; max-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 4px;">${blockade.title}</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${blockade.type.charAt(0).toUpperCase() + blockade.type.slice(1)}</div>
          <div style="font-size: 12px;">${blockade.description}</div>
        </div>
      `);

      markerElement.addEventListener('mouseenter', () => {
        popup.setLngLat(blockade.coordinates).addTo(map);
      });

      markerElement.addEventListener('mouseleave', () => {
        popup.remove();
      });

      markersRef.current[blockade.id] = marker;
    });

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
    };
  }, [map, isMapLoaded, blockades]);

  // Handle map clicks when in add mode
  useEffect(() => {
    if (!map || !isAddMode) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      const blockade: ConstructionBlockade = {
        id: Date.now().toString(),
        coordinates,
        title: newBlockade.title || 'New Construction Area',
        description: newBlockade.description || 'Construction or maintenance work in progress',
        severity: newBlockade.severity,
        type: newBlockade.type,
        startDate: newBlockade.startDate,
        endDate: newBlockade.endDate || undefined,
        radius: newBlockade.radius,
        createdAt: new Date().toISOString()
      };

      setBlockades(prev => [...prev, blockade]);
      setIsAddMode(false);

      // Reset form
      setNewBlockade({
        title: '',
        description: '',
        severity: 'medium',
        type: 'construction',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        radius: 50
      });
    };

    map.on('click', handleMapClick);
    map.getCanvas().style.cursor = 'crosshair';

    return () => {
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [map, isAddMode, newBlockade]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#f59e0b';
      case 'medium': return '#ef4444';
      case 'high': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const deleteBlockade = (id: string) => {
    setBlockades(prev => prev.filter(b => b.id !== id));
    setIsDialogOpen(false);
    setSelectedBlockade(null);
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Construction className="h-5 w-5" />
            Construction Alerts
            <Badge variant="secondary">{blockades.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Alert title"
                value={newBlockade.title}
                onChange={(e) => setNewBlockade(prev => ({ ...prev, title: e.target.value }))}
              />
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={newBlockade.severity}
                onChange={(e) => setNewBlockade(prev => ({ ...prev, severity: e.target.value as any }))}
              >
                <option value="low">Low Impact</option>
                <option value="medium">Medium Impact</option>
                <option value="high">High Impact</option>
              </select>
            </div>

            <Textarea
              placeholder="Description of the blockade..."
              value={newBlockade.description}
              onChange={(e) => setNewBlockade(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={newBlockade.type}
                onChange={(e) => setNewBlockade(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <option value="construction">Construction</option>
                <option value="maintenance">Maintenance</option>
                <option value="closure">Closure</option>
                <option value="other">Other</option>
              </select>
              <Input
                type="number"
                placeholder="Radius (m)"
                value={newBlockade.radius}
                onChange={(e) => setNewBlockade(prev => ({ ...prev, radius: parseInt(e.target.value) || 50 }))}
              />
            </div>

            <Button
              onClick={() => setIsAddMode(!isAddMode)}
              className={`w-full ${isAddMode ? 'bg-red-600 hover:bg-red-700' : ''}`}
              variant={isAddMode ? 'destructive' : 'default'}
            >
              {isAddMode ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Cancel Adding - Click anywhere to add
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Construction Alert
                </>
              )}
            </Button>
          </div>

          {blockades.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <h4 className="font-medium text-sm">Active Alerts:</h4>
              {blockades.map((blockade) => (
                <div
                  key={blockade.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-md cursor-pointer hover:bg-muted/80"
                  onClick={() => {
                    setSelectedBlockade(blockade);
                    setIsDialogOpen(true);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{blockade.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${getSeverityBadge(blockade.severity)}`}>
                        {blockade.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {blockade.type}
                      </span>
                    </div>
                  </div>
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Construction className="h-5 w-5" />
              Construction Alert Details
            </DialogTitle>
          </DialogHeader>
          {selectedBlockade && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedBlockade.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedBlockade.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm capitalize">{selectedBlockade.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Badge className={`text-xs ${getSeverityBadge(selectedBlockade.severity)}`}>
                    {selectedBlockade.severity}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <p className="text-sm">{new Date(selectedBlockade.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Radius</label>
                  <p className="text-sm">{selectedBlockade.radius}m</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteBlockade(selectedBlockade.id)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Alert
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConstructionManager;