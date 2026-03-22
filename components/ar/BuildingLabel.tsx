"use client";

import { Html } from "@react-three/drei";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { VisibleBuilding } from "@/lib/arGeo";
import { getScoreColor } from "@/lib/arGeo";

interface BuildingLabelProps {
  building: VisibleBuilding;
  isDemo: boolean;
}

/** Map emotion_breakdown keys → display-friendly colours */
const EMOTION_COLORS: Record<string, string> = {
  calm: "text-blue-400",
  happy: "text-emerald-400",
  anxious: "text-amber-400",
  sad: "text-rose-400",
  inspired: "text-purple-400",
  stressed: "text-orange-400",
};

export default function BuildingLabel({ building, isDemo }: BuildingLabelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { building: bldg, distance, position } = building;

  // Score-based colour for the wellbeing bar
  const scoreColor = useMemo(() => getScoreColor(bldg.wellbeing_score), [bldg.wellbeing_score]);

  // Top emotion for highlighting
  const topEmotion = useMemo(() => {
    const entries = Object.entries(bldg.emotion_breakdown);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [bldg.emotion_breakdown]);

  // Stable per-building animation offset (hash the id string to a number)
  const animOffset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < bldg.id.length; i++) {
      hash = ((hash << 5) - hash + bldg.id.charCodeAt(i)) | 0;
    }
    return (hash % 100) * 0.063; // deterministic offset 0-6.3 (~0-2π)
  }, [bldg.id]);

  // Vertical floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        position.y + Math.sin(state.clock.elapsedTime * 0.8 + animOffset) * 0.15;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
    >
      <Html
        center
        distanceFactor={Math.max(2, distance / 15)}
        occlude="blending"
        transform={!isDemo}
      >
        <div className="flex flex-col items-center group pointer-events-auto select-none">
          {/* Connecting line */}
          <div className="w-[1px] h-12 bg-gradient-to-t from-white/40 to-transparent mb-[-8px]" />

          {/* Main Card */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl min-w-[180px] transition-all group-hover:scale-105 group-hover:bg-black/80">
            <div className="flex justify-between items-start mb-1">
              <h2 className="text-white font-black text-xs uppercase tracking-tighter leading-none max-w-[130px]">
                {bldg.name}
              </h2>
              <div className="bg-indigo-500/20 px-1.5 py-0.5 rounded-md border border-indigo-500/30 shrink-0 ml-2">
                <span className="text-[8px] font-bold text-indigo-300">{Math.round(distance)}m</span>
              </div>
            </div>

            {/* Emoji vibe */}
            {bldg.emoji_vibe && bldg.emoji_vibe.length > 0 && (
              <div className="text-[10px] mt-1 mb-1">
                {bldg.emoji_vibe.join(" ")}
              </div>
            )}

            {/* Wellbeing Score Bar */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${bldg.wellbeing_score}%`,
                    backgroundColor: scoreColor.text,
                  }}
                />
              </div>
              <span
                className="text-[10px] font-mono font-bold"
                style={{ color: scoreColor.text }}
              >
                {bldg.wellbeing_score}
              </span>
            </div>

            {/* Description */}
            <p className="text-[8px] text-neutral-400 mt-2 leading-relaxed line-clamp-2">
              {bldg.description}
            </p>

            {/* Emotion breakdown pills */}
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {Object.entries(bldg.emotion_breakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4) // Show top 4 emotions only for space
                .map(([emo, value]) => (
                  <span
                    key={emo}
                    className={`text-[7px] font-black uppercase tracking-widest ${EMOTION_COLORS[emo] || "text-white/40"}`}
                  >
                    {emo} {value}%
                  </span>
                ))}
            </div>
          </div>

          {/* Emotional Weather Pointer */}
          <div className="absolute -bottom-8 w-12 h-12 flex items-center justify-center">
            <div
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: scoreColor.text }}
            />
            <div className="absolute w-1 h-1 bg-white rounded-full" />
          </div>
        </div>
      </Html>
    </group>
  );
}
