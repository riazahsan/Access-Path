// Simple utility to get accessibility data counts
// This will be expanded when we integrate the actual GeoJSON data

export interface AccessibilityDataCounts {
  accessRoutes: number;
  accessRoutes2: number;
  accessibleEntrances: number;
  accessibilityAisles: number;
  curbCuts: number;
  adaParkingSpaces: number;
}

// Mock data counts for now - these should be replaced with actual data loading
export const getAccessibilityDataCounts = (): AccessibilityDataCounts => {
  // These are placeholder counts - in a real implementation, 
  // you would load and parse the GeoJSON files to get actual counts
  return {
    accessRoutes: 15,        // Estimated count from Accessibility Routes layer
    accessRoutes2: 8,        // Estimated count from accessroutes2-1zv1wp layer
    accessibleEntrances: 85, // Estimated count from Accessibile Entrances layer
    accessibilityAisles: 25, // Estimated count from Accessibility Aisles layer
    curbCuts: 120,           // Estimated count from Curb Cuts layer
    adaParkingSpaces: 45,    // Estimated count from ADA Parking Spots layer
  };
};

// Helper to get total count for display
export const getTotalAccessibilityFeatures = (): number => {
  const counts = getAccessibilityDataCounts();
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
};
