import { distance, lineString, nearestPointOnLine, along } from '@turf/turf';
import type { Feature, LineString, Point } from 'geojson';
import { accessibilityService, type AccessibleRoute, type RouteSegment } from './accessibilityService';

export interface OptimizedRoute {
  coordinates: [number, number][];
  totalDistance: number;
  accessibilityScore: number; // 0-1, where 1 is fully accessible
  segments: RouteSegment[];
  improvements: string[];
  warnings: string[];
}

export interface RouteOptimizationOptions {
  maxDetourDistance: number; // Maximum detour in meters
  snapThreshold: number; // Distance threshold for snapping to accessible routes
  preferredAccessibility: 'strict' | 'balanced' | 'flexible';
  includeCurbCuts: boolean;
  includeElevators: boolean;
}

class RouteOptimizer {
  private defaultOptions: RouteOptimizationOptions = {
    maxDetourDistance: 100,
    snapThreshold: 30,
    preferredAccessibility: 'balanced',
    includeCurbCuts: true,
    includeElevators: true,
  };

  /**
   * Optimize a route for accessibility
   */
  async optimizeRouteForAccessibility(
    originalRoute: [number, number][],
    options: Partial<RouteOptimizationOptions> = {}
  ): Promise<OptimizedRoute> {
    const opts = { ...this.defaultOptions, ...options };

    console.log('🔄 Optimizing route for accessibility...');
    console.log(`📏 Original route: ${originalRoute.length} points`);

    // Ensure accessibility data is loaded
    if (!accessibilityService.isDataLoaded()) {
      await accessibilityService.loadAccessibilityData();
    }

    // Segment the original route
    const segments = this.segmentRoute(originalRoute);
    console.log(`🔗 Created ${segments.length} route segments`);

    // Analyze each segment for accessibility
    const analyzedSegments = await this.analyzeSegments(segments, opts);

    // Apply accessibility improvements
    const optimizedSegments = await this.applyAccessibilityImprovements(analyzedSegments, opts);

    // Reconstruct the route
    const optimizedRoute = this.reconstructRoute(optimizedSegments);

    // Calculate metrics
    const result: OptimizedRoute = {
      coordinates: optimizedRoute,
      totalDistance: this.calculateTotalDistance(optimizedRoute),
      accessibilityScore: this.calculateAccessibilityScore(optimizedSegments),
      segments: optimizedSegments,
      improvements: this.generateImprovements(analyzedSegments, optimizedSegments),
      warnings: this.generateWarnings(optimizedSegments),
    };

    console.log('✅ Route optimization complete');
    console.log(`📊 Accessibility score: ${(result.accessibilityScore * 100).toFixed(1)}%`);
    console.log(`📏 Total distance: ${result.totalDistance.toFixed(0)}m`);

    return result;
  }

  /**
   * Segment a route into analyzable chunks
   */
  private segmentRoute(route: [number, number][], segmentLength: number = 50): RouteSegment[] {
    const segments: RouteSegment[] = [];
    const routeLine = lineString(route);

    for (let i = 0; i < route.length - 1; i++) {
      const startCoord = route[i];
      const endCoord = route[i + 1];

      const segmentDistance = distance(
        { type: 'Point', coordinates: startCoord },
        { type: 'Point', coordinates: endCoord },
        { units: 'meters' }
      );

      segments.push({
        startCoord,
        endCoord,
        distance: segmentDistance,
        isAccessible: false, // Will be determined during analysis
      });
    }

    return segments;
  }

  /**
   * Analyze segments for accessibility
   */
  private async analyzeSegments(
    segments: RouteSegment[],
    options: RouteOptimizationOptions
  ): Promise<RouteSegment[]> {
    console.log('🔍 Analyzing segments for accessibility...');

    const analyzedSegments = await Promise.all(
      segments.map(async (segment) => {
        // Find nearby accessible routes
        const midpoint: [number, number] = [
          (segment.startCoord[0] + segment.endCoord[0]) / 2,
          (segment.startCoord[1] + segment.endCoord[1]) / 2,
        ];

        const nearbyRoutes = accessibilityService.findNearbyAccessibleRoutes(
          midpoint,
          options.snapThreshold
        );

        if (nearbyRoutes.length > 0) {
          // Find the best accessible alternative
          const bestRoute = this.findBestAccessibleAlternative(
            segment,
            nearbyRoutes,
            options
          );

          if (bestRoute) {
            return {
              ...segment,
              isAccessible: true,
              accessibleAlternative: bestRoute,
            };
          }
        }

        return {
          ...segment,
          isAccessible: false,
        };
      })
    );

    const accessibleCount = analyzedSegments.filter(s => s.isAccessible).length;
    console.log(`✅ Found accessible alternatives for ${accessibleCount}/${segments.length} segments`);

    return analyzedSegments;
  }

  /**
   * Find the best accessible alternative for a segment
   */
  private findBestAccessibleAlternative(
    segment: RouteSegment,
    candidates: AccessibleRoute[],
    options: RouteOptimizationOptions
  ): AccessibleRoute | null {
    let bestRoute: AccessibleRoute | null = null;
    let bestScore = -1;

    for (const candidate of candidates) {
      const score = this.scoreAccessibleRoute(segment, candidate, options);
      if (score > bestScore) {
        bestScore = score;
        bestRoute = candidate;
      }
    }

    return bestRoute;
  }

  /**
   * Score an accessible route alternative
   */
  private scoreAccessibleRoute(
    segment: RouteSegment,
    route: AccessibleRoute,
    options: RouteOptimizationOptions
  ): number {
    // Calculate detour distance
    const originalDistance = segment.distance;
    const alternativeDistance = this.calculateRouteSegmentDistance(segment, route);
    const detour = alternativeDistance - originalDistance;

    // Penalize excessive detours
    if (detour > options.maxDetourDistance) {
      return 0;
    }

    // Calculate score based on:
    // 1. Detour penalty (less detour = higher score)
    // 2. Route type bonus
    // 3. Accessibility preference

    let score = 1.0;

    // Detour penalty (0.5 to 1.0)
    const detourPenalty = Math.max(0.5, 1 - (detour / options.maxDetourDistance));
    score *= detourPenalty;

    // Route type bonus
    if (route.properties.type === 'Accessible') {
      score *= 1.2;
    } else if (route.properties.type === 'Normal') {
      score *= 1.0;
    }

    // Length bonus (prefer longer accessible segments)
    const lengthBonus = Math.min(1.1, 1 + (route.properties.length / 1000));
    score *= lengthBonus;

    return score;
  }

  /**
   * Calculate distance for a route segment using an accessible alternative
   */
  private calculateRouteSegmentDistance(segment: RouteSegment, route: AccessibleRoute): number {
    // This is a simplified calculation
    // In a real implementation, you'd calculate the actual path distance
    return route.properties.length;
  }

  /**
   * Apply accessibility improvements to segments
   */
  private async applyAccessibilityImprovements(
    segments: RouteSegment[],
    options: RouteOptimizationOptions
  ): Promise<RouteSegment[]> {
    console.log('🔧 Applying accessibility improvements...');

    const improvedSegments = segments.map(segment => {
      if (segment.isAccessible && segment.accessibleAlternative) {
        // Use the accessible alternative
        const altRoute = segment.accessibleAlternative;
        const coordinates = altRoute.geometry.coordinates;

        return {
          ...segment,
          startCoord: coordinates[0] as [number, number],
          endCoord: coordinates[coordinates.length - 1] as [number, number],
          distance: altRoute.properties.length,
        };
      }

      return segment;
    });

    // Add curb cuts at street crossings if enabled
    if (options.includeCurbCuts) {
      await this.addCurbCutWaypoints(improvedSegments);
    }

    return improvedSegments;
  }

  /**
   * Add curb cut waypoints for street crossings
   */
  private async addCurbCutWaypoints(segments: RouteSegment[]): Promise<void> {
    for (const segment of segments) {
      // Find curb cuts near segment endpoints
      const startCurbCuts = accessibilityService.findNearbyCurbCuts(segment.startCoord, 25);
      const endCurbCuts = accessibilityService.findNearbyCurbCuts(segment.endCoord, 25);

      // This is simplified - in practice you'd analyze the route to determine
      // if curb cuts are needed and modify the segment accordingly
    }
  }

  /**
   * Reconstruct route from optimized segments
   */
  private reconstructRoute(segments: RouteSegment[]): [number, number][] {
    const coordinates: [number, number][] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // Add start coordinate
      if (i === 0) {
        coordinates.push(segment.startCoord);
      }

      // If using an accessible alternative, add all its coordinates
      if (segment.accessibleAlternative) {
        const altCoords = segment.accessibleAlternative.geometry.coordinates;
        // Skip the first coordinate to avoid duplication
        coordinates.push(...altCoords.slice(1) as [number, number][]);
      } else {
        // Add end coordinate
        coordinates.push(segment.endCoord);
      }
    }

    return coordinates;
  }

  /**
   * Calculate total distance of a route
   */
  private calculateTotalDistance(route: [number, number][]): number {
    let totalDistance = 0;

    for (let i = 0; i < route.length - 1; i++) {
      const dist = distance(
        { type: 'Point', coordinates: route[i] },
        { type: 'Point', coordinates: route[i + 1] },
        { units: 'meters' }
      );
      totalDistance += dist;
    }

    return totalDistance;
  }

  /**
   * Calculate accessibility score (0-1)
   */
  private calculateAccessibilityScore(segments: RouteSegment[]): number {
    if (segments.length === 0) return 0;

    const accessibleSegments = segments.filter(s => s.isAccessible).length;
    return accessibleSegments / segments.length;
  }

  /**
   * Generate improvement descriptions
   */
  private generateImprovements(
    originalSegments: RouteSegment[],
    optimizedSegments: RouteSegment[]
  ): string[] {
    const improvements: string[] = [];

    const originalAccessible = originalSegments.filter(s => s.isAccessible).length;
    const optimizedAccessible = optimizedSegments.filter(s => s.isAccessible).length;

    if (optimizedAccessible > originalAccessible) {
      improvements.push(
        `Improved accessibility for ${optimizedAccessible - originalAccessible} route segments`
      );
    }

    const accessibleRoutes = optimizedSegments.filter(s => s.accessibleAlternative).length;
    if (accessibleRoutes > 0) {
      improvements.push(`Utilizing ${accessibleRoutes} accessible pathway(s)`);
    }

    return improvements;
  }

  /**
   * Generate warnings for non-accessible segments
   */
  private generateWarnings(segments: RouteSegment[]): string[] {
    const warnings: string[] = [];

    const nonAccessibleSegments = segments.filter(s => !s.isAccessible);
    if (nonAccessibleSegments.length > 0) {
      warnings.push(
        `${nonAccessibleSegments.length} segment(s) may have limited accessibility`
      );
    }

    return warnings;
  }
}

// Export singleton instance
export const routeOptimizer = new RouteOptimizer();
export default routeOptimizer;