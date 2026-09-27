import { z } from "zod";

export const incidentCategories = ["fire", "flood", "accident", "medical", "other"];
export const incidentStatuses = ["open", "in_progress", "closed"];

export const createIncidentSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional().default(""),
  category: z.enum(["fire", "flood", "accident", "medical", "other"], {
    errorMap: () => ({ message: "Category must be fire, flood, accident, medical, or other" }),
  }),
  location: z.object({
    lat: z.number().min(-90).max(90, { message: "Latitude must be between -90 and 90" }),
    lng: z.number().min(-180).max(180, { message: "Longitude must be between -180 and 180" }),
  }),
});

export const updateIncidentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(["fire", "flood", "accident", "medical", "other"]).optional(),
  status: z.enum(["open", "in_progress", "closed"]).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});
