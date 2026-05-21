import prisma from "../prisma.js";
import { createProjectSchema, updateProjectSchema, } from "../schemas/projectSchemas.js";
import { normalizeSandpackFiles } from "../utils/normalizeSandpackFiles.js";
export const createProject = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const parsed = createProjectSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Invalid project payload",
                details: parsed.error.flatten(),
            });
            return;
        }
        const { title, description, files, tags, isPublic } = parsed.data;
        const normalizedFiles = normalizeSandpackFiles(files);
        const project = await prisma.project.create({
            data: {
                title,
                description,
                files: normalizedFiles,
                tags,
                isPublic: isPublic ?? false,
                creatorId: userId,
            },
        });
        res.status(201).json(project);
    }
    catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ error: "Failed to create project" });
    }
};
export const updateProject = async (req, res) => {
    try {
        const userId = req.user?.id;
        const projectId = typeof req.params.id === "string" ? req.params.id : undefined;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!projectId) {
            res.status(400).json({ error: "Project id is required" });
            return;
        }
        const existingProject = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!existingProject) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        if (existingProject.creatorId !== userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        const parsed = updateProjectSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Invalid project update payload",
                details: parsed.error.flatten(),
            });
            return;
        }
        const data = parsed.data;
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.description !== undefined
                    ? { description: data.description }
                    : {}),
                ...(data.tags !== undefined ? { tags: data.tags } : {}),
                ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
                ...(data.files !== undefined
                    ? { files: normalizeSandpackFiles(data.files) }
                    : {}),
            },
        });
        res.status(200).json(updatedProject);
    }
    catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ error: "Failed to update project" });
    }
};
export const getProjects = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const projects = await prisma.project.findMany({
            where: { creatorId: userId },
            orderBy: { updatedAt: "desc" },
        });
        res.status(200).json(projects);
    }
    catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
};
export const getProjectById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const projectId = typeof req.params.id === "string" ? req.params.id : undefined;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!projectId) {
            res.status(400).json({ error: "Project id is required" });
            return;
        }
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        if (project.creatorId !== userId && !project.isPublic) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        res.status(200).json(project);
    }
    catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ error: "Failed to fetch project" });
    }
};
