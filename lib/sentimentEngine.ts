export const WEATHER_STATES = {
  STRESSED: { icon: '⛈️', title: 'Thunderstorms Likely', color: 'text-rose-400', bg: 'bg-rose-500/20' },
  CALM: { icon: '🌤️', title: 'Partly Cloudy', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  DEPLETED: { icon: '🌧️', title: 'Heavy Fog / Drizzle', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  ENERGETIC: { icon: '☀️', title: 'Clear Skies', color: 'text-amber-400', bg: 'bg-amber-500/20' }
};

const CITY_DATABASE: Record<string, { state: keyof typeof WEATHER_STATES, hotspots: string[] }> = {
  "philadelphia": { state: 'STRESSED', hotspots: ['Temple Univ.', 'Center City'] },
  "new york": { state: 'ENERGETIC', hotspots: ['NYU Campus', 'Midtown'] },
  "boston": { state: 'DEPLETED', hotspots: ['MIT Campus', 'Harvard Square'] },
  "los angeles": { state: 'CALM', hotspots: ['UCLA Campus', 'Santa Monica'] },
  "chicago": { state: 'STRESSED', hotspots: ['UChicago', 'The Loop'] },
  "san francisco": { state: 'DEPLETED', hotspots: ['SFSU', 'Mission District'] },
  "seattle": { state: 'CALM', hotspots: ['UW Campus', 'Capitol Hill'] }
};

export function getMajoritySentiment(cityName: string) {
  // 1. Normalize the incoming city name (lowercase it to remove case sensitivity)
  const normalizedInput = (cityName || "").toLowerCase();

  // 2. FUZZY SEARCH: Look through our database keys to see if they overlap
  // e.g., "new york city" includes "new york", so it's a match!
  const matchedKey = Object.keys(CITY_DATABASE).find(key => 
    normalizedInput.includes(key) || key.includes(normalizedInput)
  );

  // 3. Grab the data, or use the fallback only if it's a completely unknown city
  const data = matchedKey 
    ? CITY_DATABASE[matchedKey] 
    : { state: 'CALM' as keyof typeof WEATHER_STATES, hotspots: ['the local area'] };
  
  const weatherState = WEATHER_STATES[data.state];
  
  return {
    ...weatherState,
    description: `High concentration detected near ${data.hotspots[0]}`
  };
}
