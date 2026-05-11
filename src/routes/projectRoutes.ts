import express from "express";
import {
  createProject,
  updateProject,
  getProjects,
  getProjectById,
} from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getProjects)
  .post(createProject);

router.route("/:id")
  .get(getProjectById)
  .put(updateProject);

export default router;