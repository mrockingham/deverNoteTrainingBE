import express from "express";
import { createPracticeSession, getPracticeSessions, getPracticeSessionById, updatePracticeSession, submitStepAttempt, resetLessonPractice, } from "../controllers/practiceController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
router.route("/sessions")
    .get(getPracticeSessions)
    .post(createPracticeSession);
router.route("/sessions/:id")
    .get(getPracticeSessionById)
    .put(updatePracticeSession);
router.delete("/sessions/lesson/:lessonPlanId/reset", resetLessonPractice);
router.post("/sessions/:id/attempts", submitStepAttempt);
export default router;
