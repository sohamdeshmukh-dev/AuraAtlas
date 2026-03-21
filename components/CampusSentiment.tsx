import React, { useMemo } from 'react';
import { getMajoritySentiment } from '../lib/sentimentEngine';

// Pass the active city name from your main map state into this component
export default function CampusSentiment({ currentCity }: { currentCity: string }) {
  
  // Recalculate the weather only when the city changes
  const sentiment = useMemo(() => getMajoritySentiment(currentCity), [currentCity]);

  return (
    <div className="flex flex-col gap-2">
      
      {/* Small Header */}
      <div className="flex items-center gap-2 px-2">
        <span className="text-[10px] text-teal-400 uppercase tracking-widest font-bold font-mono">
          Campus Sentiment
        </span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
          <span className="w-1.5 h-1.5 bg-teal-400/50 rounded-full" />
        </div>
      </div>

      {/* The Dynamic Glassmorphism Widget */}
      <div className="bg-black/60 border border-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] max-w-[280px] transition-all duration-500">
        <div className="flex items-start gap-3">
          
          {/* Dynamic Icon & Background */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${sentiment.bg}`}>
            {sentiment.icon}
          </div>

          <div className="flex flex-col">
            {/* Dynamic Title */}
            <h3 className={`font-bold text-sm mb-1 ${sentiment.color}`}>
              {sentiment.title}
            </h3>
            
            {/* Dynamic Location Description */}
            <p className="text-xs text-neutral-400 leading-snug">
              {sentiment.description}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
