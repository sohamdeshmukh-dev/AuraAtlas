export const AVATARS = [
  "https://api.dicebear.com/7.x/shapes/svg?seed=Felix",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Luna",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Bot",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Max",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Leo",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Nala",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Oliver",
] as const;

export type AvatarUrl = (typeof AVATARS)[number];
