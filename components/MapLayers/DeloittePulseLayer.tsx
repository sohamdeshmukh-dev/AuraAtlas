"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

// 🌐 MOCK DATA: Generates scattered, organic data nodes instead of a solid block
const generateDeloitteNodes = () => {
  const features = [];
  const centerLng = -78.50; // Charlottesville center
  const centerLat = 38.03;
  
  // Step size is 0.004, but pillar size is 0.0015 (Creates massive gaps between them!)
  for (let lng = -0.06; lng <= 0.06; lng += 0.004) {
    for (let lat = -0.06; lat <= 0.06; lat += 0.004) {
      
      // Skip 30% of the nodes randomly so it looks like an organic data network
      if (Math.random() > 0.7) continue;

      const distance = Math.sqrt(lng * lng + lat * lat);
      const stressScore = Math.max(0, 100 - (distance * 1500) + (Math.random() * 40));
      
      // Add a polygon geometry for the Pillars (Extrusion)
      features.push({
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [centerLng + lng, centerLat + lat],
            [centerLng + lng + 0.0015, centerLat + lat], // THIN Pillars
            [centerLng + lng + 0.0015, centerLat + lat + 0.0015],
            [centerLng + lng, centerLat + lat + 0.0015],
            [centerLng + lng, centerLat + lat]
          ]]
        },
        properties: { stress: stressScore, isPillar: true }
      });

      // Add a center point for the glowing heatmap (Ground Glow)
      features.push({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [centerLng + lng + 0.00075, centerLat + lat + 0.00075] },
        properties: { stress: stressScore, isPillar: false }
      });
    }
  }
  return { type: "FeatureCollection" as const, features };
};

interface DeloittePulseLayerProps {
  map: mapboxgl.Map | null;
  isActive: boolean;
}

export default function DeloittePulseLayer({ map, isActive }: DeloittePulseLayerProps) {
  const dataRef = useRef(generateDeloitteNodes());

  useEffect(() => {
    if (!map) return;

    const sourceId = "deloitte-pulse-source";
    const heatmapLayerId = "deloitte-pulse-heatmap";
    const extrusionLayerId = "deloitte-pulse-extrusion";

    // 🛠️ HELPER 1: Safely Build Layers
    const buildLayers = () => {
      // ✨ FIX 1: Use isStyleLoaded() to prevent the crash
      if (!map || !map.isStyleLoaded()) return;

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: "geojson", data: dataRef.current });
      }

      if (!map.getLayer(heatmapLayerId)) {
        const layers = map.getStyle().layers;
        const firstLabelId = layers?.find((l: any) => l.type === 'symbol')?.id;

        map.addLayer({
          id: heatmapLayerId,
          type: "heatmap",
          source: sourceId,
          filter: ["==", "isPillar", false],
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "stress"], 0, 0, 100, 1],
            "heatmap-intensity": 2, 
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0, 255, 135, 0)", 0.2, "#00FF87", 0.4, "#70FF00", 0.6, "#FFB800", 0.8, "#FF0055", 1, "#FF0000"     
            ],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 20, 15, 80],
            "heatmap-opacity": 0.8
          }
        }, firstLabelId); 
      }

      if (!map.getLayer(extrusionLayerId)) {
        map.addLayer({
          id: extrusionLayerId,
          type: "fill-extrusion",
          source: sourceId,
          filter: ["==", "isPillar", true],
          paint: {
            "fill-extrusion-color": [
              "interpolate", ["linear"], ["get", "stress"], 0, "#00FF87", 50, "#FFB800", 80, "#FF0055", 100, "#FF0000"
            ],
            "fill-extrusion-height": [
              "interpolate", ["linear"], ["get", "stress"], 0, 10, 50, 80, 100, 400 
            ],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.9,
            "fill-extrusion-vertical-gradient": true
          }
        });
      }
    };

    // 🧨 HELPER 2: Safely Destroy Layers
    const destroyLayers = () => {
      // ✨ FIX 2: Use isStyleLoaded() here too. 
      // This prevents the crash when toggling OFF or during Hot Reload.
      if (map && map.isStyleLoaded()) {
        if (map.getLayer(heatmapLayerId)) map.removeLayer(heatmapLayerId);
        if (map.getLayer(extrusionLayerId)) map.removeLayer(extrusionLayerId);
      }
    };

    // --- 🎮 MAIN LOGIC ---
    if (isActive) {
      if (map.isStyleLoaded()) {
        buildLayers();
      } else {
        map.once('style.load', buildLayers); // Wait for the style specifically
      }
      map.easeTo({ pitch: 60, bearing: 15, duration: 2500 });
    } else {
      destroyLayers();
      map.easeTo({ pitch: 45, bearing: 0, duration: 2000 });
    }

    return () => {
      destroyLayers();
    };
  }, [map, isActive]);

  return null;
}
