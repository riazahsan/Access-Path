// utils/mapboxRoutes.ts
import mapboxgl from "mapbox-gl";

export interface RouteResult {
  distance: number;   // meters
  duration: number;   // seconds
  geometry: GeoJSON.LineString;
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
    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: data.geometry,
    };

    // Update or create route layer
    if (map.getSource("route")) {
      console.log('🔄 Updating existing route source');
      (map.getSource("route") as mapboxgl.GeoJSONSource).setData(geojson);
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
          "line-color": "#3887be",
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

    // --- NEW: add turn instructions to sidebar ---
    const instructions = document.getElementById("instructions");
    if (instructions) {
      const steps = data.legs[0].steps;
      let tripInstructions = "";

      for (const step of steps) {
        tripInstructions += `<li>${step.maneuver.instruction}</li>`;
      }

      instructions.innerHTML = `
        <p id="prompt">📍 Click the map to get directions to another destination</p>
        <p><strong>Trip duration: ${Math.floor(data.duration / 60)} min 👩‍🦽 </strong></p>
        <ol>${tripInstructions}</ol>
      `;
    }

    return { distance: data.distance, duration: data.duration, geometry: data.geometry };
  } catch (err) {
    console.error("Error fetching route:", err);
    return null;
  }
}

