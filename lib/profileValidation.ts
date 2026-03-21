import { z } from "zod";

const normalizedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value.replace(/\s+/g, " "));

export const profileUpdateSchema = z.object({
  display_name: normalizedString(40).optional(),
  hobbies: normalizedString(240).optional(),
  favorite_movies: normalizedString(240).optional(),
  favorite_music: normalizedString(240).optional(),
  other_details: normalizedString(400).optional(),
  anonymous_mode: z.boolean().optional(),
  share_mood: z.boolean().optional(),
  mood_visibility: z.enum(["friends", "nobody", "everyone"]).optional(),
  avatar_url: z.string().url().optional(),
});

export const emergencyContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(60)
    .transform((value) => value.replace(/\s+/g, " ")),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(24, "Phone number is too long")
    .regex(/^[+()\-\d\s]+$/, "Use digits and phone symbols only"),
  relationship: normalizedString(40).optional().default(""),
});
