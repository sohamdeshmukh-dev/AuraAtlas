"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CityNavigator from "@/components/CityNavigator";
import DailyCheckInModal from "@/components/DailyCheckInModal";
import DailyCheckInReminder from "@/components/DailyCheckInReminder";
import LocalClock from "@/components/LocalClock";
import { useDailyCheckIn } from "@/hooks/useDailyCheckIn";
import {
  CampusEmotionResponse,
  CheckIn,
  CITIES,
  College,
} from "@/lib/types";
import { generateSeedCheckins } from "@/lib/seedCheckins";
import { useUserLocation } from "@/hooks/useUserLocation";

const Map3DView = dynamic(() => import("@/components/Map3DView"), {
  ssr: false,
});

export default function Home() {

  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [cityIndex, setCityIndex] = useState(0);
  const [timeFilter, setTimeFilter] = useState("All");
  const [isCampusMode, setIsCampusMode] = useState(false);
  const [registeredCollege, setRegisteredCollege] = useState<College | null>(null);
  const [cityColleges, setCityColleges] = useState<College[]>([]);
  const [campusInsights, setCampusInsights] = useState<CampusEmotionResponse | null>(null);

  const [isSpinning, setIsSpinning] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [needsCheckIn, setNeedsCheckIn] = useState(false);
  
  // NEW: Gamification State
  const [smileScore, setSmileScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isNewUser, setIsNewUser] = useState(true);
  const [showThermalRadar, setShowThermalRadar] = useState(false);

  const didAutoCenterRef = useRef(false);
  const city = CITIES[cityIndex];

  // ── Live user location ──────────────────────────────────────────
  const userLocation = useUserLocation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [locateMeTrigger, setLocateMeTrigger] = useState(0);

  const fetchCheckins = useCallback(async () => {
    try {
      const response = await fetch(`/api/checkins?city=${encodeURIComponent(city.name)}`);
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      setCheckins(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load checkins:", err);
      setCheckins([]);
    }
  }, [city.name]);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  useEffect(() => {
    // Load saved data on mount
    const storedScore = localStorage.getItem('aura_smileScore');
    const storedStreak = localStorage.getItem('aura_streak');
    const lastCheckInStr = localStorage.getItem('lastAuraCheckIn');
    
    if (storedScore) {
      setSmileScore(parseInt(storedScore));
      setStreak(parseInt(storedStreak || '0'));
      setIsNewUser(false);
    } else {
      // If no score exists, they are a new user!
      setIsNewUser(true);
      setNeedsCheckIn(true); 
      return;
    }

    // 24-Hour Lock Logic
    const lastCheckInTime = parseInt(lastCheckInStr || '0', 10);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (Date.now() - lastCheckInTime > TWENTY_FOUR_HOURS) {
      setNeedsCheckIn(true);
    }
  }, []);

  // NEW: This allows the modal to update the score mid-check-in!
  const handleLiveScoreUpdate = (newScore: number) => {
    setSmileScore(newScore);
  };

  const handleCheckInComplete = (newScore: number, newStreak: number) => {
    setSmileScore(newScore);
    setStreak(newStreak);
    setNeedsCheckIn(false);
    setIsNewUser(false);
  };

  useEffect(() => {
    let isMounted = true;

    fetch("/api/campus/me")
      .then(async (response) => {
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        if (!isMounted) {
          return;
        }

        const college = payload?.college as College | null;
        setRegisteredCollege(college ?? null);

        if (!didAutoCenterRef.current && college?.city) {
          const campusCityIndex = CITIES.findIndex((candidate) => candidate.name === college.city);
          if (campusCityIndex >= 0) {
            setCityIndex(campusCityIndex);
            didAutoCenterRef.current = true;
          }
        }
      })
      .catch((error) => {
        console.error("Failed to load campus profile:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/colleges?city=${encodeURIComponent(city.name)}`)
      .then(async (response) => {
        if (!response.ok) {
          // colleges table may not exist yet — silently fall back
          if (isMounted) setCityColleges([]);
          return;
        }
        const payload = await response.json();
        if (!isMounted) {
          return;
        }
        setCityColleges(Array.isArray(payload?.colleges) ? payload.colleges : []);
      })
      .catch(() => {
        if (isMounted) {
          setCityColleges([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [city.name]);

  useEffect(() => {
    if (!registeredCollege?.id) {
      setCampusInsights(null);
      return;
    }

    let isMounted = true;

    fetch(`/api/campus/${encodeURIComponent(registeredCollege.id)}/emotions`)
      .then(async (response) => {
        if (!response.ok) {
          if (isMounted) setCampusInsights(null);
          return;
        }
        const payload = await response.json();
        if (!isMounted) {
          return;
        }
        setCampusInsights(payload as CampusEmotionResponse);
      })
      .catch(() => {
        if (isMounted) {
          setCampusInsights(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [registeredCollege?.id]);

  // Keyboard navigation
  useEffect(() => {
    setIsCampusMode(false);

    function handleKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        setCityIndex((index) => (index - 1 + CITIES.length) % CITIES.length);
      } else if (event.key === "ArrowRight") {
        setCityIndex((index) => (index + 1) % CITIES.length);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const effectiveCampusName = registeredCollege?.name ?? checkins.find((checkin) => checkin.campus_name)?.campus_name;

  // Generate deterministic seed points for the current city so weather
  // overlays always have enough data to display emotional weather events.
  const seedPoints = useMemo(() => generateSeedCheckins(city), [city]);

  const filteredCheckins = useMemo(() => {
    const realFiltered = checkins.filter((checkin) => {
      if (isCampusMode) {
        if (registeredCollege?.id) {
          const matchesId = checkin.college_id === registeredCollege.id;
          const matchesName = checkin.campus_name === registeredCollege.name;
          if (!matchesId && !matchesName) {
            return false;
          }
        } else if (!checkin.campus_name) {
          return false;
        }
      }

      if (timeFilter === "All") return true;
      const hour = new Date(checkin.timestamp).getHours();
      if (timeFilter === "Morning") return hour >= 5 && hour < 12;
      if (timeFilter === "Afternoon") return hour >= 12 && hour < 17;
      if (timeFilter === "Evening") return hour >= 17 && hour < 21;
      if (timeFilter === "Night") return hour >= 21 || hour < 5;
      return true;
    });

    // Merge seed points (they also respect time filter)
    const filteredSeeds = timeFilter === "All"
      ? seedPoints
      : seedPoints.filter((checkin) => {
          const hour = new Date(checkin.timestamp).getHours();
          if (timeFilter === "Morning") return hour >= 5 && hour < 12;
          if (timeFilter === "Afternoon") return hour >= 12 && hour < 17;
          if (timeFilter === "Evening") return hour >= 17 && hour < 21;
          if (timeFilter === "Night") return hour >= 21 || hour < 5;
          return true;
        });

    return [...realFiltered, ...filteredSeeds];
  }, [checkins, isCampusMode, registeredCollege?.id, registeredCollege?.name, timeFilter, seedPoints]);

  return (
    <div className="h-screen w-full overflow-hidden bg-black p-2 sm:p-4">
      <div ref={mapContainerRef} className="relative h-full w-full overflow-hidden rounded-[26px] border border-[var(--border-soft)] shadow-2xl sm:rounded-[32px]">
        <Map3DView
          checkins={filteredCheckins}
          city={city}
          focusedCampus={isCampusMode ? effectiveCampusName : undefined}
          campuses={cityColleges}
          registeredCollege={registeredCollege}
          campusInsights={campusInsights}
          focusRegisteredCampus={isCampusMode}
          isSpinning={isSpinning}
          onToggleSpin={setIsSpinning}
          showThermalRadar={showThermalRadar}
          onToggleThermal={setShowThermalRadar}
          userLatitude={userLocation.latitude}
          userLongitude={userLocation.longitude}
          userAccuracy={userLocation.accuracy}
          locateMeTrigger={locateMeTrigger}
        />

        {/* HUD Moved to Bottom-Center so it NEVER blocks the City Changer */}
        {!isNewUser && (
          <Link 
            href="/report"
            className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 border border-[#ffb088]/30 backdrop-blur-xl px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(255,176,136,0.15)] z-40 animate-in slide-in-from-bottom-4 duration-700 hover:scale-105 hover:bg-black/80 hover:border-[#ffb088]/60 transition-all group pointer-events-auto"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse group-hover:scale-110 transition-transform">✨</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#ffb088] uppercase tracking-widest font-bold leading-none">Smile Score</span>
                <span className="text-white font-mono font-bold text-lg leading-tight">{smileScore.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" /> 
            <div className="flex items-center gap-1.5">
              <span className="text-orange-400 text-lg drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]">🔥</span>
              <span className="text-white font-bold text-sm">{streak} Day{streak !== 1 && 's'}</span>
            </div>
          </Link>
        )}

        {/* Badge moved away from map controls (right-28 instead of right-6) */}
        {needsCheckIn && (
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="absolute top-6 right-28 bg-neutral-900 border border-[#ffb088]/50 p-3.5 rounded-full shadow-[0_0_15px_rgba(255,176,136,0.2)] hover:bg-neutral-800 transition-all hover:scale-105 z-[60] pointer-events-auto"
          >
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] text-white font-bold items-center justify-center">!</span>
            </span>
            <span className="text-[#ffb088] text-xl leading-none">♡</span>
          </button>
        )}

        {/* Top Center: Location Search */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 text-center pointer-events-none">
          <div className="flex flex-col items-center pointer-events-auto">
            <CityNavigator currentIndex={cityIndex} onNavigate={setCityIndex} />
          </div>
        </div>

        {/* Local Clock */}
        <div className="pointer-events-none absolute bottom-6 left-6 z-[45]">
          <LocalClock selectedCity={city.name} selectedState={city.state} />
        </div>

        {/* Locate Me button */}
        {userLocation.latitude !== null && (
          <button
            onClick={() => setLocateMeTrigger((n) => n + 1)}
            className="pointer-events-auto absolute bottom-6 right-6 z-[50] flex items-center gap-2 rounded-full border border-[rgba(66,133,244,0.4)] bg-[rgba(15,23,42,0.85)] px-4 py-2.5 text-xs font-semibold text-[#60a5fa] shadow-lg backdrop-blur-md transition-all hover:border-[rgba(66,133,244,0.7)] hover:bg-[rgba(66,133,244,0.15)] hover:text-white"
          >
            📍 Locate Me
          </button>
        )}

        {/* Location error toast */}
        {userLocation.error && (
          <div className="pointer-events-none absolute bottom-20 left-1/2 z-[50] -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-950/80 px-4 py-2 text-xs text-red-300 shadow-lg backdrop-blur-md">
            {userLocation.error}
          </div>
        )}
      </div>

      {/* Pass the new props to the modal! */}
      {isModalOpen && (
        <DailyCheckInModal 
          isNewUser={isNewUser}
          onClose={() => setIsModalOpen(false)} 
          onScoreUpdate={handleLiveScoreUpdate} // Pass the live updater
          onComplete={handleCheckInComplete} 
        />
      )}
    </div>
  );
}

