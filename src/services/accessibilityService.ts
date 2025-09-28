import RBush from 'rbush';
import { distance, nearestPointOnLine } from '@turf/turf';
import type { Feature, LineString, Point } from 'geojson';

// Types for accessibility data
export interface AccessibleRoute {
  id: number;
  geometry: LineString;
  properties: {
    objectid: number;
    type: string;
    length: number;
  };
}

export interface AccessibilityFeature {
  id: number;
  coordinates: [number, number];
  type: 'curb-cut' | 'elevator' | 'entrance' | 'parking';
  properties: any;
}

export interface RouteSegment {
  startCoord: [number, number];
  endCoord: [number, number];
  distance: number;
  isAccessible: boolean;
  accessibleAlternative?: AccessibleRoute;
}

export interface AccessibilityIndex {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  route: AccessibleRoute;
}

export interface AccessibilityData {
  routes: AccessibleRoute[];
  curbCuts: AccessibilityFeature[];
  elevators: AccessibilityFeature[];
  entrances: AccessibilityFeature[];
  parking: AccessibilityFeature[];
}

class AccessibilityService {
  private routeIndex: RBush<AccessibilityIndex>;
  private data: AccessibilityData | null = null;
  private isLoaded = false;

  constructor() {
    this.routeIndex = new RBush();
  }

  /**
   * Load and index all accessibility data
   */
  async loadAccessibilityData(): Promise<void> {
    if (this.isLoaded) return;

    console.log('🔄 Loading accessibility data...');

    try {
      // Load all accessibility data files
      const [routesData, curbCutsData, elevatorsData, entrancesData, parkingData] = await Promise.all([
        this.loadGeoJSON('./src/data/accessibilityData/accessroutes.geojson'),
        this.loadGeoJSON('./src/data/accessibilityData/curbcuts.geojson'),
        this.loadGeoJSON('./src/data/accessibilityData/elevators.geojson'),
        this.loadGeoJSON('./src/data/accessibilityData/accessibleentrances.geojson'),
        this.loadGeoJSON('./src/data/accessibilityData/adaparkingspaces.geojson'),
      ]);

      // Process and structure the data
      this.data = {
        routes: this.processRoutes(routesData),
        curbCuts: this.processFeatures(curbCutsData, 'curb-cut'),
        elevators: this.processFeatures(elevatorsData, 'elevator'),
        entrances: this.processFeatures(entrancesData, 'entrance'),
        parking: this.processFeatures(parkingData, 'parking'),
      };

      // Build spatial index for routes
      this.buildSpatialIndex();

      this.isLoaded = true;
      console.log('✅ Accessibility data loaded successfully');
      console.log(`📊 Loaded ${this.data.routes.length} accessible routes`);
      console.log(`📊 Loaded ${this.data.curbCuts.length} curb cuts`);
      console.log(`📊 Loaded ${this.data.elevators.length} elevators`);
      console.log(`📊 Loaded ${this.data.entrances.length} accessible entrances`);

    } catch (error) {
      console.error('❌ Failed to load accessibility data:', error);
      throw error;
    }
  }

  /**
   * Load a GeoJSON file
   */
  private async loadGeoJSON(path: string): Promise<any> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Process accessible routes data
   */
  private processRoutes(geojson: any): AccessibleRoute[] {
    return geojson.features.map((feature: any) => ({
      id: feature.id,
      geometry: feature.geometry,
      properties: {
        objectid: feature.properties.objectid,
        type: feature.properties.type || 'Normal',
        length: feature.properties['st_length(shape)'] || 0,
      },
    }));
  }

  /**
   * Process accessibility features (curb cuts, elevators, etc.)
   */
  private processFeatures(geojson: any, type: AccessibilityFeature['type']): AccessibilityFeature[] {
    return geojson.features.map((feature: any) => {
      // Extract coordinates based on geometry type
      let coordinates: [number, number];
      if (feature.geometry.type === 'Point') {
        coordinates = feature.geometry.coordinates;
      } else if (feature.geometry.type === 'Polygon') {
        // Use centroid for polygons
        const coords = feature.geometry.coordinates[0];
        const sumLon = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
        const sumLat = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
        coordinates = [sumLon / coords.length, sumLat / coords.length];
      } else {
        // Default fallback
        coordinates = [0, 0];
      }

      return {
        id: feature.id,
        coordinates,
        type,
        properties: feature.properties,
      };
    });
  }

  /**
   * Build spatial index for fast proximity queries
   */
  private buildSpatialIndex(): void {
    if (!this.data) return;

    console.log('🗂️ Building spatial index...');

    const indexItems: AccessibilityIndex[] = this.data.routes.map((route) => {
      const coords = route.geometry.coordinates;
      const lons = coords.map(coord => coord[0]);
      const lats = coords.map(coord => coord[1]);

      return {
        minX: Math.min(...lons),
        minY: Math.min(...lats),
        maxX: Math.max(...lons),
        maxY: Math.max(...lats),
        route,
      };
    });

    this.routeIndex.load(indexItems);
    console.log('✅ Spatial index built successfully');
  }

  /**
   * Find accessible routes near a given point
   */
  findNearbyAccessibleRoutes(
    point: [number, number],
    maxDistance: number = 50 // meters
  ): AccessibleRoute[] {
    if (!this.isLoaded || !this.data) {
      console.warn('⚠️ Accessibility data not loaded');
      return [];
    }

    // Convert distance to approximate degrees (rough approximation)
    const distanceDegrees = maxDistance / 111000; // ~111km per degree

    // Search in bounding box
    const candidates = this.routeIndex.search({
      minX: point[0] - distanceDegrees,
      minY: point[1] - distanceDegrees,
      maxX: point[0] + distanceDegrees,
      maxY: point[1] + distanceDegrees,
    });

    // Filter by actual distance
    const nearbyRoutes: AccessibleRoute[] = [];
    const pointFeature: Feature<Point> = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: point },
      properties: {},
    };

    for (const candidate of candidates) {
      const routeFeature: Feature<LineString> = {
        type: 'Feature',
        geometry: candidate.route.geometry,
        properties: {},
      };

      const nearestPoint = nearestPointOnLine(routeFeature, pointFeature);
      const actualDistance = distance(pointFeature, nearestPoint, { units: 'meters' });

      if (actualDistance <= maxDistance) {
        nearbyRoutes.push(candidate.route);
      }
    }

    return nearbyRoutes.sort((a, b) => {
      // Sort by distance to point
      const distA = this.getDistanceToRoute(point, a);
      const distB = this.getDistanceToRoute(point, b);
      return distA - distB;
    });
  }

  /**
   * Get distance from point to route
   */
  private getDistanceToRoute(point: [number, number], route: AccessibleRoute): number {
    const pointFeature: Feature<Point> = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: point },
      properties: {},
    };

    const routeFeature: Feature<LineString> = {
      type: 'Feature',
      geometry: route.geometry,
      properties: {},
    };

    const nearestPoint = nearestPointOnLine(routeFeature, pointFeature);
    return distance(pointFeature, nearestPoint, { units: 'meters' });
  }

  /**
   * Find curb cuts near a point
   */
  findNearbyCurbCuts(point: [number, number], maxDistance: number = 25): AccessibilityFeature[] {
    if (!this.data) return [];

    return this.data.curbCuts.filter(curbCut => {
      const pointFeature: Feature<Point> = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: point },
        properties: {},
      };

      const curbCutFeature: Feature<Point> = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: curbCut.coordinates },
        properties: {},
      };

      const dist = distance(pointFeature, curbCutFeature, { units: 'meters' });
      return dist <= maxDistance;
    });
  }

  /**
   * Get accessibility data
   */
  getAccessibilityData(): AccessibilityData | null {
    return this.data;
  }

  /**
   * Check if data is loaded
   */
  isDataLoaded(): boolean {
    return this.isLoaded;
  }
}

// Export singleton instance
export const accessibilityService = new AccessibilityService();
export default accessibilityService;