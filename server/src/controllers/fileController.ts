import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import { resolveSafePath } from '../utils/fs';

const prisma = new PrismaClient();

// Multer config for file uploads
// We store files in a temporary location and then move them safely to their permanent physical storage.
const upload = multer({ dest: 'temp_uploads/' });

export const uploadMiddleware = upload.single('file');

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { folderId } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Verify folder exists and belongs to user if folderId is provided
    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        // Cleanup temp file
        await fs.unlink(file.path).catch(console.error);
        return;
      }
    }

    // Generate physical file name
    const storedName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
    
    // Resolve final path safely (for now we keep all user files in a flat directory per user, 
    // to avoid complex directory tree syncing between DB and filesystem)
    const finalPath = resolveSafePath(storedName, userId);
    
    // Ensure user directory exists
    await fs.mkdir(path.dirname(finalPath), { recursive: true });

    // Move file
    try {
      await fs.rename(file.path, finalPath);
    } catch (err: any) {
      if (err.code === 'EXDEV') {
        // Fallback for cross-device move
        await fs.copyFile(file.path, finalPath);
        await fs.unlink(file.path);
      } else {
        throw err;
      }
    }

    // Save metadata
    const newFile = await prisma.file.create({
      data: {
        userId,
        originalName: file.originalname,
        storedName,
        relativePath: storedName, // Simplified relative path
        mimeType: file.mimetype,
        size: file.size,
        folderId: folderId || null,
      }
    });

    res.status(201).json(newFile);
  } catch (error) {
    console.error('Error uploading file:', error);
    // Cleanup on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const folderId = req.query.folderId as string | undefined;

    const files = await prisma.file.findMany({
      where: {
        userId,
        folderId: folderId || null
      }
    });
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const file = await prisma.file.findFirst({ where: { id, userId } });
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    res.json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const file = await prisma.file.findFirst({ where: { id, userId } });
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const physicalPath = resolveSafePath(file.storedName, userId);

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);

    const stream = createReadStream(physicalPath);
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).end();
    });
    
    stream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { originalName, folderId } = req.body;

    const file = await prisma.file.findFirst({ where: { id, userId } });
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }
    }

    const updated = await prisma.file.update({
      where: { id },
      data: {
        originalName: originalName || file.originalName,
        folderId: folderId !== undefined ? folderId : file.folderId,
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const file = await prisma.file.findFirst({ where: { id, userId } });
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const physicalPath = resolveSafePath(file.storedName, userId);
    
    // Delete physical file
    try {
      await fs.unlink(physicalPath);
    } catch (fsError: any) {
      if (fsError.code !== 'ENOENT') {
        throw fsError;
      }
      // If it doesn't exist on disk, we can still delete the DB record
    }

    // Delete DB record
    await prisma.file.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
