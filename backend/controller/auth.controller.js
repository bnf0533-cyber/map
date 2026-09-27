import bcrypt from "bcrypt";
import * as userDal from "../DAL/user.DAL.js";
import { generateToken } from "../utils/generateToken.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";

/**
 * הרשמת משתמש חדש
 */
export async function register(req, res, next) {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || "Validation failed",
      });
    }

    const { email, password } = parseResult.data;

    // בדיקה האם המשתמש כבר קיים
    const existing = await userDal.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    // הצפנת הסיסמה
    const passwordHash = await bcrypt.hash(password, 10);

    // יצירת המשתמש במסד הנתונים
    const user = await userDal.createUser({ email, passwordHash });

    // יצירת טוקן JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * התחברות משתמש קיים
 */
export async function login(req, res, next) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || "Validation failed",
      });
    }

    const { email, password } = parseResult.data;

    const user = await userDal.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * שליפת פרטי המשתמש המחובר כרגע
 */
export async function getMe(req, res, next) {
  try {
    const user = await userDal.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}
