import { Building } from '@/types';

// Demo building data for Virginia Tech campus
export const buildings: Building[] = [
  {
    id: 'newman-library',
    name: 'Newman Library',
    shortName: 'Library',
    coordinates: [-80.4201, 37.2296],
    accessibilityRating: 5,
    amenities: ['Accessible Restrooms', 'Elevator', 'Study Spaces', 'Computer Lab'],
    entrances: [
      {
        accessible: true,
        coordinates: [-80.4201, 37.2296],
        description: 'Main entrance with automatic doors and ramp access'
      }
    ]
  },
  {
    id: 'squires-student-center',
    name: 'Squires Student Center',
    shortName: 'Student Center',
    coordinates: [-80.4170, 37.2270],
    accessibilityRating: 5,
    amenities: ['Food Court', 'Accessible Restrooms', 'Multiple Elevators', 'Meeting Rooms'],
    entrances: [
      {
        accessible: true,
        coordinates: [-80.4170, 37.2270],
        description: 'Multiple accessible entrances with automatic doors'
      }
    ]
  },
  {
    id: 'owens-food-court',
    name: 'Owens Food Court',
    shortName: 'Owens',
    coordinates: [-80.4195, 37.2285],
    accessibilityRating: 4,
    amenities: ['Dining', 'Accessible Seating', 'Restrooms'],
    entrances: [
      {
        accessible: true,
        coordinates: [-80.4195, 37.2285],
        description: 'Accessible entrance on ground level'
      }
    ]
  },
  {
    id: 'west-end',
    name: 'West End Residential',
    shortName: 'West End',
    coordinates: [-80.4250, 37.2310],
    accessibilityRating: 5,
    amenities: ['Residential', 'Accessible Rooms', 'Common Areas', 'Laundry'],
    entrances: [
      {
        accessible: true,
        coordinates: [-80.4250, 37.2310],
        description: 'Accessible entrance with keycard access'
      }
    ]
  }
];

export default buildings;