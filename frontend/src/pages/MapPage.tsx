import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  apiGetIncidents,
  apiCreateIncident,
  apiUpdateIncident,
  apiDeleteIncident,
} from "../services/api";
import { getSocket } from "../services/socket";
import { useAuthStore } from "../store/authStore";
import { Category, Incident, IncidentStatus } from "../types";
import { IncidentFormModal } from "../components/IncidentFormModal";
import { Navbar } from "../components/Navbar";

// פונקציה לייצור אייקונים צבעוניים לפי קטגוריה (מונעת באגים של קבצי תמונה חסרים ב-Leaflet)
function createCategoryIcon(category: Category) {
  const icons: Record<Category, string> = {
    accident: "🚗",
    fire: "🔥",
    flood: "🌊",
    medical: "🚑",
    other: "⚠️",
  };

  return L.divIcon({
    className: "custom-marker",
    html: `<div class="marker-bubble marker-${category}"><span>${icons[category] || "📍"}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

// קומפוננטת עזר של react-leaflet שתופסת לחיצה על המפה
function MapClickHandler({ onMapClick }: { onMapClick: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export const MapPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [modalLocation, setModalLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. טעינת אירועים מהשרת
  const fetchIncidents = async (category: string) => {
    try {
      setLoading(true);
      const data = await apiGetIncidents(category);
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents(selectedCategory);
  }, [selectedCategory]);

  // 2. חיבור ל-Socket.IO ועדכונים בזמן אמת
  useEffect(() => {
    const socket = getSocket();

    const handleCreated = (newIncident: Incident) => {
      setIncidents((prev) => {
        if (prev.some((item) => item.id === newIncident.id)) return prev;
        if (selectedCategory !== "all" && newIncident.category !== selectedCategory) return prev;
        return [newIncident, ...prev];
      });
    };

    const handleUpdated = (updatedIncident: Incident) => {
      setIncidents((prev) =>
        prev.map((item) => (item.id === updatedIncident.id ? updatedIncident : item))
      );
    };

    const handleDeleted = ({ id }: { id: string }) => {
      setIncidents((prev) => prev.filter((item) => item.id !== id));
    };

    socket.on("incident:created", handleCreated);
    socket.on("incident:updated", handleUpdated);
    socket.on("incident:deleted", handleDeleted);

    return () => {
      socket.off("incident:created", handleCreated);
      socket.off("incident:updated", handleUpdated);
      socket.off("incident:deleted", handleDeleted);
    };
  }, [selectedCategory]);

  // יצירת אירוע
  const handleCreateIncident = async (data: {
    title: string;
    description: string;
    category: Category;
    location: { lat: number; lng: number };
  }) => {
    await apiCreateIncident(data);
    // האירוע יתווסף אוטומטית דרך ה-Socket.IO!
  };

  // עדכון סטטוס (מורשה רק ליוצר הדיווח או admin)
  const handleStatusChange = async (id: string, newStatus: IncidentStatus) => {
    try {
      await apiUpdateIncident(id, { status: newStatus });
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  // מחיקת דיווח
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this incident?")) return;
    try {
      await apiDeleteIncident(id);
    } catch (err: any) {
      alert(err.message || "Failed to delete incident");
    }
  };

  return (
    <div className="app-layout">
      <Navbar />

      <main className="map-view-container">
        {/* סרגל סינון עליון */}
        <div className="filter-bar">
          <span className="filter-title">Filter by Category:</span>
          <div className="filter-buttons">
            {[
              { id: "all", label: "All Incidents" },
              { id: "accident", label: "🚗 Accident" },
              { id: "fire", label: "🔥 Fire" },
              { id: "flood", label: "🌊 Flood" },
              { id: "medical", label: "🚑 Medical" },
              { id: "other", label: "⚠️ Other" },
            ].map((cat) => (
              <button
                key={cat.id}
                className={`filter-btn ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {loading && <span className="loading-badge">⏳ Loading...</span>}

          <div className="instructions-hint">
            💡 Click anywhere on the map to report an incident
          </div>
        </div>

        {/* קונטיינר המפה */}
        <div className="map-wrapper">
          <MapContainer
            center={[32.0853, 34.7818]} // מרכז תל אביב
            zoom={12}
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* מאזין ללחיצה על המפה */}
            <MapClickHandler onMapClick={(coords) => setModalLocation(coords)} />

            {/* הצגת כל ה-Markers */}
            {incidents.map((inc) => {
              const isOwner = user && (inc.createdBy === user.id || user.role === "admin");

              return (
                <Marker
                  key={inc.id}
                  position={[inc.location.lat, inc.location.lng]}
                  icon={createCategoryIcon(inc.category)}
                >
                  <Popup className="incident-popup">
                    <div className="popup-content">
                      <div className="popup-header">
                        <h4>{inc.title}</h4>
                        <span className={`status-badge status-${inc.status}`}>
                          {inc.status}
                        </span>
                      </div>

                      <p className="popup-desc">{inc.description || "No description provided."}</p>

                      <div className="popup-meta">
                        <div>
                          <strong>Category:</strong> {inc.category}
                        </div>
                        <div>
                          <strong>Time:</strong>{" "}
                          {new Date(inc.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      {/* פעולות זמינות רק לבעל הדיווח או admin */}
                      {isOwner && (
                        <div className="popup-owner-actions">
                          <label>Update Status:</label>
                          <select
                            value={inc.status}
                            onChange={(e) =>
                              handleStatusChange(inc.id, e.target.value as IncidentStatus)
                            }
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="closed">Closed</option>
                          </select>

                          <button
                            className="btn-danger-sm"
                            onClick={() => handleDelete(inc.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </main>

      {/* מודאל דיווח אירוע בלחיצה על המפה */}
      {modalLocation && (
        <IncidentFormModal
          location={modalLocation}
          onClose={() => setModalLocation(null)}
          onSubmit={handleCreateIncident}
        />
      )}
    </div>
  );
};
