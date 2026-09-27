import { db } from "../db/config.db.js";
import { ObjectId } from "mongodb";

const incidentsCollection = db.collection("incidents");

/**
 * שליפת כל האירועים (עם אופציה לסינון לפי קטגוריה)
 */
export async function getAllIncidents(category) {
  const filter = category ? { category } : {};
  const list = await incidentsCollection.find(filter).sort({ createdAt: -1 }).toArray();

  return list.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    category: doc.category,
    status: doc.status,
    location: doc.location,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));
}

/**
 * שליפת אירוע בודד לפי ID
 */
export async function getIncidentById(id) {
  const doc = await incidentsCollection.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    category: doc.category,
    status: doc.status,
    location: doc.location,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * יצירת אירוע חדש
 */
export async function createIncident({ title, description, category, location, createdBy }) {
  const now = new Date();
  const newDoc = {
    title,
    description: description || "",
    category,
    status: "open",
    location,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const result = await incidentsCollection.insertOne(newDoc);

  return {
    id: result.insertedId.toString(),
    ...newDoc,
  };
}

/**
 * עדכון אירוע קיים
 */
export async function updateIncident(id, updateFields) {
  const result = await incidentsCollection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updateFields,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!result) return null;

  return {
    id: result._id.toString(),
    title: result.title,
    description: result.description,
    category: result.category,
    status: result.status,
    location: result.location,
    createdBy: result.createdBy,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

/**
 * מחיקת אירוע
 */
export async function deleteIncident(id) {
  const res = await incidentsCollection.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount > 0;
}