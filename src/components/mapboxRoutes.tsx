// utils/mapboxRoutes.ts
import mapboxgl from "mapbox-gl";
import { routeOptimizer, type OptimizedRoute } from "../services/routeOptimizer";

export interface RouteResult {
  distance: number;   // meters
  duration: number;   // seconds
  geometry: GeoJSON.LineString;
  accessibilityScore?: number;
  improvements?: string[];
  warnings?: string[];
}

/**
 * Request a route and render it on the map.
 * @param map - Mapbox map instance
 * @param start - [lng, lat] start coordinate
 * @param end - [lng, lat] end coordinate
 */
export async function getRoute(
  map: mapboxgl.Map,
  start: [number, number],
  end: [number, number]
): Promise<RouteResult | null> {
  if (!map) return null;

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json.routes || json.routes.length === 0) {
      console.warn("No routes found");
      return null;
    }

    const data = json.routes[0];
    let optimizedRoute: OptimizedRoute | null = null;
    let finalGeometry = data.geometry;

    // Optimize route for accessibility
    try {
      console.log('🔄 Optimizing route for accessibility...');
      const originalCoordinates = data.geometry.coordinates as [number, number][];
      optimizedRoute = await routeOptimizer.optimizeRouteForAccessibility(originalCoordinates);

      if (optimizedRoute && optimizedRoute.coordinates.length > 0) {
        console.log('✅ Route optimized for accessibility');
        console.log(`📊 Accessibility score: ${(optimizedRoute.accessibilityScore * 100).toFixed(1)}%`);

        // Use optimized coordinates
        finalGeometry = {
          type: "LineString",
          coordinates: optimizedRoute.coordinates
        };
      }
    } catch (error) {
      console.warn('⚠️ Failed to optimize route for accessibility:', error);
      // Fall back to original route
    }

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: finalGeometry,
    };

    // Update or create route layer with accessibility-aware styling
    const routeColor = optimizedRoute
      ? (optimizedRoute.accessibilityScore > 0.8 ? "#22c55e" : optimizedRoute.accessibilityScore > 0.5 ? "#f59e0b" : "#ef4444")
      : "#3887be";

    if (map.getSource("route")) {
      console.log('🔄 Updating existing route source');
      (map.getSource("route") as mapboxgl.GeoJSONSource).setData(geojson);

      // Update route color based on accessibility
      if (map.getLayer("route")) {
        map.setPaintProperty("route", "line-color", routeColor);
      }
    } else {
      console.log('➕ Creating new route source and layer');
      map.addSource("route", { type: "geojson", data: geojson });

      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
          "visibility": "visible"
        },
        paint: {
          "line-color": routeColor,
          "line-width": 6,
          "line-opacity": 0.9
        },
      });
    }

    // Ensure route layer is visible and on top
    if (map.getLayer("route")) {
      map.setLayoutProperty("route", "visibility", "visible");
      console.log('✅ Route layer visibility set to visible');
    }

    // --- NEW: add turn instructions to sidebar with accessibility info ---
    const instructions = document.getElementById("instructions");
    if (instructions) {
      const steps = data.legs[0].steps;
      let tripInstructions = "";

      for (const step of steps) {
        tripInstructions += `<li>${step.maneuver.instruction}</li>`;
      }

      // Calculate final distance (use optimized distance if available)
      const finalDistance = optimizedRoute ? optimizedRoute.totalDistance : data.distance;
      const finalDuration = optimizedRoute
        ? Math.floor((data.duration * optimizedRoute.totalDistance) / data.distance)
        : data.duration;

      let accessibilityInfo = "";
      if (optimizedRoute) {
        const scorePercent = (optimizedRoute.accessibilityScore * 100).toFixed(1);
        const scoreColor = optimizedRoute.accessibilityScore > 0.8 ? "green" :
                          optimizedRoute.accessibilityScore > 0.5 ? "orange" : "red";

        accessibilityInfo = `
          <div style="margin: 10px 0; padding: 8px; border-radius: 4px; background: #f3f4f6;">
            <p><strong>♿ Accessibility Score: <span style="color: ${scoreColor}">${scorePercent}%</span></strong></p>
            ${optimizedRoute.improvements.length > 0 ? `
              <details>
                <summary style="cursor: pointer; font-weight: bold;">✅ Improvements (${optimizedRoute.improvements.length})</summary>
                <ul style="margin: 5px 0;">
                  ${optimizedRoute.improvements.map(imp => `<li style="font-size: 0.9em;">${imp}</li>`).join('')}
                </ul>
              </details>
            ` : ''}
            ${optimizedRoute.warnings.length > 0 ? `
              <details>
                <summary style="cursor: pointer; font-weight: bold;">⚠️ Warnings (${optimizedRoute.warnings.length})</summary>
                <ul style="margin: 5px 0;">
                  ${optimizedRoute.warnings.map(warn => `<li style="font-size: 0.9em; color: #dc2626;">${warn}</li>`).join('')}
                </ul>
              </details>
            ` : ''}
          </div>
        `;
      }

      instructions.innerHTML = `
        <p id="prompt">📍 Click the map to get directions to another destination</p>
        <p><strong>Trip duration: ${Math.floor(finalDuration / 60)} min 👩‍🦽 </strong></p>
        <p><strong>Distance: ${Math.round(finalDistance)}m</strong></p>
        ${accessibilityInfo}
        <ol>${tripInstructions}</ol>
      `;
    }

    return {
      distance: optimizedRoute ? optimizedRoute.totalDistance : data.distance,
      duration: data.duration,
      geometry: finalGeometry,
      accessibilityScore: optimizedRoute?.accessibilityScore,
      improvements: optimizedRoute?.improvements,
      warnings: optimizedRoute?.warnings
    };
  } catch (err) {
    console.error("Error fetching route:", err);
    return null;
  }
}

