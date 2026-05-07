import { Response } from 'express';
import prisma from '../../prisma.js';
import { AuthRequest } from '../../middleware/authMiddleware.js';

// GET /api/codeblocks
// Get all code blocks belonging to the logged-in user
// export const getMyCodeBlocks = async (req: AuthRequest, res: Response): Promise<void> => {
//   try {
//     const userEmail = req.user?.email;

//     if (!userEmail) {
//       res.status(400).json({ error: 'User email not found' });
//       return;
//     }

//     const codeBlocks = await prisma.codeBlock.findMany({
//       where: { creator: userEmail },
//       orderBy: { createdAt: 'desc' } // Newest first
//     });

//     res.status(200).json(codeBlocks);
//   } catch (error) {
//     console.error('Error fetching code blocks:', error);
//     res.status(500).json({ error: 'Failed to fetch code blocks' });
//   }
// };

// POST /api/codeblocks
// Create a new code block
export const createCodeBlock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    const { title, category, subCategory, javascript, css, html, note, tags, isPublic } = req.body;

    if (!userEmail) {
      res.status(400).json({ error: 'User email not found' });
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
        tags: tags || [],
        isPublic: isPublic || false,
        creator: userEmail, // Links the block to the user via their email
      },
    });

    res.status(201).json(newCodeBlock);
  } catch (error) {
    console.error('Error creating code block:', error);
    res.status(500).json({ error: 'Failed to create code block' });
  }
};


// PUT /api/codeblocks/:id
// Update an existing code block
export const updateCodeBlock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userEmail = req.user?.email;
    const data = req.body;

    // Verify the user owns this block before updating
    const existingBlock = await prisma.codeBlock.findUnique({ where: { id } });
    if (!existingBlock || existingBlock.creator !== userEmail) {
      res.status(401).json({ error: 'Not authorized to update this code block' });
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
    console.error('Error updating code block:', error);
    res.status(500).json({ error: 'Failed to update code block' });
  }
};

// DELETE /api/codeblocks/:id
// Delete a code block
export const deleteCodeBlock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userEmail = req.user?.email;

    // Verify ownership
    const existingBlock = await prisma.codeBlock.findUnique({ where: { id } });
    if (!existingBlock || existingBlock.creator !== userEmail) {
      res.status(401).json({ error: 'Not authorized to delete this code block' });
      return;
    }

    await prisma.codeBlock.delete({ where: { id } });
    res.status(200).json({ message: 'Code block deleted successfully', id });
  } catch (error) {
    console.error('Error deleting code block:', error);
    res.status(500).json({ error: 'Failed to delete code block' });
  }
};
// GET /api/codeblocks/folders
// Returns a list of unique categories for the logged-in user
export const getUserFolders = async (req: any, res: any): Promise<void> => {
  try {
    const folders = await prisma.codeBlock.groupBy({
      by: ['category'],
      where: { creator: req.user.email },
    });
    
    res.status(200).json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
};

// GET /api/codeblocks?category=React
// Returns the actual code blocks, optionally filtered by category
export const getCodeBlocks = async (req: any, res: any): Promise<void> => {
  try {
    const { category } = req.query;
    
    const blocks = await prisma.codeBlock.findMany({
      where: { 
        creator: req.user.email,
        ...(category ? { category: String(category) } : {}) 
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.status(200).json(blocks);
  } catch (error) {
    console.error('Error fetching code blocks:', error);
    res.status(500).json({ error: 'Failed to fetch code blocks' });
  }
};