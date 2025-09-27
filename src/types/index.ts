// Types for wheelchair accessibility navigation app

export interface RouteFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    accessibility: 'accessible' | 'partial' | 'not-accessible';
    surfaceType: string;
    difficulty: 'easy' | 'moderate' | 'challenging';
    landmarks: string[];
    estimatedTime: number; // in minutes
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export interface RouteCollection {
  type: 'FeatureCollection';
  features: RouteFeature[];
}

export interface Building {
  id: string;
  name: string;
  shortName: string;
  coordinates: [number, number];
  accessibilityRating: number; // 1-5 scale
  amenities: string[];
  entrances: {
    accessible: boolean;
    coordinates: [number, number];
    description: string;
  }[];
}

export interface AccessibilityFilter {
  showAccessible: boolean;
  showPartial: boolean;
  showNonAccessible: boolean;
  surfaceTypes: string[];
  maxDifficulty: 'easy' | 'moderate' | 'challenging';
}