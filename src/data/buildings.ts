import { Building } from '@/types';

// Demo building data for Virginia Tech campus
export const buildings: Building[] = [
  {
    id: 'newman-library',
    name: 'Newman Library',
    shortName: 'Newman',
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
    shortName: 'Squires',
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
  },
  {
    id: 'torgersen-hall',
    name: 'Torgersen Hall',
    shortName: 'Torg',
    coordinates: [-80.4189, 37.2308],
    accessibilityRating: 5,
    amenities: ['Computer Labs', 'Classrooms', 'Accessible Restrooms', 'Elevator'],
    entrances: [
      {
        accessible: true,
        coordinates: [-80.4189, 37.2308],
        description: 'Main entrance with ramp access and automatic doors'
      }
    ]
  },
  {
    id: 'mcbryde-hall',
    name: 'McBryde Hall',
    shortName: 'McBryde',
    coordinates: [-80.4205, 37.2282],
    accessibilityRating: 4,
    amenities: ['Classrooms', 'Labs', 'Accessible Restrooms'],
    entrances: [
      {
        accessible: true,
        coordinates: [-80.4205, 37.2282],
        description: 'Side entrance with ramp access'
      }
    ]
  },
  {
    id: 'norris-hall',
    name: 'Norris Hall',
    shortName: 'Norris',
    coordinates: [-80.4183, 37.2275],
    accessibilityRating: 5,
    amenities: ['Classrooms', 'Offices', 'Accessible Restrooms', 'Elevator'],
    entrances: [
      {
        accessible: true,
        coordinates: [-80.4183, 37.2275],
        description: 'Multiple accessible entrances with automatic doors'
      }
    ]
  },
  {
    id: 'burruss-hall',
    name: 'Burruss Hall',
    shortName: 'Burruss',
    coordinates: [-80.4158, 37.2294],
    accessibilityRating: 5,
    amenities: ['Administration', 'Accessible Restrooms', 'Elevator', 'Meeting Rooms'],
    entrances: [
      {
        accessible: true,
        coordinates: [-80.4158, 37.2294],
        description: 'Grand entrance with ramp access'
      }
    ]
  },
  {
    id: 'war-memorial-gym',
    name: 'War Memorial Gym',
    shortName: 'War',
    coordinates: [-80.4142, 37.2258],
    accessibilityRating: 4,
    amenities: ['Recreation', 'Accessible Restrooms', 'Locker Rooms'],
    entrances: [
      {
        accessible: true,
        coordinates: [-80.4142, 37.2258],
        description: 'Accessible entrance on east side'
      }
    ]
  },
  {
    id: 'dietrick-dining',
    name: 'Dietrick Dining Hall',
    shortName: 'D2',
    coordinates: [-80.4228, 37.2320],
    accessibilityRating: 5,
    amenities: ['Dining', 'Accessible Seating', 'Restrooms', 'Elevator'],
    entrances: [
      {
        accessible: true,
        coordinates: [-80.4228, 37.2320],
        description: 'Main entrance with automatic doors and ramp'
      }
    ]
  }
];

// Search function for buildings
export const searchBuildings = (query: string): Building[] => {
  if (!query.trim()) return buildings;

  const lowercaseQuery = query.toLowerCase();
  return buildings.filter(building =>
    building.name.toLowerCase().includes(lowercaseQuery) ||
    (building.shortName && building.shortName.toLowerCase().includes(lowercaseQuery))
  );
};

export default buildings;