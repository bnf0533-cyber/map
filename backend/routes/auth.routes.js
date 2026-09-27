import { Router } from "express";
import * as authCtrl from "../controller/auth.controller.js";
import { authMiddleware } from "../utils/authMiddleware.js";

const router = Router();

// נתיבי אימות ציבוריים
router.post("/register", authCtrl.register);
router.post("/login", authCtrl.login);

// נתיב מוגן - קבלת פרטי המשתמש המחובר
router.get("/me", authMiddleware, authCtrl.getMe);

export default router;
