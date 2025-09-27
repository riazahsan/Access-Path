// Accessibility filter interface
export interface AccessibilityFilter {
  showAccessible: boolean;
  showPartial: boolean;
  showCurbCuts: boolean;
  showParking: boolean;
  showElevators: boolean;
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
  coordinates: [number, number];
  accessibility: {
    hasElevator: boolean;
    hasAccessibleEntrance: boolean;
    hasAccessibleParking: boolean;
    hasAccessibleRestrooms: boolean;
    wheelchairAccessible: boolean;
  };
  description?: string;
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
  showPartial: true,
  showCurbCuts: true,
  showParking: true,
  showElevators: true,
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