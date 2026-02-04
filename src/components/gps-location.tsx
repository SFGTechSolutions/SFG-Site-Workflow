// GPS Location & Tracking Component

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    MapPin,
    Navigation,
    Target,
    RefreshCw,
    Check,
    AlertTriangle,
    Crosshair,
    Circle,
} from 'lucide-react';
import { Button, Card, CardBody, CardHeader } from './ui';

interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
    capturedAt?: Date;
}

interface GeofenceData {
    latitude: number;
    longitude: number;
    radiusMeters: number;
}

interface GPSLocationProps {
    location?: LocationData;
    geofence?: GeofenceData;
    siteAddress?: string;
    onLocationCapture?: (location: LocationData) => void;
    onGeofenceSet?: (geofence: GeofenceData) => void;
    readonly?: boolean;
}

export function GPSLocation({
    location,
    geofence,
    siteAddress,
    onLocationCapture,
    onGeofenceSet,
    readonly = false,
}: GPSLocationProps) {
    const [currentLocation, setCurrentLocation] = useState<LocationData | null>(location || null);
    const [isTracking, setIsTracking] = useState(false);
    const [trackingStatus, setTrackingStatus] = useState<'idle' | 'tracking' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [geofenceRadius, setGeofenceRadius] = useState(geofence?.radiusMeters || 100);
    const [isInsideGeofence, setIsInsideGeofence] = useState<boolean | null>(null);

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }, []);

    // Check if current location is inside geofence
    useEffect(() => {
        if (currentLocation && geofence) {
            const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                geofence.latitude,
                geofence.longitude
            );
            setIsInsideGeofence(distance <= geofence.radiusMeters);
        }
    }, [currentLocation, geofence, calculateDistance]);

    // Capture current GPS location
    const captureLocation = () => {
        if (!navigator.geolocation) {
            setErrorMessage('Geolocation is not supported by your browser');
            setTrackingStatus('error');
            return;
        }

        setTrackingStatus('tracking');
        setErrorMessage(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation: LocationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    capturedAt: new Date(),
                };
                setCurrentLocation(newLocation);
                setTrackingStatus('idle');
                onLocationCapture?.(newLocation);
            },
            (error) => {
                setTrackingStatus('error');
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setErrorMessage('Location access denied. Please enable location permissions.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setErrorMessage('Location information unavailable.');
                        break;
                    case error.TIMEOUT:
                        setErrorMessage('Location request timed out.');
                        break;
                    default:
                        setErrorMessage('An unknown error occurred.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const watchIdRef = React.useRef<number | null>(null);

    // Start continuous tracking
    const startTracking = () => {
        if (!navigator.geolocation) {
            setErrorMessage('Geolocation is not supported');
            return;
        }

        // Clear any existing watch
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setIsTracking(true);
        setTrackingStatus('tracking');

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const newLocation: LocationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    capturedAt: new Date(),
                };
                setCurrentLocation(newLocation);
                setTrackingStatus('tracking'); // Ensure status remains 'tracking' on success
                setErrorMessage(null); // Clear any previous errors
            },
            (error) => {
                console.error('Tracking error:', error);
                setTrackingStatus('error');
                let msg = 'Tracking error occurred';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        msg = 'Location access denied. Please enable permissions.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = 'Location unavailable.';
                        break;
                    case error.TIMEOUT:
                        msg = 'Location request timed out.';
                        break;
                    default:
                        msg = `Error: ${error.message}`;
                }
                setErrorMessage(msg);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000, // Increased timeout to 10s
                maximumAge: 5000,
            }
        );
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
        setTrackingStatus('idle');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    // Set current location as geofence center
    const setGeofenceFromLocation = () => {
        if (currentLocation) {
            const newGeofence: GeofenceData = {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                radiusMeters: geofenceRadius,
            };
            onGeofenceSet?.(newGeofence);
        }
    };

    // Format coordinates for display
    const formatCoord = (value: number, type: 'lat' | 'lon') => {
        const direction = type === 'lat'
            ? (value >= 0 ? 'N' : 'S')
            : (value >= 0 ? 'E' : 'W');
        return `${Math.abs(value).toFixed(6)}° ${direction}`;
    };

    // Generate map URL
    const getMapUrl = (lat: number, lon: number) => {
        return `https://www.google.com/maps?q=${lat},${lon}`;
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-primary-600" />
                    <span className="font-semibold">GPS Location & Tracking</span>
                </div>
            </CardHeader>
            <CardBody>
                {/* Site Address */}
                {siteAddress && (
                    <div className="mb-4">
                        <div className="text-sm text-neutral-500 mb-1">
                            Site Address
                        </div>
                        <div className="text-base text-neutral-800">
                            {siteAddress}
                        </div>
                    </div>
                )}

                {/* Current Location Display */}
                {currentLocation && (
                    <div className="p-4 bg-primary-50 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Navigation size={16} className="text-primary-600" />
                                <span className="text-sm font-medium text-primary-700">
                                    Current Position
                                </span>
                            </div>
                            {isTracking && (
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                    <span className="text-xs text-success">Live</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-xs text-neutral-500">Latitude</div>
                                <div className="text-sm font-mono">
                                    {formatCoord(currentLocation.latitude, 'lat')}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-500">Longitude</div>
                                <div className="text-sm font-mono">
                                    {formatCoord(currentLocation.longitude, 'lon')}
                                </div>
                            </div>
                        </div>

                        {currentLocation.accuracy && (
                            <div className="mt-2 text-xs text-neutral-500">
                                Accuracy: ±{Math.round(currentLocation.accuracy)}m
                                {currentLocation.capturedAt && (
                                    <> • Captured: {currentLocation.capturedAt.toLocaleTimeString()}</>
                                )}
                            </div>
                        )}

                        <a
                            href={getMapUrl(currentLocation.latitude, currentLocation.longitude)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-3 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            <MapPin size={14} />
                            Open in Google Maps
                        </a>
                    </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                    <div className="p-3 bg-accent-red-light rounded-md mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-accent-red" />
                        <span className="text-sm text-accent-red">{errorMessage}</span>
                    </div>
                )}

                {/* Geofence Status */}
                {geofence && currentLocation && (
                    <div className={`p-3 rounded-md mb-4 flex items-center gap-2 ${isInsideGeofence ? 'bg-success-light' : 'bg-accent-red-light'}`}>
                        {isInsideGeofence ? (
                            <>
                                <Check size={16} className="text-success" />
                                <span className="text-sm text-success">
                                    Inside work site zone ({geofence.radiusMeters}m radius)
                                </span>
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={16} className="text-accent-red" />
                                <span className="text-sm text-accent-red">
                                    Outside work site zone
                                </span>
                            </>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                {!readonly && (
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="primary"
                                onClick={captureLocation}
                                loading={trackingStatus === 'tracking' && !isTracking}
                                icon={<Crosshair size={16} />}
                            >
                                Capture Location
                            </Button>

                            {isTracking ? (
                                <Button
                                    variant="secondary"
                                    onClick={stopTracking}
                                    icon={<Circle size={16} />}
                                >
                                    Stop Tracking
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    onClick={startTracking}
                                    icon={<RefreshCw size={16} />}
                                >
                                    Live Track
                                </Button>
                            )}
                        </div>

                        {/* Geofence Setup */}
                        {currentLocation && onGeofenceSet && (
                            <div className="p-4 bg-neutral-50 rounded-md mt-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <Target size={16} className="text-neutral-600" />
                                    <span className="text-sm font-medium">
                                        Set Geofence Zone
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 mb-3">
                                    <label className="text-sm text-neutral-600">
                                        Radius:
                                    </label>
                                    <select
                                        value={geofenceRadius}
                                        onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                                        className="px-3 py-2 rounded-md border border-neutral-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                                    >
                                        <option value={50}>50m</option>
                                        <option value={100}>100m</option>
                                        <option value={200}>200m</option>
                                        <option value={500}>500m</option>
                                        <option value={1000}>1km</option>
                                    </select>
                                </div>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={setGeofenceFromLocation}
                                    icon={<Target size={14} />}
                                >
                                    Set Current Location as Zone Center
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Display existing geofence info */}
                {geofence && !onGeofenceSet && (
                    <div className="p-3 bg-neutral-50 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                            <Target size={16} className="text-neutral-600" />
                            <span className="text-sm font-medium">
                                Work Site Zone
                            </span>
                        </div>
                        <div className="text-xs text-neutral-500">
                            Center: {formatCoord(geofence.latitude, 'lat')}, {formatCoord(geofence.longitude, 'lon')}
                            <br />
                            Radius: {geofence.radiusMeters}m
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

// Mini map preview component using OpenStreetMap static tiles
export function LocationPreview({
    latitude,
    longitude,
    size = 200,
}: {
    latitude: number;
    longitude: number;
    size?: number;
}) {
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;

    return (
        <div className="w-[200px] h-[200px] rounded-lg overflow-hidden border border-neutral-200">
            <iframe
                src={mapUrl}
                width={size}
                height={size}
                style={{ border: 0 }}
                loading="lazy"
                title="Location Preview"
            />
        </div>
    );
}
