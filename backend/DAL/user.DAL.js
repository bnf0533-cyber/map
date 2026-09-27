import { db } from "../db/config.db.js";
import { ObjectId } from "mongodb";

const usersCollection = db.collection("users");

/**
 * יצירת משתמש חדש
 */
export async function createUser({ email, passwordHash, role = "user" }) {
  const newUser = {
    email,
    passwordHash,
    role,
    createdAt: new Date(),
  };

  const result = await usersCollection.insertOne(newUser);

  return {
    id: result.insertedId.toString(),
    email: newUser.email,
    role: newUser.role,
  };
}

/**
 * חיפוש משתמש לפי אימייל (לבדיקת כפילות בהרשמה או בדיקת סיסמה בהתחברות)
 */
export async function findUserByEmail(email) {
  return await usersCollection.findOne({ email });
}

/**
 * חיפוש משתמש לפי ID (מחזיר פרטים ללא הסיסמה)
 */
export async function findUserById(id) {
  return await usersCollection.findOne(
    { _id: new ObjectId(id) },
    { projection: { passwordHash: 0 } }
  );
}
