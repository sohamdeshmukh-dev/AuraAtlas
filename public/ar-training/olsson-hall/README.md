# Olsson Hall — AR Training Reference Images

This directory is reserved for storing reference photos of Olsson Hall
used to derive the visual fingerprint data in `lib/buildingVisualData.ts`.

## Source Images (5 total)
1. Front entrance — sunny day (columns, pediment, steps visible)
2. Front entrance — overcast / evening (same angle, different lighting)
3. Secondary entrance — rainy day (large windows, no columns, wet ground)
4. Secondary entrance — sunny with tree shadows (people walking)
5. Front entrance — distant view with pedestrians

## How the data was created
Visual features were manually extracted from these reference photos and
encoded as structured text in `lib/buildingVisualData.ts`. The GPT-4o
vision model uses these descriptions to match camera input during AR
identification.
