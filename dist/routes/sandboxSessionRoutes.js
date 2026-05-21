import express from "express";
import { createSandboxSession, updateSandboxSession, getSandboxSessions, getSandboxSessionById, deleteSandboxSession, deleteAllSandboxSessions, } from "../controllers/sandboxSessionController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(protect);
router.route("/")
    .get(getSandboxSessions)
    .post(createSandboxSession);
router.delete("/all", deleteAllSandboxSessions);
router.route("/all/:id")
    .get(getSandboxSessionById)
    .put(updateSandboxSession)
    .delete(deleteSandboxSession);
export default router;
