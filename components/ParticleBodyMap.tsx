import React, { useRef, useEffect, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  isActivated: boolean;
}

export default function ParticleBodyMap({ onSelect }: { onSelect: (part: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full resolution
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    let particles: Particle[] = [];
    const numParticles = 3500; // High density for the "4D" look
    
    // The default unselected color (dark grey/silver like the screenshot)
    const baseColor = 'rgba(150, 150, 150, 0.4)';
    // The activated glowing color (Peach/Gold)
    const activeColor = 'rgba(255, 200, 150, 0.9)';

    // Helper to generate particles within an ellipse (for body parts)
    const createEllipse = (centerX: number, centerY: number, radiusX: number, radiusY: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()); // Even distribution
        const x = centerX + r * radiusX * Math.cos(angle);
        const y = centerY + r * radiusY * Math.sin(angle);
        
        particles.push({
          x: x + (Math.random() - 0.5) * 5, // add slight fuzziness
          y: y + (Math.random() - 0.5) * 5,
          originX: x,
          originY: y,
          color: baseColor,
          size: Math.random() * 1.5 + 0.5, // tiny varying dots
          vx: 0,
          vy: 0,
          isActivated: false
        });
      }
    };

    // Math to construct the human silhouette proportions based on canvas size
    const cx = width / 2;
    const headY = height * 0.15;
    const torsoY = height * 0.4;
    const pelvisY = height * 0.65;

    // Head
    createEllipse(cx, headY, width * 0.08, height * 0.06, 400);
    // Torso / Chest
    createEllipse(cx, torsoY, width * 0.18, height * 0.18, 1200);
    // Hips / Pelvis
    createEllipse(cx, pelvisY, width * 0.15, height * 0.1, 700);
    // Left Arm
    createEllipse(cx - width * 0.22, torsoY + height * 0.05, width * 0.05, height * 0.18, 400);
    // Right Arm
    createEllipse(cx + width * 0.22, torsoY + height * 0.05, width * 0.05, height * 0.18, 400);
    // Left Leg
    createEllipse(cx - width * 0.08, pelvisY + height * 0.15, width * 0.05, height * 0.2, 400);
    // Right Leg
    createEllipse(cx + width * 0.08, pelvisY + height * 0.15, width * 0.05, height * 0.2, 400);

    // Interaction variables
    let mouse = { x: -1000, y: -1000, radius: 50, isDown: false };

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    
    const handlePointerDown = () => { mouse.isDown = true; };
    const handlePointerUp = () => { mouse.isDown = false; };
    const handlePointerLeave = () => { mouse.x = -1000; mouse.y = -1000; mouse.isDown = false; };

    canvas.addEventListener('pointermove', handlePointerMove as EventListener);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    // The Animation Loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        // Calculate distance from mouse
        let dx = mouse.x - p.x;
        let dy = mouse.y - p.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Physics: Repel from mouse and change color if clicked/dragged
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          
          if (mouse.isDown) {
            // Activate the particles permanently when clicked (The "How We Feel" effect)
            p.isActivated = true;
            // Map the location to a body part (basic vertical mapping)
            if (p.y < height * 0.25) onSelect("Mind / Head");
            else if (p.y < height * 0.5) onSelect("Chest / Heart");
            else if (p.y < height * 0.7) onSelect("Gut / Stomach");
            else onSelect("Legs / Lower Body");
          }

          // Push particles away from the cursor slightly
          p.vx -= forceDirectionX * force * 2;
          p.vy -= forceDirectionY * force * 2;
        }

        // Return to original position (spring physics)
        p.vx += (p.originX - p.x) * 0.05;
        p.vy += (p.originY - p.y) * 0.05;

        // Apply friction
        p.vx *= 0.85;
        p.vy *= 0.85;

        p.x += p.vx;
        p.y += p.vy;

        // Draw the particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // If activated, glow peach. If not, check if close to mouse to glow slightly
        if (p.isActivated) {
          ctx.fillStyle = activeColor;
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(255, 150, 100, 0.8)'; // The "bloom" effect
        } else {
          ctx.fillStyle = distance < mouse.radius + 20 ? 'rgba(200, 200, 200, 0.8)' : p.color;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('pointermove', handlePointerMove as EventListener);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [onSelect]);

  return (
    <div 
      className="relative w-full h-[500px] bg-black rounded-xl overflow-hidden cursor-crosshair"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      
      {/* UI Overlay to mimic the screenshot's target reticle */}
      {isHovering && (
        <div className="absolute top-4 left-0 w-full text-center text-[10px] text-neutral-500 uppercase tracking-widest font-bold pointer-events-none animate-pulse">
          Click & drag to highlight sensation
        </div>
      )}
    </div>
  );
}
