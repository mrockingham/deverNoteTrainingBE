import express from "express";
import { createLessonStep, updateLessonStep, getLessonStepsByPlan, } from "../controllers/lessonStepController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
router.get("/plan/:lessonPlanId", getLessonStepsByPlan);
router.post("/", createLessonStep);
router.put("/:id", updateLessonStep);
export default router;
