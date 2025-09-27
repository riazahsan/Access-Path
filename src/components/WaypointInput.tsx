import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Plus, 
  X, 
  Search, 
  Navigation, 
  Target,
  Map,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building,
  Home,
  Car,
  Footprints
} from 'lucide-react';
import { Waypoint, CoordinateInput } from '@/types';

interface WaypointInputProps {
  onWaypointAdd: (waypoint: Waypoint) => void;
  onWaypointRemove: (waypointId: string) => void;
  onWaypointUpdate: (waypointId: string, waypoint: Partial<Waypoint>) => void;
  waypoints: Waypoint[];
  onMapClick?: (coordinates: [number, number]) => void;
  onSearch?: (query: string) => Promise<{ coordinates: [number, number]; address: string }[]>;
  onGeolocation?: () => Promise<[number, number]>;
  maxWaypoints?: number;
  className?: string;
}

const WaypointInput: React.FC<WaypointInputProps> = ({
  onWaypointAdd,
  onWaypointRemove,
  onWaypointUpdate,
  waypoints,
  onMapClick,
  onSearch,
  onGeolocation,
  maxWaypoints = 10,
  className = ''
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [currentInput, setCurrentInput] = useState<CoordinateInput>({
    latitude: 0,
    longitude: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ coordinates: [number, number]; address: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inputMethod, setInputMethod] = useState<'coordinates' | 'search' | 'map' | 'geolocation'>('coordinates');
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Validate coordinates
  const validateCoordinates = (lat: number, lng: number): string[] => {
    const errors: string[] = [];
    
    if (isNaN(lat) || isNaN(lng)) {
      errors.push('Coordinates must be valid numbers');
    }
    
    if (lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90');
    }
    
    if (lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180');
    }
    
    // Check if coordinates are within Virginia Tech campus bounds
    const VT_BOUNDS = {
      north: 37.245,
      south: 37.215,
      east: -80.395,
      west: -80.445
    };
    
    if (lat < VT_BOUNDS.south || lat > VT_BOUNDS.north || 
        lng < VT_BOUNDS.west || lng > VT_BOUNDS.east) {
      errors.push('Coordinates are outside Virginia Tech campus bounds');
    }
    
    return errors;
  };

  // Handle coordinate input
  const handleCoordinateInput = (field: 'latitude' | 'longitude', value: string) => {
    const numValue = parseFloat(value);
    setCurrentInput(prev => ({
      ...prev,
      [field]: numValue
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !onSearch) return;
    
    setIsSearching(true);
    try {
      const results = await onSearch(searchQuery);
      setSearchResults(results);
    } catch (error) {
      setErrors(['Search failed. Please try again.']);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle geolocation
  const handleGeolocation = async () => {
    if (!onGeolocation) return;
    
    setIsValidating(true);
    try {
      const coordinates = await onGeolocation();
      setCurrentInput({
        latitude: coordinates[1],
        longitude: coordinates[0]
      });
      setInputMethod('coordinates');
    } catch (error) {
      setErrors(['Geolocation failed. Please enable location access.']);
    } finally {
      setIsValidating(false);
    }
  };

  // Add waypoint
  const handleAddWaypoint = () => {
    const errors = validateCoordinates(currentInput.latitude, currentInput.longitude);
    
    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    const waypoint: Waypoint = {
      id: `waypoint-${Date.now()}`,
      name: currentInput.name || `Waypoint ${waypoints.length + 1}`,
      coordinates: [currentInput.longitude, currentInput.latitude],
      type: waypoints.length === 0 ? 'start' : 
            waypoints.length === maxWaypoints - 1 ? 'end' : 'waypoint',
      address: currentInput.address,
      description: currentInput.name,
      timestamp: new Date()
    };

    onWaypointAdd(waypoint);
    setCurrentInput({ latitude: 0, longitude: 0 });
    setIsAdding(false);
    setErrors([]);
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: { coordinates: [number, number]; address: string }) => {
    setCurrentInput({
      latitude: result.coordinates[1],
      longitude: result.coordinates[0],
      address: result.address
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  // Handle map click
  const handleMapClick = () => {
    if (onMapClick) {
      // This will be handled by the parent component
      setInputMethod('map');
    }
  };

  // Get waypoint type icon
  const getWaypointIcon = (type: Waypoint['type']) => {
    switch (type) {
      case 'start': return <Navigation className="w-4 h-4 text-green-600" />;
      case 'end': return <Target className="w-4 h-4 text-red-600" />;
      case 'waypoint': return <MapPin className="w-4 h-4 text-blue-600" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  // Get waypoint type color
  const getWaypointColor = (type: Waypoint['type']) => {
    switch (type) {
      case 'start': return 'bg-green-100 border-green-300 text-green-800';
      case 'end': return 'bg-red-100 border-red-300 text-red-800';
      case 'waypoint': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Waypoints List */}
      {waypoints.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Route Waypoints</h3>
          {waypoints.map((waypoint, index) => (
            <Card key={waypoint.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getWaypointIcon(waypoint.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{waypoint.name}</span>
                      <Badge variant="outline" className={getWaypointColor(waypoint.type)}>
                        {waypoint.type}
                      </Badge>
                    </div>
                    {waypoint.address && (
                      <p className="text-xs text-gray-500 truncate">{waypoint.address}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {waypoint.coordinates[1].toFixed(6)}, {waypoint.coordinates[0].toFixed(6)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">#{index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onWaypointRemove(waypoint.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Waypoint Section */}
      {waypoints.length < maxWaypoints && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                {waypoints.length === 0 ? 'Add Starting Point' : 
                 waypoints.length === maxWaypoints - 1 ? 'Add Destination' : 
                 'Add Waypoint'}
              </h3>
              <Badge variant="outline">
                {waypoints.length + 1} of {maxWaypoints}
              </Badge>
            </div>

            {/* Input Method Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={inputMethod === 'coordinates' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMethod('coordinates')}
                className="text-xs"
              >
                <Map className="w-3 h-3 mr-1" />
                Coordinates
              </Button>
              <Button
                variant={inputMethod === 'search' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMethod('search')}
                className="text-xs"
                disabled={!onSearch}
              >
                <Search className="w-3 h-3 mr-1" />
                Search
              </Button>
              <Button
                variant={inputMethod === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={handleMapClick}
                className="text-xs"
                disabled={!onMapClick}
              >
                <MapPin className="w-3 h-3 mr-1" />
                Map Click
              </Button>
              <Button
                variant={inputMethod === 'geolocation' ? 'default' : 'outline'}
                size="sm"
                onClick={handleGeolocation}
                className="text-xs"
                disabled={!onGeolocation || isValidating}
              >
                {isValidating ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3 mr-1" />
                )}
                My Location
              </Button>
            </div>

            {/* Coordinate Input */}
            {inputMethod === 'coordinates' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="37.2292"
                      value={currentInput.latitude || ''}
                      onChange={(e) => handleCoordinateInput('latitude', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="-80.4167"
                      value={currentInput.longitude || ''}
                      onChange={(e) => handleCoordinateInput('longitude', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="name" className="text-xs">Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="Enter waypoint name"
                    value={currentInput.name || ''}
                    onChange={(e) => setCurrentInput(prev => ({ ...prev, name: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {/* Search Input */}
            {inputMethod === 'search' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for a location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    size="sm"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <Card
                        key={index}
                        className="p-2 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSearchResultSelect(result)}
                      >
                        <p className="text-sm font-medium">{result.address}</p>
                        <p className="text-xs text-gray-500">
                          {result.coordinates[1].toFixed(6)}, {result.coordinates[0].toFixed(6)}
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Map Click Instructions */}
            {inputMethod === 'map' && (
              <div className="text-center py-4">
                <MapPin className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <p className="text-sm text-gray-600">
                  Click on the map to select a location
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  The selected coordinates will appear here
                </p>
              </div>
            )}

            {/* Geolocation Instructions */}
            {inputMethod === 'geolocation' && (
              <div className="text-center py-4">
                <Navigation className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-gray-600">
                  {isValidating ? 'Getting your location...' : 'Click to use your current location'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Make sure location access is enabled
                </p>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <ul className="space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Add Button */}
            <Button
              onClick={handleAddWaypoint}
              disabled={!currentInput.latitude || !currentInput.longitude || errors.length > 0}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {waypoints.length === 0 ? 'Set Starting Point' : 
               waypoints.length === maxWaypoints - 1 ? 'Set Destination' : 
               'Add Waypoint'}
            </Button>
          </div>
        </Card>
      )}

      {/* Route Planning Actions */}
      {waypoints.length >= 2 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-medium text-green-800">Ready to Plan Route</h3>
          </div>
          <p className="text-xs text-green-700 mb-3">
            You have {waypoints.length} waypoints. Click "Plan Route" to get directions.
          </p>
          <Button className="w-full bg-green-600 hover:bg-green-700">
            <Navigation className="w-4 h-4 mr-2" />
            Plan Route
          </Button>
        </Card>
      )}
    </div>
  );
};

export default WaypointInput;
