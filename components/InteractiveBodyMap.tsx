import React, { useState } from 'react';

export default function InteractiveBodyMap({ onSelect }: { onSelect: (part: string) => void }) {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // The interactive energy centers on the body
  const bodyNodes = [
    { id: 'head', label: 'Mind / Head', top: '15%', left: '50%', color: 'bg-violet-400', shadow: 'shadow-violet-500/50' },
    { id: 'chest', label: 'Chest / Heart', top: '38%', left: '50%', color: 'bg-teal-400', shadow: 'shadow-teal-500/50' },
    { id: 'stomach', label: 'Gut / Stomach', top: '60%', left: '50%', color: 'bg-amber-400', shadow: 'shadow-amber-500/50' },
    { id: 'left-arm', label: 'Left Arm', top: '45%', left: '30%', color: 'bg-blue-400', shadow: 'shadow-blue-500/50' },
    { id: 'right-arm', label: 'Right Arm', top: '45%', left: '70%', color: 'bg-blue-400', shadow: 'shadow-blue-500/50' },
  ];

  const handleNodeClick = (node: typeof bodyNodes[0]) => {
    setActiveNode(node.id);
    onSelect(node.label);
  };

  return (
    <div className="relative w-full h-64 flex items-center justify-center bg-black rounded-xl border border-neutral-800 overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
      
      {/* 1. The Holographic / Blueprint Silhouette (SVG) */}
      <svg viewBox="0 0 200 300" className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        {/* Glowing Head */}
        <circle cx="100" cy="50" r="25" fill="none" stroke="white" strokeWidth="1" strokeDasharray="3 3" className="animate-[spin_20s_linear_infinite]" />
        {/* Shoulders & Torso */}
        <path d="M100,75 C100,75 140,80 155,110 C170,140 150,250 150,250 L50,250 C50,250 30,140 45,110 C60,80 100,75 100,75 Z" 
              fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
        {/* Arms */}
        <path d="M45,110 C20,130 10,180 15,220" fill="none" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M155,110 C180,130 190,180 185,220" fill="none" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
      </svg>

      {/* 2. The Interactive Glowing Nodes */}
      {bodyNodes.map((node) => {
        const isActive = activeNode === node.id;
        return (
          <div
            key={node.id}
            className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ top: node.top, left: node.left }}
            onClick={() => handleNodeClick(node)}
          >
            {/* The Target Ring (Appears on Hover/Active) */}
            <div className={`absolute w-12 h-12 rounded-full border-2 border-dashed transition-all duration-500
              ${isActive ? `border-white scale-100 opacity-100 animate-[spin_4s_linear_infinite]` : 'border-neutral-500 scale-50 opacity-0 group-hover:scale-75 group-hover:opacity-50'}
            `} />
            
            {/* The Core Glowing Dot */}
            <div className={`w-3 h-3 rounded-full transition-all duration-300
              ${isActive ? `${node.color} shadow-[0_0_20px_4px] ${node.shadow} scale-150` : 'bg-neutral-600 scale-100 group-hover:bg-white'}
            `} />

            {/* The Label */}
            <span className={`absolute top-6 whitespace-nowrap text-[10px] font-bold tracking-widest uppercase transition-all duration-300
              ${isActive ? 'text-white opacity-100 translate-y-0' : 'text-neutral-500 opacity-0 translate-y-2 group-hover:opacity-100'}
            `}>
              {node.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
