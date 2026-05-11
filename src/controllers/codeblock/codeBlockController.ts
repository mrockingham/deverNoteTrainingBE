import { Response } from "express";
import prisma from "../../prisma.js";
import { AuthRequest } from "../../middleware/authMiddleware.js";

// POST /api/codeblocks
export const createCodeBlock = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      title,
      category,
      subCategory,
      javascript,
      css,
      html,
      note,
      tags,
      isPublic,
    } = req.body;

    if (!userId) {
      res.status(400).json({ error: "User id not found" });
      return;
    }

    const newCodeBlock = await prisma.codeBlock.create({
      data: {
        title,
        category,
        subCategory,
        javascript,
        css,
        html,
        note,
        tags: Array.isArray(tags) ? tags : [],
        isPublic: typeof isPublic === "boolean" ? isPublic : false,
        creatorId: userId,
      },
    });

    res.status(201).json(newCodeBlock);
  } catch (error) {
    console.error("Error creating code block:", error);
    res.status(500).json({ error: "Failed to create code block" });
  }
};

// PUT /api/codeblocks/:id
export const updateCodeBlock = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : undefined;
    const userId = req.user?.id;
    const data = req.body;

    if (!id) {
      res.status(400).json({ error: "Code block id is required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const existingBlock = await prisma.codeBlock.findUnique({
      where: { id },
    });

    if (!existingBlock || existingBlock.creatorId !== userId) {
      res.status(401).json({ error: "Not authorized to update this code block" });
      return;
    }

    const updatedBlock = await prisma.codeBlock.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        subCategory: data.subCategory,
        javascript: data.javascript,
        css: data.css,
        html: data.html,
        note: data.note,
        tags: data.tags,
        isPublic: data.isPublic,
      },
    });

    res.status(200).json(updatedBlock);
  } catch (error) {
    console.error("Error updating code block:", error);
    res.status(500).json({ error: "Failed to update code block" });
  }
};

// DELETE /api/codeblocks/:id
export const deleteCodeBlock = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : undefined;
    const userId = req.user?.id;

    if (!id) {
      res.status(400).json({ error: "Code block id is required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const existingBlock = await prisma.codeBlock.findUnique({
      where: { id },
    });

    if (!existingBlock || existingBlock.creatorId !== userId) {
      res.status(401).json({ error: "Not authorized to delete this code block" });
      return;
    }

    await prisma.codeBlock.delete({ where: { id } });

    res.status(200).json({
      message: "Code block deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Error deleting code block:", error);
    res.status(500).json({ error: "Failed to delete code block" });
  }
};

// GET /api/codeblocks/folders
export const getUserFolders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const folders = await prisma.codeBlock.groupBy({
      by: ["category"],
      where: { creatorId: userId },
    });

    res.status(200).json(folders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ error: "Failed to fetch folders" });
  }
};

// GET /api/codeblocks?category=React
export const getCodeBlocks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const blocks = await prisma.codeBlock.findMany({
      where: {
        creatorId: userId,
        ...(category ? { category } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    res.status(200).json(blocks);
  } catch (error) {
    console.error("Error fetching code blocks:", error);
    res.status(500).json({ error: "Failed to fetch code blocks" });
  }
};