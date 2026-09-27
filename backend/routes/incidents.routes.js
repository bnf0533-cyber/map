import { Router } from "express";
import * as incidentCtrl from "../controller/incidents.controller.js";
import { authMiddleware } from "../utils/authMiddleware.js";

const router = Router();

// כל הנתיבים של אירועים דורשים התחברות (טוקן JWT)
router.use(authMiddleware);

router.get("/", incidentCtrl.getIncidents);
router.get("/:id", incidentCtrl.getIncidentById);
router.post("/", incidentCtrl.createIncident);
router.patch("/:id", incidentCtrl.updateIncident);
router.delete("/:id", incidentCtrl.deleteIncident);

export default router;
