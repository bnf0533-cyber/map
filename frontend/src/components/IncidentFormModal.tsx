import React, { useState } from "react";
import { Category } from "../types";

interface Props {
  location: { lat: number; lng: number };
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: Category;
    location: { lat: number; lng: number };
  }) => Promise<void>;
}

export const IncidentFormModal: React.FC<Props> = ({
  location,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("accident");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        title,
        description,
        category,
        location,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create incident");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Report New Incident</h3>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Coordinates</label>
            <div className="coords-preview">
              Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
            </div>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="e.g. Car crash on Main St"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              <option value="accident">🚗 Accident</option>
              <option value="fire">🔥 Fire</option>
              <option value="flood">🌊 Flood</option>
              <option value="medical">🚑 Medical</option>
              <option value="other">⚠️ Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={3}
              placeholder="Describe the incident details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Reporting..." : "Report Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
