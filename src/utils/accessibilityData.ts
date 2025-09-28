// Simple utility to get accessibility data counts
// This will be expanded when we integrate the actual GeoJSON data

export interface AccessibilityDataCounts {
  accessRoutes: number;
  curbCuts: number;
  adaParkingSpaces: number;
  accessibleEntrances: number;
  elevators: number;
  accessAisle: number;
}

// Mock data counts for now - these should be replaced with actual data loading
export const getAccessibilityDataCounts = (): AccessibilityDataCounts => {
  // These are placeholder counts - in a real implementation, 
  // you would load and parse the GeoJSON files to get actual counts
  return {
    accessRoutes: 15,        // Estimated count from accessroutes.geojson
    curbCuts: 120,           // Estimated count from curbcuts.geojson
    adaParkingSpaces: 45,    // Estimated count from adaparkingspaces.geojson
    accessibleEntrances: 85, // Estimated count from accessibleentrances.geojson
    elevators: 35,           // Estimated count from elevators.geojson
    accessAisle: 25,         // Estimated count from accessaisle.geojson
  };
};

// Helper to get total count for display
export const getTotalAccessibilityFeatures = (): number => {
  const counts = getAccessibilityDataCounts();
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
};
