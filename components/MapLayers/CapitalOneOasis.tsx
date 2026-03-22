"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { renderToStaticMarkup } from "react-dom/server";

// 📍 MOCK DATA: Capital One Locations in Charlottesville near UVA
const capOneLocations = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-78.501, 38.033] }, // Intersection near The Lawn
      properties: {
        id: "cafe-corner",
        name: "Capital One Café — The Corner",
        type: "Café",
        wait: "2 mins",
        wellness_match: "95%",
      },
    },
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-78.489, 38.041] }, // Near Barracks Road
      properties: {
        id: "atm-barracks",
        name: "Capital One ATM / Hub",
        type: "Hub",
        wait: "0 mins",
        wellness_match: "100%",
      },
    },
  ],
};

interface CapitalOneOasisProps {
  map: mapboxgl.Map | null;
  isVisible?: boolean;
}

export default function CapitalOneOasis({ map, isVisible = true }: CapitalOneOasisProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);

  useEffect(() => {
    if (!map) return;

    const init = () => {
      // Idempotent guard — don't add twice
      if (map.getSource("capital-one-source")) return;

      map.addSource("capital-one-source", {
        type: "geojson",
        data: capOneLocations,
      });

      // --- 1. THE VOLUMETRIC GLOW DOME ---
      map.addLayer({
        id: "cap-one-glow",
        type: "circle",
        source: "capital-one-source",
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            12, 80,
            16, 350,
          ],
          "circle-color": "#D6001C",
          "circle-blur": 1,
          "circle-opacity": [
            "interpolate", ["linear"], ["zoom"],
            14, 0,
            16, 0.35,
          ],
        },
      });

      // --- 2. THE MARKERS (Custom pulsing HTML buttons) ---
      capOneLocations.features.forEach((location) => {
        const props = location.properties;
        const coords = location.geometry.coordinates as [number, number];

        // Build an HTML element with Tailwind-like inline styles
        // (Tailwind won't purge classes from JS strings, so we use inline styles for dynamism)
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        el.style.position = "relative";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";

        el.innerHTML = renderToStaticMarkup(
          <div className="relative flex items-center justify-center">
            {/* Outer Pulsing Aura - Switched to Red */}
            <div 
              style={{
                position: "absolute",
                width: "48px",
                height: "48px",
                background: "rgba(214, 0, 28, 0.3)",
                borderRadius: "50%",
                animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
                animationDelay: "0.3s"
              }}
            ></div>
            <div 
              style={{
                position: "absolute",
                width: "32px",
                height: "32px",
                background: "rgba(214, 0, 28, 0.5)",
                borderRadius: "50%",
                animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite"
              }}
            ></div>
            
            {/* The Container - Switched border to Red */}
            <div 
              className="relative flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-[#D6001C]/50 rounded-full shadow-2xl transition-all duration-300"
              style={{ transition: "all 0.3s ease" }}
            >
               <span 
                 className="text-[10px] font-black text-white uppercase tracking-tighter mt-[1px]"
                 style={{
                   textShadow: "-1px -1px 0 #D6001C, 1px -1px 0 #D6001C, -1px 1px 0 #D6001C, 1px 1px 0 #D6001C"
                 }}
               >
                 Capital One
               </span>
               <span className="text-sm">☕</span>
            </div>
          </div>
        );

        // Inject ping keyframe if not already there
        if (!document.getElementById("cap-one-style")) {
          const style = document.createElement("style");
          style.id = "cap-one-style";
          style.innerHTML = `
            @keyframes ping {
              75%, 100% { transform: scale(2); opacity: 0; }
            }
            .cap-one-pill:hover {
              background: #D4AF37 !important;
              border-color: transparent !important;
            }
            .cap-one-pill:hover span:first-child {
              color: #000 !important;
            }
            .mapboxgl-popup-content {
              background: transparent !important;
              padding: 0 !important;
              box-shadow: none !important;
              border-radius: 24px !important;
            }
            .mapboxgl-popup-tip { display: none !important; }
          `;
          document.head.appendChild(style);
        }

        // --- THE CINEMATIC FLYBY ON CLICK ---
        el.addEventListener("click", (e) => {
          e.stopPropagation();

          // Close any existing popups
          popupsRef.current.forEach(p => p.remove());
          popupsRef.current = [];

          const targetZoom = 17;
          const targetPitch = 60;

          // Step 1: Fly to the location
          map.flyTo({
            center: coords,
            zoom: targetZoom,
            pitch: targetPitch,
            bearing: 0,
            duration: 2500,
            essential: true,
          });

          // Step 2: After flyby, start slow orbital rotation
          setTimeout(() => {
            map.easeTo({
              center: coords,
              zoom: targetZoom,
              pitch: targetPitch,
              bearing: 180,
              duration: 8000,
              easing: (t) => t,
            });
          }, 2500);

          // Step 3: Show the popup
          const popupHtml = `
            <div style="
              padding:20px;
              background:rgba(0,0,0,0.75);
              backdrop-filter:blur(24px);
              border:1px solid rgba(255,255,255,0.1);
              border-radius:24px;
              text-align:center;
              width:240px;
              color:white;
              box-shadow:0 16px 48px rgba(0,0,0,0.4);
            ">
              <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px;">
                <span style="font-size:28px;">☕</span>
                <div style="text-align:left;">
                  <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.1em;">Capital One</div>
                  <div style="font-size:12px;font-weight:900;line-height:1.3;">${props.name}</div>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
                <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);">
                  <div style="font-size:8px;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Wait Time</div>
                  <div style="font-size:18px;font-weight:900;color:#D4AF37;">${props.wait}</div>
                </div>
                <div style="background:rgba(52,211,153,0.08);padding:12px;border-radius:12px;border:1px solid rgba(52,211,153,0.15);">
                  <div style="font-size:8px;color:#34d399;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Wellness Match</div>
                  <div style="font-size:18px;font-weight:900;color:#6ee7b7;">${props.wellness_match}</div>
                </div>
              </div>

              <div style="padding: 2px;">
                <button 
                  style="
                    width:100%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    gap:8px;
                    padding:12px;
                    background:#D6001C;
                    color:#fff;
                    border:1px solid transparent;
                    border-radius:999px;
                    font-weight:800;
                    font-size:10px;
                    text-transform:uppercase;
                    letter-spacing:0.1em;
                    cursor:pointer;
                    transition:all 0.3s ease;
                    box-shadow:0 8px 16px rgba(214,0,28,0.3);
                  "
                  onmouseover="this.style.background='#fff'; this.style.color='#D6001C'; this.style.borderColor='#D6001C'"
                  onmouseout="this.style.background='#D6001C'; this.style.color='#fff'; this.style.borderColor='transparent'"
                >
                  <span style="transition: transform 0.3s ease;">🍃</span>
                  Draw Quiet Route Here
                </button>
              </div>
            </div>
          `;

          const popup = new mapboxgl.Popup({
            closeButton: true,
            anchor: "top",
            offset: [0, 12],
            maxWidth: "none",
          })
            .setLngLat(coords)
            .setHTML(popupHtml)
            .addTo(map);

          popupsRef.current.push(popup);
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(coords)
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    // Run immediately if the style is already loaded, otherwise wait
    if (map.isStyleLoaded()) {
      init();
    } else {
      map.once("style.load", init);
    }

    // Cleanup when component unmounts
    return () => {
      // 1. Safe React/DOM cleanups (Markers & Popups)
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      
      if (popupsRef && popupsRef.current) {
        popupsRef.current.forEach(p => p.remove());
        popupsRef.current = [];
      }

      // 2. ✨ THE BULLETPROOF FIX ✨
      // Only touch Mapbox layers if the style engine is still 100% intact!
      if (map && map.isStyleLoaded()) {
        if (map.getLayer("cap-one-monolith")) map.removeLayer("cap-one-monolith");
        if (map.getLayer("cap-one-glow")) map.removeLayer("cap-one-glow");
        if (map.getSource("capital-one-source")) map.removeSource("capital-one-source");
      }
    };
  }, [map]);
  // ✨ THE VISIBILITY TOGGLER ✨
  // This smoothly hides/shows the layers without destroying them!
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    // Convert boolean to Mapbox's specific visibility strings
    const visibility = isVisible ? "visible" : "none";

    // 1. Hide the 3D Mapbox Layers
    if (map.getLayer("cap-one-glow")) {
      map.setLayoutProperty("cap-one-glow", "visibility", visibility);
    }
    if (map.getLayer("cap-one-monolith")) {
      map.setLayoutProperty("cap-one-monolith", "visibility", visibility);
    }

    // 2. Hide the Custom HTML Markers (The pulsing coffee cups)
    markersRef.current.forEach(marker => {
      const el = marker.getElement();
      if (el) {
        el.style.display = isVisible ? "block" : "none";
      }
    });

  }, [map, isVisible]);

  return null; // Logic-only component
}
