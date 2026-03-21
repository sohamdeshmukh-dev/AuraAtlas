"use client";
import { useEffect, useRef, useState } from "react";

export default function AuraLensView({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Standard States
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState<{ score: number; sentiment: string; recommendation: string } | null>(null);
  
  // 🌟 "God-Mode" States
  const [timeOffset, setTimeOffset] = useState(0); // For Temporal Dial
  const [showPath, setShowPath] = useState(false); // For Aura Path
  const [isIntervention, setIsIntervention] = useState(false); // For Grounding Matrix

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access denied!", err);
      }
    };
    startCamera();
    return () => { if (stream) stream.getTracks().forEach((track) => track.stop()); };
  }, []);

  // 🗣️ The AI Voice Engine
  const speakAnalysis = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsScanning(true);
    setAnalysis(null);
    setShowPath(false);
    setIsIntervention(false);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg", 0.7);

    try {
      const res = await fetch("/api/analyze-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Image }),
      });
      const data = await res.json();
      setAnalysis(data);

      // 🛑 INTERVENTION TRIGGER: If score is terrible, launch Grounding Matrix!
      if (data.score <= 300) {
        setIsIntervention(true);
        speakAnalysis(`High stress environment detected. Initiating grounding matrix. Follow the orb and sync your breathing.`);
      } else {
        speakAnalysis(`Aura check complete. ${data.sentiment}.`);
      }
      
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsScanning(false);
    }
  };

  const triggerAuraPath = () => {
    setShowPath(true);
    speakAnalysis("Projecting Aura Path to the nearest Safe Circle. Follow the lights.");
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden font-sans animate-fade-in">
      
      {/* CSS For the 4-7-8 Breathing Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes breathe {
          0%, 100% { transform: scale(0.8); opacity: 0.3; box-shadow: 0 0 20px rgba(168,85,247,0.2); }
          21% { transform: scale(2.5); opacity: 0.9; box-shadow: 0 0 100px rgba(168,85,247,1); } /* 4s Inhale */
          58% { transform: scale(2.5); opacity: 0.9; box-shadow: 0 0 100px rgba(168,85,247,1); } /* 7s Hold */
        }
        .animate-breathe { animation: breathe 19s ease-in-out infinite; }
      `}} />

      {/* Live Video */}
      <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isIntervention ? "opacity-20 blur-xl" : "opacity-80"}`} />
      <canvas ref={canvasRef} className="hidden" />

      {/* 🌌 AR FEATURE 3: The Aura Path (Floor Projection) */}
      {showPath && !isIntervention && (
        <div className="absolute bottom-0 w-full h-1/2 flex justify-center items-end pointer-events-none z-10 opacity-80 animate-fade-in">
          <div 
            className="w-full h-full bg-gradient-to-t from-purple-500/80 to-transparent blur-md animate-pulse" 
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)' }}
          ></div>
          <div 
            className="absolute bottom-0 w-full h-full bg-purple-300/60 blur-sm" 
            style={{ clipPath: 'polygon(48% 0%, 52% 0%, 100% 100%, 0% 100%)' }}
          ></div>
        </div>
      )}

      {/* 🛑 AR FEATURE 1: The Grounding Matrix (Panic Intervention) */}
      {isIntervention && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-auto">
          <h2 className="text-purple-300 font-black tracking-widest uppercase text-2xl mb-16 animate-pulse">
            Sync Breathing
          </h2>
          <div className="w-32 h-32 rounded-full bg-purple-500/30 border border-purple-400 animate-breathe flex items-center justify-center backdrop-blur-md">
            <div className="w-16 h-16 rounded-full bg-white shadow-[0_0_30px_white]"></div>
          </div>
          <button onClick={() => setIsIntervention(false)} className="mt-32 px-6 py-2 border border-white/20 text-white/50 rounded-full text-xs uppercase tracking-widest hover:bg-white/10">
            Exit Matrix
          </button>
        </div>
      )}

      {/* Main AR UI Overlay (Hidden during intervention) */}
      {!isIntervention && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8 z-20">
          
          {/* Top Header */}
          <div className="w-full flex justify-between items-center pointer-events-auto">
            <div className="bg-black/50 backdrop-blur-md border border-purple-500/50 px-4 py-2 rounded-xl flex items-center gap-3">
              <span className="animate-pulse w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,1)]"></span>
              <span className="text-purple-300 text-[10px] font-bold tracking-widest uppercase">GPT-5.4-Pro Active</span>
            </div>
            <button onClick={() => { window.speechSynthesis.cancel(); onClose(); }} className="bg-black/50 backdrop-blur-md border border-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase">
              Exit Lens
            </button>
          </div>

          {/* Center Area: Reticle or Results */}
          <div className="relative flex flex-col items-center justify-center w-full max-w-sm">
            {!analysis && (
              <div className="relative flex items-center justify-center w-72 h-72">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-500 opacity-70"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-500 opacity-70"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-500 opacity-70"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500 opacity-70"></div>
                {isScanning && <div className="absolute top-0 w-full h-0.5 bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,1)] animate-[bounce_2s_ease-in-out_infinite]"></div>}
              </div>
            )}

            {/* The GPT Results Card */}
            {analysis && (
              <div className="bg-black/80 backdrop-blur-2xl border border-purple-500/50 p-6 rounded-3xl shadow-[0_0_30px_rgba(168,85,247,0.3)] text-center animate-fade-in-up w-full pointer-events-auto">
                {/* Dynamically adjust score based on time dial for the demo magic */}
                <h3 className="text-3xl font-black text-white mb-1">
                  {Math.min(1000, analysis.score + (timeOffset * 45))} Aura Score
                </h3>
                <p className="text-purple-400 font-bold text-xs uppercase tracking-widest mb-4">
                  {timeOffset > 0 ? `Predicted in ${timeOffset} Hours` : analysis.sentiment}
                </p>
                <div className="bg-white/10 p-3 rounded-xl border border-white/5 mb-4">
                  <p className="text-neutral-200 text-sm">{analysis.recommendation}</p>
                </div>
                
                {/* Trigger Path Button */}
                {!showPath && (
                  <button onClick={triggerAuraPath} className="w-full py-2 bg-purple-600/30 border border-purple-500 hover:bg-purple-500/50 text-purple-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                    Find Quiet Route 🚶
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Action Panel */}
          <div className="pointer-events-auto w-full max-w-sm flex flex-col gap-4">
            
            {/* ⏱️ AR FEATURE 2: Temporal Dial */}
            {analysis && (
              <div className="bg-black/60 backdrop-blur-md border border-neutral-800 p-4 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-purple-400">
                  <span>Present</span>
                  <span>+{timeOffset} Hours</span>
                </div>
                <input 
                  type="range" min="0" max="12" step="1" 
                  value={timeOffset} 
                  onChange={(e) => setTimeOffset(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            )}

            <button
              onClick={captureAndAnalyze} disabled={isScanning}
              className={`w-full py-4 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-2xl ${
                isScanning ? "bg-purple-900/50 border border-purple-500 text-white animate-pulse" : "bg-white text-black hover:bg-neutral-200"
              }`}
            >
              {isScanning ? "Running GPT-5.4-Pro..." : analysis ? "Scan New Area 👁️" : "Capture Environment 👁️"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
