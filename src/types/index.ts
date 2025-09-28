// Accessibility filter interface
export interface AccessibilityFilter {
  showAccessible: boolean;
  showEntrances: boolean;
  showAisles: boolean;
  showCurbCuts: boolean;
  showParking: boolean;
  showAccessible2: boolean;
}

// Route feature properties
export interface RouteProperties {
  id: string;
  name: string;
  accessibility: 'accessible' | 'partial' | 'not-accessible';
  estimatedTime: number;
  difficulty?: 'easy' | 'moderate' | 'difficult';
  description?: string;
  features?: AccessibilityFeature[];
}

// Individual accessibility features
export interface AccessibilityFeature {
  type: 'curb-cut' | 'elevator' | 'ramp' | 'accessible-entrance' | 'parking';
  location: [number, number]; // [longitude, latitude]
  description?: string;
  status?: 'working' | 'out-of-order' | 'maintenance';
}

// GeoJSON route feature
export interface RouteFeature {
  type: 'Feature';
  properties: RouteProperties;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

// Collection of routes
export interface RouteCollection {
  type: 'FeatureCollection';
  features: RouteFeature[];
}

// Building information
export interface Building {
  id: string;
  name: string;
  shortName?: string;
  coordinates: [number, number];
  accessibility?: {
    hasElevator: boolean;
    hasAccessibleEntrance: boolean;
    hasAccessibleParking: boolean;
    hasAccessibleRestrooms: boolean;
    wheelchairAccessible: boolean;
  };
  accessibilityRating?: number;
  amenities?: string[];
  entrances?: {
    accessible: boolean;
    coordinates: [number, number];
    description: string;
  }[];
  description?: string;
}

// Route API request interface
export interface RouteRequest {
  startBuilding: Building;
  endBuilding: Building;
  preferences?: {
    avoidStairs: boolean;
    preferRamps: boolean;
    maxDistance?: number;
  };
}

// Route API response interface
export interface RouteResponse {
  success: boolean;
  route?: {
    coordinates: [number, number][];
    distance: number;
    duration: number;
    accessibility: 'accessible' | 'partial' | 'not-accessible';
    instructions?: string[];
  };
  error?: string;
}

// Map view state
export interface MapViewState {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
}

// Filter presets
export const DEFAULT_FILTERS: AccessibilityFilter = {
  showAccessible: true,
  showEntrances: true,
  showAisles: true,
  showCurbCuts: true,
  showParking: true,
  showAccessible2: true,
};

// Accessibility levels with colors
export const ACCESSIBILITY_COLORS = {
  accessible: '#22c55e',     // Green
  partial: '#f59e0b',        // Orange/Yellow
  'not-accessible': '#ef4444', // Red
  'curb-cuts': '#3b82f6',    // Blue
  parking: '#8b5cf6',        // Purple
  elevators: '#6366f1',      // Indigo
} as const;

// Map bounds for Virginia Tech campus
export const VT_CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [-80.445, 37.215], // Southwest
  [-80.395, 37.245]  // Northeast
];

export const VT_CAMPUS_CENTER: [number, number] = [-80.416748046875, 37.229217529296875];

// Waypoint interface
export interface Waypoint {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: 'start' | 'end' | 'waypoint';
  address?: string;
  description?: string;
  timestamp: Date;
}

// Coordinate input interface
export interface CoordinateInput {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

// Route planning state
export interface RoutePlanningState {
  waypoints: Waypoint[];
  currentStep: 'start' | 'waypoints' | 'end' | 'planning' | 'navigating';
  isPlanning: boolean;
  selectedRoute?: string;
  routeInfo?: any;
}