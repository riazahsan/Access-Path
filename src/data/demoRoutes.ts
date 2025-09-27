import { RouteCollection } from '@/types';

// Demo GeoJSON data for wheelchair accessible routes
// Virginia Tech campus coordinates
export const demoRoutes: RouteCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'library-student-center',
        name: 'Newman Library → Squires Student Center',
        accessibility: 'accessible',
        surfaceType: 'paved',
        difficulty: 'easy',
        landmarks: ['Newman Library', 'Drillfield', 'Squires Student Center'],
        estimatedTime: 8
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-80.4201, 37.2296], // Newman Library
          [-80.4190, 37.2285], // Path point 1
          [-80.4180, 37.2275], // Path point 2
          [-80.4170, 37.2270], // Squires Student Center
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'dorm-cafeteria',
        name: 'West End Residential → Owens Food Court',
        accessibility: 'accessible',
        surfaceType: 'paved',
        difficulty: 'easy',
        landmarks: ['West End', 'Academic Mall', 'Owens Hall'],
        estimatedTime: 12
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-80.4250, 37.2310], // West End
          [-80.4230, 37.2300], // Path point 1
          [-80.4210, 37.2290], // Path point 2
          [-80.4195, 37.2285], // Owens Food Court
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'parking-classroom',
        name: 'Parking Deck → Classroom Building',
        accessibility: 'partial',
        surfaceType: 'mixed',
        difficulty: 'moderate',
        landmarks: ['Parking Deck', 'Campus Quad', 'Academic Buildings'],
        estimatedTime: 15
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-80.4280, 37.2320], // Parking
          [-80.4260, 37.2305], // Path point 1
          [-80.4240, 37.2295], // Path point 2
          [-80.4220, 37.2285], // Classroom
        ]
      }
    }
  ]
};

export default demoRoutes;