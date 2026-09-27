import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "incident-secret-key-123";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

/**
 * יצירת טוקן JWT עבור משתמש
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
