export type Category = "fire" | "flood" | "accident" | "medical" | "other";
export type IncidentStatus = "open" | "in_progress" | "closed";

export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: IncidentStatus;
  location: {
    lat: number;
    lng: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
