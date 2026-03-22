"use client";

import { UVA_BUILDINGS } from "@/lib/uvaBuildings";

interface DemoControlsProps {
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number }) => void;
  heading: number | null;
  setHeading: (h: number) => void;
  onToggleDebug: () => void;
}

export default function DemoControls({
  userLocation,
  setUserLocation,
  heading,
  setHeading,
  onToggleDebug,
}: DemoControlsProps) {
  return (
    <div className="fixed bottom-24 right-6 left-6 sm:left-auto sm:w-80 bg-black/80 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-2xl z-50 animate-in slide-in-from-right-10 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-black tracking-tight uppercase">Demo Controls</h3>
        <button 
          onClick={onToggleDebug}
          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded-md"
        >
          TOGGLE DEBUG
        </button>
      </div>

      <div className="space-y-4">
        {/* Preset Locations */}
        <div>
          <label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest block mb-2">Teleport to UVA</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "The Rotunda", lat: 38.0356, lng: -78.5034 },
              { name: "Newcomb Hall", lat: 38.0358, lng: -78.5064 },
              { name: "Old Cabell", lat: 38.0326, lng: -78.5048 },
              { name: "Rice Hall", lat: 38.0317, lng: -78.5108 },
              { name: "Olsson Hall", lat: 38.0325, lng: -78.5107 },
              { name: "Thornton Hall", lat: 38.0330, lng: -78.5100 },
            ].map(loc => (
              <button
                key={loc.name}
                onClick={() => setUserLocation({ lat: loc.lat, lng: loc.lng })}
                className="text-[10px] font-bold text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-xl transition-all"
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Latitude/Longitude */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-neutral-500 font-bold uppercase mb-1 block">Lat Offset</label>
            <input 
              type="range" 
              min="-0.005" 
              max="0.005" 
              step="0.0001"
              value={userLocation ? userLocation.lat - 38.0356 : 0}
              onChange={(e) => setUserLocation({ ...userLocation!, lat: 38.0356 + parseFloat(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-500 font-bold uppercase mb-1 block">Lng Offset</label>
            <input 
              type="range" 
              min="-0.005" 
              max="0.005" 
              step="0.0001"
              value={userLocation ? userLocation.lng - (-78.5034) : 0}
              onChange={(e) => setUserLocation({ ...userLocation!, lng: -78.5034 + parseFloat(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Heading Control (The "Spin Fix") */}
        <div>
          <label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest block mb-1">Manual Rotation (Heading: {Math.round(heading || 0)}°)</label>
          <input 
            type="range" 
            min="0" 
            max="360" 
            value={heading || 0}
            onChange={(e) => setHeading(parseInt(e.target.value))}
            className="w-full h-1.5 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-neutral-600 font-bold">N</span>
            <span className="text-[8px] text-neutral-600 font-bold">E</span>
            <span className="text-[8px] text-neutral-600 font-bold">S</span>
            <span className="text-[8px] text-neutral-600 font-bold">W</span>
            <span className="text-[8px] text-neutral-600 font-bold">N</span>
          </div>
        </div>
      </div>
    </div>
  );
}
