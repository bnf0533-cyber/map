import { Incident, User } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ----------------- Auth API -----------------

export async function apiRegister(email: string, password: string):Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data.data;
}

export async function apiLogin(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data.data;
}

export async function apiGetMe(): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch user");
  return data.data;
}

// ----------------- Incidents API -----------------

export async function apiGetIncidents(category?: string): Promise<Incident[]> {
  const url = category && category !== "all"
    ? `${API_URL}/incidents?category=${category}`
    : `${API_URL}/incidents`;

  const res = await fetch(url, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch incidents");
  return data.data;
}

export async function apiCreateIncident(incidentData: {
  title: string;
  description: string;
  category: string;
  location: { lat: number; lng: number };
}): Promise<Incident> {
  const res = await fetch(`${API_URL}/incidents`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(incidentData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create incident");
  return data.data;
}

export async function apiUpdateIncident(
  id: string,
  updateData: Partial<Incident>
): Promise<Incident> {
  const res = await fetch(`${API_URL}/incidents/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update incident");
  return data.data;
}

export async function apiDeleteIncident(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/incidents/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete incident");
}
