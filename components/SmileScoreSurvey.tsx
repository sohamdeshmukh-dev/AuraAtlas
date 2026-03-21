"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SmileScoreSurvey({ 
  userId, 
  userEmail,
  isCapOneLinked,
  setCapOneMiles
}: { 
  userId: string, 
  userEmail: string,
  isCapOneLinked: boolean,
  setCapOneMiles: (miles: number) => void
}) {
  const [step, setStep] = useState(1);
  const [journal, setJournal] = useState("");
  const [score, setScore] = useState(50);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleProfileCheckInSubmit = async (sliderValue: number) => {
    // 1. Save to Supabase (Optional but good for history)
    try {
      await supabase.from("journals").insert({
        user_id: userId,
        daily_score: sliderValue
      });
    } catch (err) {
      console.log("Supabase save failed", err);
    }

    // 2. Get current stats
    const currentScore = parseInt(localStorage.getItem('aura_smileScore') || '0');
    let currentStreak = parseInt(localStorage.getItem('aura_streak') || '0');

    // 3. Add Points (e.g., +50 for a profile quick check-in)
    const pointsEarned = 50; 
    const finalScore = currentScore + pointsEarned;
    
    // Increment streak (simplified for the demo)
    currentStreak += 1;

    // 4. Save to LocalStorage so the HUD updates everywhere
    localStorage.setItem('aura_smileScore', finalScore.toString());
    localStorage.setItem('aura_streak', currentStreak.toString());
    localStorage.setItem('lastAuraCheckIn', Date.now().toString());

    // 5. Calculate Miles Reward
    const isShieldOn = localStorage.getItem('impulseShield') === 'true';
    let currentMiles = parseInt(localStorage.getItem('aura_capOneMiles') || '0');
    let milesEarned = 0;

    // If they have the shield on, reward them!
    if (isShieldOn && isCapOneLinked) {
      milesEarned = 50; 
      currentMiles += milesEarned;
      localStorage.setItem('aura_capOneMiles', currentMiles.toString());
      setCapOneMiles(currentMiles); // Update the UI instantly
    }

    // 6. Trigger Background Rewards (Email + Miles)
    try {
      // Fire and forget! This runs in the background so it doesn't slow down the UI
      fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,       
          userEmail: userEmail, 
          score: sliderValue              
        }),
      });
    } catch (e) {
      console.error("Failed to trigger background rewards", e);
    }

    // 7. Success state
    setIsSubmitted(true);

    // 8. Show success toast
    const successMsg = milesEarned > 0 
      ? `+${pointsEarned} Smile Score & +${milesEarned} CapOne Miles!` 
      : `Check-in complete! +${pointsEarned} Smile Score added.`;
      
    toast.success(successMsg);
  };

  const handleSubmit = async () => {
    // Also use gamification logic for step 2!
    handleProfileCheckInSubmit(score);
  };

  if (isSubmitted) return (
    <>
      <div className="p-6 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30 text-center shadow-lg animate-in fade-in duration-500">
        <div className="text-3xl mb-2">✨</div>
        <p className="font-bold">Aura Updated!</p>
        <p className="text-xs text-teal-500/80 mt-1">+50 Smile Score Added</p>
      </div>
    </>
  );

  return (
    <div className="p-8 bg-black/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-teal-500/10" />
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-teal-400">📊</span> Daily Smile Check-In
        </h3>
        
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <p className="text-sm text-neutral-300 font-medium">How would you rate your mental clarity today?</p>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
              <input 
                type="range" min="1" max="100" 
                value={score} 
                onChange={(e) => setScore(Number(e.target.value))} 
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-teal-400" 
              />
              <div className="flex justify-between text-[10px] mt-4 font-black uppercase tracking-widest text-neutral-500">
                <span>Foggy</span>
                <span className="text-teal-400 text-lg">{score}</span>
                <span>Crystal</span>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setStep(2)} 
                className="flex-1 bg-white/5 text-white font-bold py-3 px-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-sm"
              >
                Add Journal entry
              </button>
              <button 
                onClick={() => handleProfileCheckInSubmit(score)}
                className="flex-[2] bg-teal-400 hover:bg-teal-300 text-black font-bold py-3 px-4 rounded-2xl shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <p className="text-sm text-neutral-300 font-medium">Journal your thoughts (Optional)</p>
            <textarea 
              value={journal} 
              onChange={(e) => setJournal(e.target.value)} 
              placeholder="How are the vibes today?" 
              className="w-full h-32 bg-white/5 text-white border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-neutral-600 resize-none shadow-inner" 
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)} 
                className="px-6 py-3 rounded-2xl text-neutral-400 font-bold hover:text-white transition-colors text-sm"
              >
                Back
              </button>
              <button 
                onClick={handleSubmit} 
                className="flex-1 bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-2xl shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
              >
                Calculate & Submit
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
