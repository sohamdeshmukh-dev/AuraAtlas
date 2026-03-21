import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, PointMaterial, Points, Center, Html } from '@react-three/drei';
import * as THREE from 'three';

function HumanParticleCloud({ onSelect, activePart, gender }: { onSelect: (p: string) => void, activePart: string | null, gender: 'male' | 'female' }) {
  const { scene } = useGLTF('/human.glb'); 
  
  // NEW: We now track both X and Y so the orb can move left/right to the hands!
  const [clickPos, setClickPos] = useState<{x: number, y: number} | null>(null);
  const [hovered, setHovered] = useState(false);

  const { particles, geometry } = useMemo(() => {
    const allMeshes: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) allMeshes.push(child as THREE.Mesh);
    });

    let targetMesh;
    if (gender === 'female') {
      targetMesh = allMeshes.find(m => m.name.toLowerCase().includes('female'));
    } else {
      targetMesh = allMeshes.find(m => m.name.toLowerCase().includes('male') && !m.name.toLowerCase().includes('female'));
    }

    if (!targetMesh) {
      const index = gender === 'male' ? 0 : 1; 
      targetMesh = allMeshes[index] || allMeshes[0];
    }

    if (targetMesh && targetMesh.geometry) {
      const geo = targetMesh.geometry.clone();
      geo.center(); 
      return { particles: geo.attributes.position.array as any, geometry: geo };
    }
    return { particles: new Float32Array(0), geometry: null };
  }, [scene, gender]);

  const handleClick = (event: any) => {
    event.stopPropagation();
    const y = event.point.y; 
    const x = event.point.x; // Grab the horizontal click position!
    
    // Save both coordinates for the glowing orb
    setClickPos({ x, y }); 
    
    // THE 2D HITBOX UPGRADE:
    // 1. Check if the click is far to the left or right (Arms/Hands)
    if (Math.abs(x) > 0.35 && y > -0.6 && y < 0.6) {
      onSelect("Arms / Hands");
    } 
    // 2. Otherwise, check the central body column
    else if (y > 0.6) onSelect("Mind / Head");
    else if (y > 0.1) onSelect("Chest / Heart");
    else if (y > -0.4) onSelect("Gut / Stomach");
    else onSelect("Legs / Lower Body");
  };

  return (
    <Center scale={1.8}>
      <group>
        {geometry && (
          <mesh 
            geometry={geometry}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'crosshair'; }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
            onClick={handleClick}
          >
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}

        <Points positions={particles} raycast={() => null}>
          <PointMaterial transparent depthWrite={false} size={0.012} sizeAttenuation={true} color={hovered ? "#ffffff" : "#666666"} />
        </Points>

        {/* Update the orb to use both X and Y */}
        {activePart && clickPos !== null && (
          <mesh position={[clickPos.x, clickPos.y, 0]}>
            <sphereGeometry args={[0.25, 32, 32]} />
            <meshBasicMaterial color="#ffb088" transparent opacity={0.6} depthWrite={false} />
          </mesh>
        )}

        {/* Update the label to float next to the X/Y click */}
        {activePart && clickPos !== null && (
          <Html position={[clickPos.x + 0.3, clickPos.y, 0]} center>
            <div className="pointer-events-none bg-black/80 border border-[#ffb088]/40 text-[#ffb088] px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap backdrop-blur-md shadow-[0_0_15px_rgba(255,176,136,0.3)] animate-in zoom-in duration-300">
              {activePart}
            </div>
          </Html>
        )}

      </group>
    </Center>
  );
}

// --- THE MAIN COMPONENT & UI ---
export default function RotatingBodyMap({ onSelect, activePart, gender }: { onSelect: (part: string) => void, activePart: string | null, gender?: 'male' | 'female' }) {
  // Use prop if provided, otherwise internal state (fallback)
  const [internalGender, setInternalGender] = useState<'male' | 'female'>('male');
  const activeGender = gender || internalGender;

  return (
    <div className="w-full h-[400px] bg-black rounded-xl overflow-hidden relative shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
      
      {/* Only show internal toggle if gender prop isn't provided */}
      {!gender && (
        <div className="absolute top-4 left-0 w-full flex justify-center gap-8 z-10 pointer-events-auto">
          <button 
            onClick={() => setInternalGender('male')} 
            className={`text-3xl font-serif transition-all duration-500 ease-out
              ${internalGender === 'male' 
                ? 'text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.9)] scale-125' 
                : 'text-neutral-700 hover:text-neutral-500 hover:scale-110'
              }`}
          >
            ♂
          </button>
          <button 
            onClick={() => setInternalGender('female')} 
            className={`text-3xl font-serif transition-all duration-500 ease-out
              ${internalGender === 'female' 
                ? 'text-pink-400 drop-shadow-[0_0_15px_rgba(244,114,182,0.9)] scale-125' 
                : 'text-neutral-700 hover:text-neutral-500 hover:scale-110'
              }`}
          >
            ♀
          </button>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center text-neutral-800 text-xs uppercase tracking-widest -z-10">
        Loading Bio-Metrics...
      </div>

      <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
        <color attach="background" args={['#000000']} />
        
        <React.Suspense fallback={null}>
          <HumanParticleCloud 
            activePart={activePart} 
            onSelect={onSelect} 
            gender={activeGender} 
          />
        </React.Suspense>

        <OrbitControls 
          autoRotate 
          autoRotateSpeed={1.5} 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 3} 
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
