"use client";

// We need to pass the setIsARModeActive down from the parent!
export default function AuraLens({ isActive, setIsActive }: { isActive: boolean, setIsActive: (val: boolean) => void }) {
  return (
    <button 
      onClick={() => {
        setIsActive(!isActive);
      }}
      className={`flex items-center justify-between w-full px-4 py-2.5 rounded-2xl backdrop-blur-xl border transition-all duration-300 shadow-2xl group ${
        isActive 
          ? "bg-purple-500/20 border-purple-500/50 text-purple-200" 
          : "bg-black/40 border-white/10 text-white/70 hover:text-white hover:bg-black/60 hover:border-white/30"
      }`}
    >
      <span className="text-[10px] font-bold tracking-widest uppercase mt-[1px]">
        {isActive ? "Lens Active" : "Aura Lens"}
      </span>
      <span className="text-sm">👁️</span>
    </button>
  );
}
