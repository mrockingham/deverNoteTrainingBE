import express from "express";
import { createLessonPlan, updateLessonPlan, getLessonPlans, getLessonPlanById, } from "../controllers/lessonPlanController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
router.route("/")
    .get(getLessonPlans)
    .post(createLessonPlan);
router.route("/:id")
    .get(getLessonPlanById)
    .put(updateLessonPlan);
export default router;
