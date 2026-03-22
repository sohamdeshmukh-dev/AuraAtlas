"use client";
import { useEffect } from "react";
import mapboxgl from "mapbox-gl";

// 🌐 MOCK DATA: A grid of "Biometric Stress" scores over the city
const generateDeloitteGrid = () => {
  const features = [];
  const centerLng = -78.50; // Charlottesville center
  const centerLat = 38.03;
  
  // Create a grid of data points
  for (let lng = -0.02; lng <= 0.02; lng += 0.002) {
    for (let lat = -0.02; lat <= 0.02; lat += 0.002) {
      // Simulate high stress in the center/roads, low stress on edges/parks
      const distance = Math.sqrt(lng * lng + lat * lat);
      const stressScore = Math.max(0, 100 - (distance * 5000) + (Math.random() * 20));
      
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [centerLng + lng, centerLat + lat],
            [centerLng + lng + 0.0018, centerLat + lat],
            [centerLng + lng + 0.0018, centerLat + lat + 0.0018],
            [centerLng + lng, centerLat + lat + 0.0018],
            [centerLng + lng, centerLat + lat]
          ]]
        },
        properties: { stress: stressScore }
      });
    }
  }
  return { type: "FeatureCollection", features };
};

interface DeloittePulseLayerProps {
  map: mapboxgl.Map | null;
  isActive: boolean;
}

export default function DeloittePulseLayer({ map, isActive }: DeloittePulseLayerProps) {
  useEffect(() => {
    if (!map) return;

    const sourceId = "deloitte-pulse-source";
    const layerId = "deloitte-pulse-extrusion";

    if (isActive) {
      // 1. Add the Data Grid
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "geojson",
          data: generateDeloitteGrid() as any,
        });
      }

      // 2. Add the 3D Topography Layer
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: "fill-extrusion",
          source: sourceId,
          paint: {
            // Color shifts from Green (Zen) to Crimson (High Stress)
            "fill-extrusion-color": [
              "interpolate", ["linear"], ["get", "stress"],
              0, "#10B981",  // Emerald Green (Calm)
              50, "#F59E0B", // Amber (Elevated)
              80, "#E11D48", // Rose Red (High Stress)
              100, "#9F1239" // Deep Crimson (Severe)
            ],
            // Height maps to the stress score (creates jagged spikes vs smooth valleys)
            "fill-extrusion-height": [
              "interpolate", ["linear"], ["get", "stress"],
              0, 2,
              50, 20,
              100, 150
            ],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.75,
            "fill-extrusion-vertical-gradient": true
          }
        });
      }

      // Smoothly pitch the camera to show off the 3D effect
      map.easeTo({ pitch: 65, duration: 2000 });

    } else {
      // Clean up when toggled off
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      // map.easeTo({ pitch: 45, duration: 2000 });
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, isActive]);

  return null;
}
