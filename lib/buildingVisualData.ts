/**
 * Visual feature data for AR building identification.
 *
 * Each entry contains structured architectural descriptions derived from
 * real reference photos. These descriptions are injected into the GPT-4o
 * vision prompt to dramatically improve identification accuracy.
 *
 * To add a new building:
 *  1. Collect 3-5 reference photos from different angles / lighting
 *  2. Extract distinguishing visual features
 *  3. Add a BuildingVisualProfile entry below
 */

export interface BuildingVisualProfile {
  /** Must match the `id` in uvaBuildings.ts */
  buildingId: string;
  /** Human-readable name */
  name: string;
  /** Distinctive text / signage visible on the building */
  signage: string[];
  /** Key architectural features an observer would notice */
  architecturalFeatures: string[];
  /** Materials & colour palette */
  materials: string[];
  /** View-specific descriptions (angle → what you see) */
  viewDescriptions: {
    angle: string;
    description: string;
  }[];
  /** Features that distinguish this building from visually similar ones */
  distinguishingFromSimilar: string[];
  /** Nearby context clues */
  surroundingContext: string[];
}

// ════════════════════════════════════════════════════════════════
//  OLSSON HALL — trained from 5 reference images
// ════════════════════════════════════════════════════════════════

const olssonHall: BuildingVisualProfile = {
  buildingId: "olsson-hall",
  name: "Olsson Hall",
  signage: [
    "\"OLSSON HALL\" inscribed in capital letters on the stone lintel above the main entrance",
    "\"OLSSON HALL\" text also visible on the secondary entrance facade",
    "Possible departmental plaque reading \"SYSTEMS AND INFORMATION ENGINEERING\" near one entrance",
  ],
  architecturalFeatures: [
    "Two-story red/brown brick building in Georgian Colonial Revival style",
    "Front entrance: white-columned portico with four Doric/Tuscan columns supporting a triangular pediment with dentil molding",
    "Wide granite/concrete staircase leading up to the columned portico, flanked by black wrought-iron railings",
    "White-trimmed multi-pane double-hung sash windows arranged symmetrically across the facade",
    "Second-floor windows are smaller than first-floor windows",
    "Secondary entrance (side): no columns; features a larger central doorway flanked by tall French-style multi-pane windows with stone/tan trim surrounds",
    "Flat stone steps at the secondary entrance with low stone platform",
    "Decorative cornice/molding along the roofline with dentil detailing",
    "White double doors at the main entrance",
  ],
  materials: [
    "Red/brown brick walls (Flemish or running bond pattern)",
    "White-painted wood columns and window frames",
    "Gray granite or concrete steps and base",
    "Black wrought-iron handrails and stair railings",
    "Stone or cast-stone lintel and window surrounds",
  ],
  viewDescriptions: [
    {
      angle: "Front (main entrance)",
      description:
        "Looking straight at the building you see a grand white-columned portico with a triangular pediment. Wide stone steps with black iron railings lead up to white double doors. 'OLSSON HALL' is inscribed on the stone beam above the columns. Red brick walls extend to both sides with evenly spaced white-trimmed windows on two floors.",
    },
    {
      angle: "Front — sunny day",
      description:
        "Same columned entrance but sunlit, with green trees visible to the left and a cherry blossom tree nearby. The brick colour appears warmer/lighter in direct sunlight. Shadows from the columns fall across the steps.",
    },
    {
      angle: "Front — overcast / evening",
      description:
        "The entrance appears slightly darker with flatter lighting. Notices posted on or near the doors may be visible. Bushes and landscaping flank the base of the building.",
    },
    {
      angle: "Secondary entrance (side)",
      description:
        "A different facade without columns. A central doorway with a glass-paned door is flanked by two large multi-pane windows. 'OLSSON HALL' is visibly inscribed above this entrance as well. The surrounding windows on the upper floor are evenly spaced. Flat stone steps lead to the entrance. Evergreen shrubs may be present on one side.",
    },
    {
      angle: "Secondary entrance — with pedestrians",
      description:
        "Same side entrance as above; people walking past confirm human-scale proportions. A small plaque reading 'SYSTEMS AND INFORMATION ENGINEERING' may be visible near the door.",
    },
  ],
  distinguishingFromSimilar: [
    "Unlike Rice Hall (modern glass/metal facade), Olsson Hall is entirely traditional red brick with white colonial elements",
    "Unlike Thornton Hall (larger, more industrial engineering look), Olsson is smaller and more classically styled",
    "The white-columned portico with triangular pediment is unique among the engineering buildings",
    "The visible 'OLSSON HALL' inscription is the most reliable identifier",
    "Has TWO distinct entrances with different architectural styles — columned (front) and non-columned (side)",
  ],
  surroundingContext: [
    "Located in the UVA engineering quad area",
    "Near Rice Hall (CS building — modern glass) and Thornton Hall",
    "Part of the School of Engineering and Applied Science complex",
    "Sidewalks and mature trees surround the building",
  ],
};

// ════════════════════════════════════════════════════════════════
//  REGISTRY — add new buildings here as they are "trained"
// ════════════════════════════════════════════════════════════════

export const BUILDING_VISUAL_DATA: BuildingVisualProfile[] = [olssonHall];

/**
 * Look up a visual profile by building ID.
 */
export function getVisualProfile(
  buildingId: string
): BuildingVisualProfile | undefined {
  return BUILDING_VISUAL_DATA.find((b) => b.buildingId === buildingId);
}

/**
 * Build a concise text block describing a building's visual features
 * for injection into an LLM prompt.  Keep it tight — tokens matter.
 */
export function buildVisualPromptBlock(profile: BuildingVisualProfile): string {
  const lines: string[] = [];

  lines.push(`### ${profile.name}`);
  lines.push(`Signage: ${profile.signage.join("; ")}`);
  lines.push(`Key features: ${profile.architecturalFeatures.join("; ")}`);
  lines.push(`Materials: ${profile.materials.join("; ")}`);
  lines.push(
    `Distinguishing traits: ${profile.distinguishingFromSimilar.join("; ")}`
  );

  return lines.join("\n");
}

/**
 * Build prompt blocks for a set of building IDs (e.g. the nearest ones).
 * Buildings without visual data are silently skipped.
 */
export function buildVisualPromptForBuildings(
  buildingIds: string[]
): string {
  const blocks = buildingIds
    .map((id) => {
      const profile = getVisualProfile(id);
      return profile ? buildVisualPromptBlock(profile) : null;
    })
    .filter(Boolean);

  if (blocks.length === 0) return "";

  return `\n\nDETAILED VISUAL REFERENCE DATA (from real training images):\n${blocks.join("\n\n")}`;
}
