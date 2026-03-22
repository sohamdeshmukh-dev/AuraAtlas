"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

// Dynamically import the AR scene to avoid SSR issues with WebGL/WebXR
const ARScene = dynamic(() => import("@/components/ar/ARScene"), { 
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white font-medium animate-pulse">Initializing Aura Lens...</p>
      </div>
    </div>
  )
});

// Demo controls for testing when not physically at UVA
const DemoControls = dynamic(() => import("@/components/ar/DemoControls"), { ssr: false });

function ARPageContent() {
  const searchParams = useSearchParams();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [orientationPermission, setOrientationPermission] = useState<"granted" | "denied" | "prompt">("prompt");

  // Parse demo mode from URL
  const isDemo = searchParams.get("demo") === "true";

  // Request iOS 13+ DeviceOrientation permission
  const requestOrientationPermission = useCallback(async () => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        setOrientationPermission(permission);
        return permission === "granted";
      } catch {
        setOrientationPermission("denied");
        return false;
      }
    }
    // Not iOS 13+, permission not needed
    setOrientationPermission("granted");
    return true;
  }, []);

  useEffect(() => {
    if (isDemo) {
      // Default to Rotunda area for demo
      setUserLocation({ lat: 38.0356, lng: -78.5034 });
      setHeading(0);
      return;
    }

    // Real geolocation logic
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoError(null);
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error("Geolocation error:", err);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError("Location access denied. Please enable location services for this app.");
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError("Location unavailable. Please check your GPS signal.");
            break;
          case err.TIMEOUT:
            setGeoError("Location request timed out. Trying again...");
            break;
          default:
            setGeoError("Unable to determine location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      }
    );

    // Device orientation for heading
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is available on iOS
      const h = (e as any).webkitCompassHeading ?? e.alpha;
      if (h !== null && h !== undefined) {
        setHeading(typeof h === "number" ? h : 0);
      }
    };

    // Request permission then attach listener
    requestOrientationPermission().then((granted) => {
      if (granted) {
        window.addEventListener("deviceorientation", handleOrientation, true);
      }
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [isDemo, requestOrientationPermission]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <Suspense fallback={null}>
        <ARScene 
          userLocation={userLocation} 
          heading={heading} 
          isDemo={isDemo}
          debugMode={debugMode}
        />
      </Suspense>

      {/* Overlay UI */}
      <div className="fixed top-6 left-6 z-50 pointer-events-none">
        <h1 className="text-white text-2xl font-black tracking-tighter flex items-center gap-2">
          <span className="text-indigo-400">👁️</span> AURA LENS
          {isDemo && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full ml-2">DEMO MODE</span>}
        </h1>
        <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mt-1">
          {userLocation ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : geoError ? "⚠ GPS Error" : "Locating..."}
        </p>
        {heading !== null && !isDemo && (
          <p className="text-neutral-500 text-[8px] font-bold uppercase tracking-widest mt-0.5">
            Heading: {Math.round(heading)}°
          </p>
        )}
      </div>

      {/* Geolocation Error Banner */}
      {geoError && !isDemo && (
        <div className="fixed top-20 left-6 right-6 z-50 bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 animate-in slide-in-from-top-5">
          <p className="text-red-300 text-sm font-medium">{geoError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-red-400 text-xs font-bold mt-2 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* iOS Orientation Permission Banner */}
      {orientationPermission === "prompt" && !isDemo && (
        <div className="fixed top-20 left-6 right-6 z-50 bg-indigo-500/20 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 animate-in slide-in-from-top-5">
          <p className="text-indigo-300 text-sm font-medium">Compass access needed for AR direction tracking.</p>
          <button
            onClick={requestOrientationPermission}
            className="bg-indigo-500 text-white text-xs font-bold mt-2 px-4 py-2 rounded-full"
          >
            Enable Compass
          </button>
        </div>
      )}

      {isDemo && (
        <DemoControls 
          userLocation={userLocation} 
          setUserLocation={setUserLocation} 
          heading={heading} 
          setHeading={setHeading}
          onToggleDebug={() => setDebugMode(!debugMode)}
        />
      )}

      {/* Back button */}
      <button 
        onClick={() => window.location.href = "/"}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 z-50"
      >
        EXIT AR
      </button>

      {/* Scan Reticle */}
      {!isDemo && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border border-white/20 rounded-full flex items-center justify-center">
            <div className="w-48 h-48 border border-indigo-500/30 rounded-full animate-pulse" />
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent" />
          </div>
        </div>
      )}
    </main>
  );
}

export default function ARPage() {
  return (
    <Suspense fallback={<div className="bg-black h-screen w-full" />}>
      <ARPageContent />
    </Suspense>
  );
}
