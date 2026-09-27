import * as incDal from "../DAL/incident.DAL.js";
import {
  createIncidentSchema,
  updateIncidentSchema,
} from "../validations/incident.validation.js";
import {
  emitIncidentCreated,
  emitIncidentUpdated,
  emitIncidentDeleted,
} from "../utils/socket.js";

/**
 * קבלת כל האירועים (כולל סינון אופציונלי לפי קטגוריה)
 */
export async function getIncidents(req, res, next) {
  try {
    const { category } = req.query;
    const data = await incDal.getAllIncidents(category);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * קבלת אירוע בודד לפי מזהה
 */
export async function getIncidentById(req, res, next) {
  try {
    const { id } = req.params;
    const incident = await incDal.getIncidentById(id);
    if (!incident) {
      return res.status(404).json({ success: false, message: "Incident not found" });
    }
    res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
}

/**
 * יצירת אירוע חדש ושידורו לכל הלקוחות המחוברים
 */
export async function createIncident(req, res, next) {
  try {
    const parseResult = createIncidentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || "Validation failed",
      });
    }

    const { title, description, category, location } = parseResult.data;

    // יצירת הדיווח - ה-createdBy נלקח תמיד מהטוקן המאומת של המשתמש!
    const newIncident = await incDal.createIncident({
      title,
      description,
      category,
      location,
      createdBy: req.user.id,
    });

    // שידור האירוע בזמן אמת לכל מי שמחובר למפה
    emitIncidentCreated(newIncident);

    res.status(201).json({ success: true, data: newIncident });
  } catch (error) {
    next(error);
  }
}

/**
 * עדכון אירוע קיים (מורשה רק ליוצר האירוע או ל-admin)
 */
export async function updateIncident(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await incDal.getIncidentById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Incident not found" });
    }

    // בדיקת הרשאות: רק מי שיצר את הדיווח או admin רשאים לערוך
    if (existing.createdBy !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to update this incident",
      });
    }

    const parseResult = updateIncidentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || "Validation failed",
      });
    }

    const updated = await incDal.updateIncident(id, parseResult.data);

    // שידור עדכון בזמן אמת
    emitIncidentUpdated(updated);

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * מחיקת אירוע (מורשה רק ליוצר האירוע או ל-admin)
 */
export async function deleteIncident(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await incDal.getIncidentById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Incident not found" });
    }

    // בדיקת הרשאות
    if (existing.createdBy !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to delete this incident",
      });
    }

    await incDal.deleteIncident(id);

    // שידור מחיקה בזמן אמת
    emitIncidentDeleted(id);

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
}
