import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

interface RouteData {
  waypoints: Array<{
    lat: number;
    lng: number;
    name: string;
  }>;
  distance: number;
  duration: number;
  instructions: string[];
  currentWaypoint: number;
}

interface UserLocation {
  lat: number;
  lng: number;
}

const MobileApp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [userHeading, setUserHeading] = useState<number | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(true);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Parse route data from URL parameters
  useEffect(() => {
    const routeParam = searchParams.get('route');
    if (routeParam) {
      try {
        const parsedRoute = JSON.parse(decodeURIComponent(routeParam));
        setRouteData(parsedRoute);
        console.log('Route data loaded:', parsedRoute);
      } catch (error) {
        console.error('Failed to parse route data:', error);
      }
    }
  }, [searchParams]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
             Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    // Convert to radians
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    // Calculate bearing using the correct formula
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
             Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;

    // Convert to compass bearing (0° = North, clockwise)
    bearing = (bearing + 360) % 360;

    console.log(`Bearing calculation: lat1=${lat1}, lng1=${lng1}, lat2=${lat2}, lng2=${lng2}, bearing=${bearing}`);
    return bearing;
  };

  const getArrowRotation = (): number => {
    if (!userLocation || userHeading === null || !routeData) {
      console.log('Missing data for arrow rotation:', {
        userLocation: !!userLocation,
        userHeading: userHeading,
        routeData: !!routeData
      });
      return 0;
    }

    const currentWaypoint = routeData.waypoints[routeData.currentWaypoint];
    if (!currentWaypoint) {
      console.log('No current waypoint');
      return 0;
    }

    const bearing = calculateBearing(
      userLocation.lat, userLocation.lng,
      currentWaypoint.lat, currentWaypoint.lng
    );

    // Calculate the rotation needed for the arrow
    // The arrow should point in the direction of the destination
    // relative to the user's current heading
    let rotation = bearing - userHeading;

    // Normalize rotation to be between -180 and 180 degrees
    while (rotation > 180) rotation -= 360;
    while (rotation < -180) rotation += 360;

    // For better visual feedback, if the target is very close (< 5m),
    // reduce arrow movement to avoid jittery behavior
    const distance = getDistanceToNextWaypoint();
    if (distance < 5) {
      rotation = rotation * 0.5; // Dampen rotation when very close
    }

    console.log(`Arrow Rotation Calculation:`);
    console.log(`- User Location: ${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`);
    console.log(`- Target: ${currentWaypoint.lat.toFixed(6)}, ${currentWaypoint.lng.toFixed(6)}`);
    console.log(`- Distance: ${distance.toFixed(1)}m`);
    console.log(`- Bearing: ${bearing.toFixed(1)}°`);
    console.log(`- User Heading: ${userHeading.toFixed(1)}°`);
    console.log(`- Arrow Rotation: ${rotation.toFixed(1)}°`);

    return rotation;
  };

  const getDistanceToNextWaypoint = (): number => {
    if (!userLocation || !routeData) return 0;
    
    const currentWaypoint = routeData.waypoints[routeData.currentWaypoint];
    if (!currentWaypoint) return 0;
    
    return calculateDistance(
      userLocation.lat, userLocation.lng,
      currentWaypoint.lat, currentWaypoint.lng
    );
  };

  const getCompassDirection = (): string => {
    if (userHeading === null) return 'N';
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(userHeading / 45) % 8;
    return directions[index];
  };

  const requestCameraPermission = async () => {
    try {
      // First request device orientation permission (iOS 13+)
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const orientationPermission = await (DeviceOrientationEvent as any).requestPermission();
        if (orientationPermission !== 'granted') {
          alert('Device orientation permission is required for AR navigation');
          return;
        }
      }

      // Then request camera permission with mobile-optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera for AR navigation
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      });

      setCameraStream(stream);
      setShowPermissionPrompt(false);
      setIsNavigating(true);

      // Request screen wake lock to keep screen on during navigation
      try {
        if ('wakeLock' in navigator) {
          const wakeLockObj = await (navigator as any).wakeLock.request('screen');
          setWakeLock(wakeLockObj);
          console.log('✅ Screen wake lock acquired');
        }
      } catch (err) {
        console.log('⚠️ Wake lock request failed:', err);
      }

      console.log('✅ Camera and orientation access granted');
    } catch (error) {
      console.error('❌ Permission denied:', error);
      alert('Camera and motion access are required for AR navigation');
    }
  };

  const startNavigation = () => {
    // Get user location with high accuracy
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(newLocation);
          console.log('Location updated:', newLocation);
        },
        (error) => console.error('Location error:', error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      );
    }

    // Get device orientation with more frequent updates
    if (window.DeviceOrientationEvent) {
      // Remove any existing listeners first
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    }
  };

  const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null && event.alpha !== undefined) {
      // The alpha value represents the compass heading
      // Convert from 0-360 range where 0° = North
      setUserHeading(event.alpha);
      console.log('Device orientation updated:', event.alpha);
      
      // Force update arrow direction immediately
      if (routeData && userLocation) {
        const currentWaypoint = routeData.waypoints[routeData.currentWaypoint];
        if (currentWaypoint) {
          const bearing = calculateBearing(
            userLocation.lat, userLocation.lng,
            currentWaypoint.lat, currentWaypoint.lng
          );
          console.log(`Updated bearing: ${bearing}°, heading: ${event.alpha}°`);
        }
      }
    }
  };

  useEffect(() => {
    if (isNavigating && cameraStream) {
      startNavigation();
    }

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (wakeLock) {
        wakeLock.release();
      }
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [isNavigating, cameraStream]);

  if (!routeData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Route Data</h1>
          <p>Please scan a valid QR code to start AR navigation.</p>
        </div>
      </div>
    );
  }

  if (showPermissionPrompt) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎥</div>
          <h1 className="text-2xl font-bold mb-4">Camera Access Required</h1>
          <p className="text-gray-300 mb-6">
            We need camera access to provide AR navigation guidance.
          </p>
          <button
            onClick={requestCameraPermission}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Allow Camera Access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Camera Feed */}
      <video
        ref={(video) => {
          if (video && cameraStream) {
            video.srcObject = cameraStream;
            // Force play and ensure video is visible
            video.play().then(() => {
              console.log('Video started playing');
              video.style.display = 'block';
              video.style.visibility = 'visible';
            }).catch((error) => {
              console.error('Video play failed:', error);
              // Retry play after a short delay
              setTimeout(() => {
                video.play().catch(console.error);
              }, 100);
            });

            // Force video to maintain aspect ratio and fill screen
            video.style.width = '100vw';
            video.style.height = '100vh';
            video.style.objectFit = 'cover';
            video.style.display = 'block';
            video.style.visibility = 'visible';
          }
        }}
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          display: 'block',
          visibility: 'visible'
        }}
      />
      
      {/* AR Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Navigation Arrow */}
        {isNavigating && routeData && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div
              className="text-6xl text-red-500 drop-shadow-lg animate-pulse"
              style={{
                transform: `translate(-50%, -50%) rotate(${getArrowRotation()}deg)`,
                transition: 'transform 0.3s ease-out'
              }}
            >
              ↑
            </div>
            <div className="text-center mt-2">
              <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm">
                {Math.round(getDistanceToNextWaypoint())}m
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Route Info Panel */}
      {routeData && (
        <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-80 p-4 rounded-lg backdrop-blur-sm text-white">
          <h2 className="font-bold text-lg mb-2">AR Navigation</h2>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-400">From:</span> {routeData.waypoints[0]?.name}</p>
            <p><span className="text-gray-400">To:</span> {routeData.waypoints[1]?.name}</p>
            {userLocation ? (
              <>
                <p><span className="text-gray-400">Remaining:</span> {Math.round(getDistanceToNextWaypoint())}m</p>
                <p><span className="text-gray-400">Est. Time:</span> {Math.round(getDistanceToNextWaypoint() / 1000 * 4)} min</p>
              </>
            ) : (
              <>
                <p><span className="text-gray-400">Distance:</span> {Math.round(routeData.distance)}m</p>
                <p><span className="text-gray-400">Duration:</span> {Math.round(routeData.duration / 60)} min</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Compass */}
      {userHeading !== null && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-80 p-3 rounded-full backdrop-blur-sm text-white text-center">
          <div className="font-bold text-lg">{getCompassDirection()}</div>
          <div className="text-xs text-gray-400">{Math.round(userHeading)}°</div>
        </div>
      )}
      
      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 flex-wrap justify-center">
        <button
          onClick={() => window.history.back()}
          className="bg-gray-700 bg-opacity-80 text-white px-3 py-2 rounded-full text-sm font-semibold backdrop-blur-sm"
        >
          Back
        </button>
        
        <button
          onClick={() => setIsNavigating(!isNavigating)}
          className={`px-3 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
            isNavigating 
              ? 'bg-red-600 bg-opacity-80 text-white' 
              : 'bg-green-600 bg-opacity-80 text-white'
          }`}
        >
          {isNavigating ? 'Pause' : 'Start'}
        </button>
        
        <button
          onClick={() => {
            // Test device orientation
            console.log('Testing device orientation...');
            console.log('Current userHeading:', userHeading);
            console.log('Current userLocation:', userLocation);
            console.log('Route data:', routeData);
            
            // Force simulate a device orientation event
            const currentHeading = userHeading || 0;
            const newHeading = (currentHeading + 45) % 360;
            
            const mockEvent = {
              alpha: newHeading,
              beta: 0,
              gamma: 0
            } as DeviceOrientationEvent;
            
            handleDeviceOrientation(mockEvent);
            console.log('Test completed - new heading:', newHeading);
          }}
          className="bg-blue-600 bg-opacity-80 text-white px-3 py-2 rounded-full text-sm font-semibold backdrop-blur-sm"
        >
          Test
        </button>
      </div>
      
      {/* Instructions */}
      {routeData && routeData.instructions.length > 0 && (
        <div className="absolute bottom-20 left-4 right-4 bg-black bg-opacity-80 p-3 rounded-lg backdrop-blur-sm text-white text-sm">
          <p className="font-semibold mb-1">Next:</p>
          <p>{routeData.instructions[0]}</p>
        </div>
      )}
    </div>
  );
};

export default MobileApp;