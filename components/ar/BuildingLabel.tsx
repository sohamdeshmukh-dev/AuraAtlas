"use client";

import { Html } from "@react-three/drei";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BuildingLabelProps {
  building: {
    id: string;
    name: string;
    distance: number;
    bearing: number;
    relativeX: number;
    relativeZ: number;
    wellbeingScore: number;
    description: string;
    emotions: Record<string, number>;
  };
  isDemo: boolean;
}

export default function BuildingLabel({ building, isDemo }: BuildingLabelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Highlighting the top emotion
  const topEmotion = useMemo(() => {
    return Object.entries(building.emotions).sort((a, b) => b[1] - a[1])[0][0];
  }, [building.emotions]);

  const emotionColors: Record<string, string> = {
    Calm: "text-blue-400",
    Peaceful: "text-emerald-400",
    Inspired: "text-amber-400",
    Focus: "text-indigo-400",
    Social: "text-pink-400",
  };

  // Vertical floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = 1.6 + Math.sin(state.clock.elapsedTime + parseFloat(building.id) * 0.1) * 0.1;
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={[building.relativeX, 1.6, building.relativeZ]}
    >
      <Html
        center
        distanceFactor={Math.max(2, building.distance / 15)}
        occlude="blending"
        transform={!isDemo} // Transform for AR immersion, static for web demo
      >
        <div className="flex flex-col items-center group pointer-events-auto">
          {/* Connecting line */}
          <div className="w-[1px] h-12 bg-gradient-to-t from-white/40 to-transparent mb-[-8px]" />
          
          {/* Main Card */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl min-w-[180px] transition-all group-hover:scale-105 group-hover:bg-black/80">
            <div className="flex justify-between items-start mb-1">
              <h2 className="text-white font-black text-xs uppercase tracking-tighter leading-none">
                {building.name}
              </h2>
              <div className="bg-indigo-500/20 px-1.5 py-0.5 rounded-md border border-indigo-500/30">
                <span className="text-[8px] font-bold text-indigo-300">{Math.round(building.distance)}m</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500" 
                  style={{ width: `${building.wellbeingScore}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-white/80">{building.wellbeingScore}</span>
            </div>

            <div className="mt-3 flex gap-2 flex-wrap">
              {Object.keys(building.emotions).map((emo) => (
                <span 
                  key={emo} 
                  className={`text-[8px] font-black uppercase tracking-widest ${emotionColors[emo] || "text-white/40"}`}
                >
                  {emo} •
                </span>
              ))}
            </div>
          </div>

          {/* Emotional Weather Pointer */}
          <div className="absolute -bottom-8 w-12 h-12 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
            <div className="absolute w-1 h-1 bg-white rounded-full" />
          </div>
        </div>
      </Html>
    </group>
  );
}
