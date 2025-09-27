import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Footprints, 
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Accessibility,
  Route,
  Timer,
  Zap,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowDownLeft,
  RotateCw
} from 'lucide-react';

// Enhanced interfaces for Mapbox Directions API response
interface MapboxManeuver {
  type: number;
  instruction: string;
  bearing_after: number;
  bearing_before: number;
  location: [number, number];
  modifier?: string;
}

interface MapboxStep {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  maneuver: MapboxManeuver;
  mode: string;
  name: string;
  weight: number;
  intersections?: Array<{
    location: [number, number];
    bearings: number[];
    classes?: string[];
    entry: boolean[];
    in?: number;
    out?: number;
    lanes?: Array<{
      indications: string[];
      valid: boolean;
    }>;
  }>;
  voiceInstructions?: Array<{
    distanceAlongGeometry: number;
    announcement: string;
    ssmlAnnouncement: string;
  }>;
  bannerInstructions?: Array<{
    distanceAlongGeometry: number;
    primary: {
      text: string;
      components: Array<{
        text: string;
        type: string;
        imageBaseUrl?: string;
      }>;
    };
    secondary?: {
      text: string;
      components: Array<{
        text: string;
        type: string;
      }>;
    };
  }>;
}

interface MapboxRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  legs: Array<{
    distance: number;
    duration: number;
    steps: MapboxStep[];
    summary: string;
    weight: number;
  }>;
  weight: number;
  weight_name: string;
}

interface MapboxDirectionsResponse {
  routes: MapboxRoute[];
  waypoints: Array<{
    distance: number;
    name: string;
    location: [number, number];
  }>;
  code: string;
  uuid: string;
}

// Enhanced Direction Step interface
interface DirectionStep {
  instruction: string;
  distance: number; // in meters
  duration: number; // in seconds
  maneuver: string;
  maneuverType: number;
  bearingAfter: number;
  bearingBefore: number;
  location: [number, number];
  streetName?: string;
  voiceInstruction?: string;
  bannerInstruction?: string;
  intersections?: any[];
  accessibilityFeatures?: {
    hasCurbCut: boolean;
    hasRamp: boolean;
    hasElevator: boolean;
    hasAccessibleCrossing: boolean;
    surfaceType: 'paved' | 'gravel' | 'mixed' | 'unpaved';
    width: 'narrow' | 'standard' | 'wide';
  };
  warnings?: string[];
}

// Enhanced Route Info interface
interface RouteInfo {
  totalDistance: number; // in meters
  totalDuration: number; // in seconds
  steps: DirectionStep[];
  accessibilityScore?: 'high' | 'medium' | 'low';
  warnings?: string[];
  routeSummary?: string;
  estimatedArrival?: Date;
  trafficConditions?: 'light' | 'moderate' | 'heavy' | 'severe';
  weatherImpact?: 'none' | 'minor' | 'moderate' | 'severe';
  alternativeRoutes?: number;
  routeId?: string;
  waypoints?: Array<{
    name: string;
    location: [number, number];
    distance: number;
  }>;
}

interface DirectionsPanelProps {
  routeInfo: RouteInfo;
  startLocation: string;
  endLocation: string;
  onClose?: () => void;
  onStepClick?: (stepIndex: number, step: DirectionStep) => void;
  onRouteChange?: (routeId: string) => void;
  isNavigating?: boolean;
  currentStepIndex?: number;
  onStartNavigation?: () => void;
  onStopNavigation?: () => void;
  onVoiceToggle?: (enabled: boolean) => void;
  voiceEnabled?: boolean;
  showAlternatives?: boolean;
  onAlternativeSelect?: (routeIndex: number) => void;
}

const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  routeInfo,
  startLocation,
  endLocation,
  onClose,
  onStepClick,
  onRouteChange,
  isNavigating = false,
  currentStepIndex = 0,
  onStartNavigation,
  onStopNavigation,
  onVoiceToggle,
  voiceEnabled = false,
  showAlternatives = false,
  onAlternativeSelect
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Format distance with precision
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Format duration with detailed breakdown
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Format arrival time
  const formatArrivalTime = (duration: number): string => {
    const arrival = new Date(Date.now() + duration * 1000);
    return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get detailed maneuver icon based on Mapbox maneuver types
  const getManeuverIcon = (maneuverType: number, modifier?: string) => {
    // Mapbox maneuver types: https://docs.mapbox.com/api/navigation/#maneuver-types
    switch (maneuverType) {
      case 1: // turn
        switch (modifier) {
          case 'left': return <ArrowLeft className="w-4 h-4" />;
          case 'right': return <ArrowRight className="w-4 h-4" />;
          case 'sharp left': return <ArrowUpLeft className="w-4 h-4" />;
          case 'sharp right': return <ArrowUpRight className="w-4 h-4" />;
          case 'slight left': return <ArrowDownLeft className="w-4 h-4" />;
          case 'slight right': return <ArrowDownRight className="w-4 h-4" />;
          default: return <ArrowRight className="w-4 h-4" />;
        }
      case 2: // new name
        return <Route className="w-4 h-4" />;
      case 3: // depart
        return <ArrowUp className="w-4 h-4" />;
      case 4: // arrive
        return <MapPin className="w-4 h-4" />;
      case 5: // merge
        return <ChevronRight className="w-4 h-4" />;
      case 6: // on ramp
        return <ArrowUpRight className="w-4 h-4" />;
      case 7: // off ramp
        return <ArrowDownRight className="w-4 h-4" />;
      case 8: // fork
        return <ArrowUp className="w-4 h-4" />;
      case 9: // end of road
        return <ArrowRight className="w-4 h-4" />;
      case 10: // continue
        return <ArrowUp className="w-4 h-4" />;
      case 11: // roundabout
        return <RotateCw className="w-4 h-4" />;
      case 12: // rotary
        return <RotateCw className="w-4 h-4" />;
      case 13: // roundabout turn
        return <RotateCw className="w-4 h-4" />;
      case 14: // notification
        return <Info className="w-4 h-4" />;
      default:
        return <ArrowRight className="w-4 h-4" />;
    }
  };

  // Get accessibility icon
  const getAccessibilityIcon = (features: DirectionStep['accessibilityFeatures']) => {
    if (!features) return null;
    
    const icons = [];
    if (features.hasCurbCut) icons.push('♿');
    if (features.hasRamp) icons.push('🛗');
    if (features.hasElevator) icons.push('🛗');
    if (features.hasAccessibleCrossing) icons.push('🚦');
    
    return icons.length > 0 ? icons.join(' ') : null;
  };

  // Get traffic condition color
  const getTrafficColor = (condition: string) => {
    switch (condition) {
      case 'light': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'heavy': return 'text-orange-600';
      case 'severe': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Toggle step expansion
  const toggleStepExpansion = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  // Auto-scroll to current step
  useEffect(() => {
    if (autoScroll && isNavigating) {
      const currentStepElement = document.getElementById(`step-${currentStepIndex}`);
      if (currentStepElement) {
        currentStepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStepIndex, autoScroll, isNavigating]);

  // Calculate progress percentage
  const progressPercentage = routeInfo.steps.length > 0 
    ? ((currentStepIndex + 1) / routeInfo.steps.length) * 100 
    : 0;

  return (
    <div className="fixed left-4 top-20 bottom-4 w-96 flex flex-col z-10">
      <Card className="flex-1 flex flex-col shadow-2xl overflow-hidden">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Directions</h2>
              {isNavigating && (
                <Badge variant="secondary" className="bg-green-500 text-white">
                  <Play className="w-3 h-3 mr-1" />
                  Navigating
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onVoiceToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVoiceToggle(!voiceEnabled)}
                  className="text-white hover:bg-white/20"
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              )}
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
          
          {/* Enhanced Route Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4" />
                <span className="text-xl font-bold">
                  {formatDuration(routeInfo.totalDuration)}
                </span>
                <span className="text-blue-200 text-sm">
                  ({formatDistance(routeInfo.totalDistance)})
                </span>
              </div>
              {routeInfo.estimatedArrival && (
                <div className="text-right">
                  <div className="text-xs text-blue-200">Arrive at</div>
                  <div className="text-sm font-medium">
                    {formatArrivalTime(routeInfo.totalDuration)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Traffic and Weather Conditions */}
            <div className="flex items-center gap-4">
              {routeInfo.trafficConditions && (
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    routeInfo.trafficConditions === 'light' ? 'bg-green-400' :
                    routeInfo.trafficConditions === 'moderate' ? 'bg-yellow-400' :
                    routeInfo.trafficConditions === 'heavy' ? 'bg-orange-400' : 'bg-red-400'
                  }`} />
                  <span className="text-xs capitalize">
                    {routeInfo.trafficConditions} traffic
                  </span>
                </div>
              )}
              
              {routeInfo.weatherImpact && routeInfo.weatherImpact !== 'none' && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span className="text-xs capitalize">
                    {routeInfo.weatherImpact} weather impact
                  </span>
                </div>
              )}
            </div>
            
            {/* Accessibility Score */}
            {routeInfo.accessibilityScore && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <Accessibility className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {routeInfo.accessibilityScore === 'high' && 'Fully Accessible'}
                  {routeInfo.accessibilityScore === 'medium' && 'Mostly Accessible'}
                  {routeInfo.accessibilityScore === 'low' && 'Limited Accessibility'}
                </span>
                <Shield className="w-3 h-3" />
              </div>
            )}

            {/* Navigation Controls */}
            {!isNavigating && onStartNavigation && (
              <Button
                onClick={onStartNavigation}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Navigation
              </Button>
            )}
            
            {isNavigating && onStopNavigation && (
              <Button
                onClick={onStopNavigation}
                variant="destructive"
                className="w-full"
              >
                <Pause className="w-4 h-4 mr-2" />
                Stop Navigation
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isNavigating && (
          <div className="bg-gray-50 px-4 py-2 border-b">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{currentStepIndex + 1} of {routeInfo.steps.length}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Enhanced Locations */}
        <div className="bg-gray-50 px-4 py-3 border-b">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">FROM</p>
                <p className="text-sm font-medium text-gray-900">{startLocation}</p>
              </div>
            </div>
            
            {/* Waypoints */}
            {routeInfo.waypoints && routeInfo.waypoints.length > 0 && (
              <div className="ml-3 pl-3 border-l-2 border-gray-200 space-y-2">
                {routeInfo.waypoints.map((waypoint, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">VIA</p>
                      <p className="text-sm font-medium text-gray-700">{waypoint.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">TO</p>
                <p className="text-sm font-medium text-gray-900">{endLocation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Warnings */}
        {routeInfo.warnings && routeInfo.warnings.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-3">
            {routeInfo.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{warning}</p>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Directions Steps */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {routeInfo.steps.map((step, index) => {
              const isCurrentStep = isNavigating && index === currentStepIndex;
              const isExpanded = expandedSteps.has(index);
              const accessibilityIcon = getAccessibilityIcon(step.accessibilityFeatures);
              
              return (
                <div 
                  key={index}
                  id={`step-${index}`}
                  className={`group transition-all duration-200 ${
                    isCurrentStep 
                      ? 'bg-blue-100 border-l-4 border-blue-500 shadow-md' 
                      : 'hover:bg-gray-50'
                  } ${isExpanded ? 'bg-gray-50' : ''}`}
                >
                  <div 
                    className="flex gap-3 p-3 rounded-lg cursor-pointer"
                    onClick={() => {
                      toggleStepExpansion(index);
                      onStepClick?.(index, step);
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                        isCurrentStep 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                      }`}>
                        {getManeuverIcon(step.maneuverType, step.maneuver)}
                      </div>
                      {index < routeInfo.steps.length - 1 && (
                        <div className={`w-0.5 h-6 mt-2 ${
                          isCurrentStep ? 'bg-blue-500' : 'bg-blue-200'
                        }`} />
                      )}
                    </div>
                    
                    <div className="flex-1 pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium mb-1 ${
                            isCurrentStep ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {step.instruction}
                          </p>
                          
                          {step.streetName && (
                            <p className="text-xs text-gray-500 mb-1">
                              on {step.streetName}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Footprints className="w-3 h-3" />
                              {formatDistance(step.distance)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(step.duration)}
                            </span>
                            {accessibilityIcon && (
                              <span className="flex items-center gap-1 text-green-600">
                                <Accessibility className="w-3 h-3" />
                                {accessibilityIcon}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          {isCurrentStep && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                              Current
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Step Details */}
                  {isExpanded && (
                    <div className="ml-11 pr-3 pb-3 space-y-2">
                      {step.voiceInstruction && (
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-xs text-blue-800 font-medium">Voice Instruction:</p>
                          <p className="text-sm text-blue-900">{step.voiceInstruction}</p>
                        </div>
                      )}
                      
                      {step.bannerInstruction && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600 font-medium">Banner:</p>
                          <p className="text-sm text-gray-800">{step.bannerInstruction}</p>
                        </div>
                      )}
                      
                      {step.accessibilityFeatures && (
                        <div className="bg-green-50 rounded-lg p-2">
                          <p className="text-xs text-green-800 font-medium mb-1">Accessibility:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <span className={step.accessibilityFeatures.hasCurbCut ? 'text-green-600' : 'text-gray-400'}>
                                {step.accessibilityFeatures.hasCurbCut ? '✓' : '✗'}
                              </span>
                              <span>Curb Cut</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={step.accessibilityFeatures.hasRamp ? 'text-green-600' : 'text-gray-400'}>
                                {step.accessibilityFeatures.hasRamp ? '✓' : '✗'}
                              </span>
                              <span>Ramp</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={step.accessibilityFeatures.hasElevator ? 'text-green-600' : 'text-gray-400'}>
                                {step.accessibilityFeatures.hasElevator ? '✓' : '✗'}
                              </span>
                              <span>Elevator</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={step.accessibilityFeatures.hasAccessibleCrossing ? 'text-green-600' : 'text-gray-400'}>
                                {step.accessibilityFeatures.hasAccessibleCrossing ? '✓' : '✗'}
                              </span>
                              <span>Crossing</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            Surface: {step.accessibilityFeatures.surfaceType} • 
                            Width: {step.accessibilityFeatures.width}
                          </div>
                        </div>
                      )}
                      
                      {step.warnings && step.warnings.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-2">
                          <p className="text-xs text-amber-800 font-medium mb-1">Warnings:</p>
                          {step.warnings.map((warning, idx) => (
                            <p key={idx} className="text-sm text-amber-900">• {warning}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>Total steps: {routeInfo.steps.length}</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Walking directions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
              {isNavigating && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoScroll(!autoScroll)}
                  className="text-xs"
                >
                  {autoScroll ? 'Auto-scroll: On' : 'Auto-scroll: Off'}
                </Button>
              )}
            </div>
          </div>
          
          {showDetails && (
            <div className="mt-2 pt-2 border-t text-xs text-gray-500 space-y-1">
              <div>Route ID: {routeInfo.routeId || 'N/A'}</div>
              <div>Alternative routes: {routeInfo.alternativeRoutes || 0}</div>
              {routeInfo.routeSummary && (
                <div>Summary: {routeInfo.routeSummary}</div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Utility function to convert Mapbox Directions API response to our RouteInfo format
export const convertMapboxResponse = (
  response: MapboxDirectionsResponse,
  startLocation: string,
  endLocation: string,
  routeIndex: number = 0
): RouteInfo => {
  const route = response.routes[routeIndex];
  if (!route) {
    throw new Error('Route not found in response');
  }

  const steps: DirectionStep[] = route.legs.flatMap(leg => 
    leg.steps.map(step => ({
      instruction: step.maneuver.instruction,
      distance: step.distance,
      duration: step.duration,
      maneuver: step.maneuver.instruction,
      maneuverType: step.maneuver.type,
      bearingAfter: step.maneuver.bearing_after,
      bearingBefore: step.maneuver.bearing_before,
      location: step.maneuver.location,
      streetName: step.name,
      voiceInstruction: step.voiceInstructions?.[0]?.announcement,
      bannerInstruction: step.bannerInstructions?.[0]?.primary.text,
      intersections: step.intersections,
      accessibilityFeatures: {
        hasCurbCut: Math.random() > 0.3, // Mock data - replace with real analysis
        hasRamp: Math.random() > 0.5,
        hasElevator: Math.random() > 0.8,
        hasAccessibleCrossing: Math.random() > 0.4,
        surfaceType: ['paved', 'gravel', 'mixed', 'unpaved'][Math.floor(Math.random() * 4)] as any,
        width: ['narrow', 'standard', 'wide'][Math.floor(Math.random() * 3)] as any,
      },
      warnings: Math.random() > 0.7 ? ['Construction ahead', 'Narrow sidewalk'] : undefined,
    }))
  );

  return {
    totalDistance: route.distance,
    totalDuration: route.duration,
    steps,
    accessibilityScore: Math.random() > 0.3 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
    warnings: Math.random() > 0.5 ? ['Weather conditions may affect accessibility'] : undefined,
    routeSummary: route.legs.map(leg => leg.summary).join(', '),
    estimatedArrival: new Date(Date.now() + route.duration * 1000),
    trafficConditions: ['light', 'moderate', 'heavy', 'severe'][Math.floor(Math.random() * 4)] as any,
    weatherImpact: Math.random() > 0.7 ? 'minor' : 'none',
    alternativeRoutes: response.routes.length - 1,
    routeId: response.uuid,
    waypoints: response.waypoints.slice(1, -1).map(wp => ({
      name: wp.name,
      location: wp.location,
      distance: wp.distance,
    })),
  };
};

export default DirectionsPanel;