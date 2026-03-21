"use client";

import React, { useState } from 'react';
import RotatingBodyMap from './RotatingBodyMap';

// You can put this in a separate file or keep it in the same file
const EmotionQuadrant = ({ onSelect }: { onSelect: (emotion: string) => void }) => {
  const emotions = [
    { id: 'high-unpleasant', label: 'High Energy\nUnpleasant', color: 'bg-rose-500', position: '-translate-x-4 translate-y-4' },
    { id: 'high-pleasant', label: 'High Energy\nPleasant', color: 'bg-amber-400', position: 'translate-x-4 translate-y-4' },
    { id: 'low-unpleasant', label: 'Low Energy\nUnpleasant', color: 'bg-blue-400', position: '-translate-x-4 -translate-y-4' },
    { id: 'low-pleasant', label: 'Low Energy\nPleasant', color: 'bg-emerald-400', position: 'translate-x-4 -translate-y-4' },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in duration-500">
      <h3 className="text-xl font-serif text-white text-center mb-8 max-w-[200px] leading-tight">
        Tap the color that best describes how you feel
      </h3>
      <div className="relative w-64 h-64 flex items-center justify-center">
        {emotions.map((emo) => (
          <button
            key={emo.id}
            onClick={() => onSelect(emo.label.replace('\n', ' '))}
            className={`absolute w-36 h-36 rounded-full flex items-center justify-center text-center text-black font-semibold text-xs leading-tight transition-all duration-300
              ${emo.color} ${emo.position}
              mix-blend-screen opacity-90 hover:opacity-100 hover:scale-105 z-10 hover:z-20
            `}
            style={{ boxShadow: 'inset 0 0 20px rgba(255,255,255,0.2)' }}
          >
            <span className="whitespace-pre-line pointer-events-none">{emo.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const FREQUENCY_OPTIONS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

export default function DailyCheckInModal({ 
  isNewUser, 
  onClose, 
  onScoreUpdate,
  onComplete 
}: { 
  isNewUser?: boolean, 
  onClose: () => void, 
  onScoreUpdate: (score: number) => void,
  onComplete?: (score: number, streak: number) => void 
}) {
  const [step, setStep] = useState(0);
  const [isMale, setIsMale] = useState(true);
  const [checkInData, setCheckInData] = useState({ emotion: '', bodyPart: '' });
  
  const [answers, setAnswers] = useState({
    overall: 3, strength: '', strengthVent: '', satisfied: '', satisfiedVent: ''
  });

  // Custom Toast State
  const [toast, setToast] = useState<{ visible: boolean, message: string }>({ visible: false, message: '' });
  const isFormComplete = answers.strength !== '' && answers.satisfied !== '';

  const handleEmotionSelect = (emotion: string) => {
    setCheckInData({ ...checkInData, emotion });
    setStep(2); // Move to the body map step
  };

  const handleSensationComplete = () => {
    // 1. Grant 50 points immediately
    const currentScore = parseInt(localStorage.getItem('aura_smileScore') || '0');
    const newScore = currentScore + 50;
    localStorage.setItem('aura_smileScore', newScore.toString());
    
    // 2. Update the HUD behind the modal live!
    onScoreUpdate(newScore);

    // 3. Show a mini-toast and move to Step 3
    setToast({ visible: true, message: '✨ Sensation Saved! +50 Smile Score' });
    setStep(3); // THIS GUARANTEES IT MOVES TO THE QUESTIONS

    setTimeout(() => setToast({ visible: false, message: '' }), 2000);
  };

  const handleFinalSubmit = () => {
    if (!isFormComplete) return;

    const now = Date.now();
    const lastCheckInStr = localStorage.getItem('lastAuraCheckIn');
    const currentScore = parseInt(localStorage.getItem('aura_smileScore') || '0');
    let currentStreak = parseInt(localStorage.getItem('aura_streak') || '0');

    // Calculate Streak
    if (lastCheckInStr) {
      const hoursSinceLast = (now - parseInt(lastCheckInStr)) / (1000 * 60 * 60);
      if (hoursSinceLast <= 48) currentStreak += 1;
      else currentStreak = 1; 
    } else {
      currentStreak = 1; 
    }

    // Grant 100 points for questions (apply 2x multiplier for milestones!)
    let pointsEarned = 100;
    const isMilestone = currentStreak > 0 && currentStreak % 5 === 0; 
    if (isMilestone) pointsEarned *= 2; 

    const finalScore = currentScore + pointsEarned;

    // Lock the 24-hour timer and save
    localStorage.setItem('lastAuraCheckIn', now.toString());
    localStorage.setItem('aura_smileScore', finalScore.toString());
    localStorage.setItem('aura_streak', currentStreak.toString());

    const successMsg = isMilestone 
      ? `🎉 ${currentStreak} Day Streak! +${pointsEarned} Smile Score!` 
      : `✨ Reflection Complete! +${pointsEarned} Smile Score!`;
      
    setToast({ visible: true, message: successMsg });
    
    setTimeout(() => {
      setToast({ visible: false, message: '' });
      if (onComplete) onComplete(finalScore, currentStreak); 
      onClose(); // ONLY close the modal here at the very end
    }, 2500); 
  };

  const getSliderColor = (val: number) => {
    if (val === 1) return 'accent-rose-500 text-rose-500';
    if (val === 2) return 'accent-orange-500 text-orange-500';
    if (val === 3) return 'accent-amber-400 text-amber-400';
    if (val === 4) return 'accent-lime-400 text-lime-400';
    return 'accent-emerald-500 text-emerald-500';
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* CUSTOM TOAST NOTIFICATION */}
      {toast.visible && (
        <div className="absolute top-10 z-[100] flex items-center gap-3 bg-[#ffb088]/10 border border-[#ffb088]/30 backdrop-blur-xl px-6 py-3 rounded-full shadow-[0_0_30px_rgba(255,176,136,0.3)] animate-in slide-in-from-top-8 fade-in duration-300 scale-110">
          <span className="text-sm font-bold text-[#ffb088] tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* The Modal Container */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl relative transition-all duration-500 no-scrollbar">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white z-50">
          ✕
        </button>

        {/* STEP 0: ONBOARDING PROMPT VS DAILY PROMPT */}
        {step === 0 && (
          <div className="text-center py-6 animate-in slide-in-from-bottom-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#ffb088] to-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,176,136,0.4)]">
              <span className="text-white text-3xl">{isNewUser ? '✨' : '♡'}</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              {isNewUser ? 'Initialize Your Aura' : 'Daily Check-In'}
            </h2>
            
            <p className="text-sm text-neutral-400 mb-8 max-w-[80%] mx-auto leading-relaxed">
              {isNewUser 
                ? "Complete your first bio-metric check-in to initialize your Smile Score and unlock the full capabilities of Aura Atlas." 
                : "Take a minute to check in with yourself today and maintain your wellness streak."}
            </p>
            
            <button 
              onClick={() => setStep(1)}
              className="w-full bg-[#ffb088] hover:bg-[#ffc2a3] text-black font-bold py-4 rounded-full transition-all hover:scale-[1.02] shadow-lg"
            >
              {isNewUser ? 'Begin Initialization →' : 'Start Check-In'}
            </button>
          </div>
        )}

        {/* STEP 1: The Emotion Quadrant */}
        {step === 1 && (
          <EmotionQuadrant onSelect={handleEmotionSelect} />
        )}

        {/* STEP 2: The 3D Rotating Body Map */}
        {step === 2 && (
          <div className="text-center py-2 animate-in slide-in-from-right-8 w-full">
            <div className="flex items-center justify-between px-2 mb-4">
              <button onClick={() => setStep(1)} className="text-neutral-400 text-xl hover:text-white transition-colors">←</button>
              <h3 className="text-lg font-serif text-white">Where do you notice it?</h3>
              <div className="w-6" />
            </div>
            
            {/* GENDER TOGGLE UI */}
            <div className="flex justify-center gap-8 mb-4">
              <button 
                onClick={() => setIsMale(true)} 
                className={`text-3xl font-serif transition-all duration-500 ease-out
                  ${isMale 
                    ? 'text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.9)] scale-125' 
                    : 'text-neutral-700 hover:text-neutral-500 hover:scale-110'
                  }`}
              >
                ♂
              </button>
              <button 
                onClick={() => setIsMale(false)} 
                className={`text-3xl font-serif transition-all duration-500 ease-out
                  ${!isMale 
                    ? 'text-pink-400 drop-shadow-[0_0_15px_rgba(244,114,182,0.9)] scale-125' 
                    : 'text-neutral-700 hover:text-neutral-500 hover:scale-110'
                  }`}
              >
                ♀
              </button>
            </div>

            {/* THE NEW WEBGL 3D COMPONENT */}
            <div className="mb-6 -mx-4 border-y border-neutral-800/50"> 
              <RotatingBodyMap 
                activePart={checkInData.bodyPart}
                onSelect={(part) => setCheckInData({ ...checkInData, bodyPart: part })} 
                gender={isMale ? 'female' : 'male'} 
              />
            </div>

            <button 
              onClick={handleSensationComplete}
              disabled={!checkInData.bodyPart}
              className={`w-full py-3.5 rounded-full font-bold text-sm tracking-wide transition-all duration-300 shadow-lg ${
                checkInData.bodyPart ? 'bg-[#ffb088] text-black hover:bg-[#ffc2a3] hover:scale-[1.02]' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
            >
              {checkInData.bodyPart ? `Save Sensation (+50 Points) →` : `Tap a zone above`}
            </button>
          </div>
        )}

        {/* STEP 3: The Deep Reflection Questions */}
        {step === 3 && (
          <div className="py-2 animate-in slide-in-from-right-8 w-full">
            <div className="flex items-center justify-between px-2 mb-6">
              <h3 className="text-lg font-serif text-white text-center w-full">Daily Reflection</h3>
            </div>

            <div className="space-y-8 mb-8 px-2">
              
              <div className="space-y-4 bg-neutral-800/30 p-4 rounded-2xl border border-neutral-800">
                <p className="text-sm font-medium text-neutral-200">How are you feeling today overall?</p>
                <input 
                  type="range" min="1" max="5" step="1"
                  value={answers.overall}
                  onChange={(e) => setAnswers({ ...answers, overall: parseInt(e.target.value) })}
                  className={`w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer ${getSliderColor(answers.overall)}`}
                />
                <div className={`flex justify-between text-xs font-bold ${getSliderColor(answers.overall)}`}>
                  <span>1 (Poor)</span>
                  <span className="text-lg">{answers.overall}</span>
                  <span>5 (Great)</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-neutral-200">How often were you full of strength and stamina?</p>
                <div className="flex flex-wrap gap-2">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => setAnswers({ ...answers, strength: opt })}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${answers.strength === opt ? 'bg-[#ffb088] text-black shadow-[0_0_10px_rgba(255,176,136,0.3)]' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                    >{opt}</button>
                  ))}
                </div>
                <textarea 
                  placeholder="Optional: Care to elaborate or vent?"
                  value={answers.strengthVent} onChange={(e) => setAnswers({ ...answers, strengthVent: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-sm text-neutral-300 focus:border-[#ffb088] focus:ring-1 focus:ring-[#ffb088] outline-none resize-none transition-all placeholder:text-neutral-600 mt-2" rows={2}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-neutral-200">How often did you feel unburdened and satisfied?</p>
                <div className="flex flex-wrap gap-2">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => setAnswers({ ...answers, satisfied: opt })}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${answers.satisfied === opt ? 'bg-[#ffb088] text-black shadow-[0_0_10px_rgba(255,176,136,0.3)]' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                    >{opt}</button>
                  ))}
                </div>
                <textarea 
                  placeholder="Optional: Care to elaborate or vent?"
                  value={answers.satisfiedVent} onChange={(e) => setAnswers({ ...answers, satisfiedVent: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-sm text-neutral-300 focus:border-[#ffb088] focus:ring-1 focus:ring-[#ffb088] outline-none resize-none transition-all placeholder:text-neutral-600 mt-2" rows={2}
                />
              </div>

            </div>

            <button 
              onClick={handleFinalSubmit}
              disabled={!isFormComplete}
              className={`w-full py-4 rounded-full font-bold text-sm tracking-wide transition-all shadow-lg ${
                isFormComplete ? 'bg-white text-black hover:bg-neutral-200 hover:scale-[1.02]' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
            >
              {isFormComplete ? `Submit Reflection (+100 Points) ✨` : `Answer all required questions`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
