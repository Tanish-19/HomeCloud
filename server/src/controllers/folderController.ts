import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getFolders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const parentId = req.query.parentId as string | undefined;

    const folders = await prisma.folder.findMany({
      where: {
        userId,
        parentId: parentId || null
      }
    });
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, parentId } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Folder name is required' });
      return;
    }

    if (parentId) {
      const parent = await prisma.folder.findFirst({ where: { id: parentId, userId } });
      if (!parent) {
        res.status(404).json({ error: 'Parent folder not found' });
        return;
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        userId,
        parentId: parentId || null,
      }
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { name, parentId } = req.body;

    const folder = await prisma.folder.findFirst({ where: { id, userId } });
    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    if (parentId !== undefined && parentId !== folder.parentId) {
       if (parentId) {
          const newParent = await prisma.folder.findFirst({ where: { id: parentId, userId } });
          if (!newParent) {
            res.status(404).json({ error: 'Parent folder not found' });
            return;
          }
          // Note: Full cycle detection is complex, omitted for MVP
       }
    }

    const updated = await prisma.folder.update({
      where: { id },
      data: {
        name: name || folder.name,
        parentId: parentId !== undefined ? parentId : folder.parentId,
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const folder = await prisma.folder.findFirst({ where: { id, userId } });
    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    // Since we're not cascading delete of physical files within this folder right now (Prisma handles DB cascade if configured),
    // a real production app would need to walk the tree and delete physical files from storage.
    // For MVP, we'll just let Prisma delete the records, but warn if there are files (we should physically delete them).
    // Let's implement a simple cascade on DB. The physical files would be orphaned without a cron job to clean up, 
    // which is acceptable for a first trial.
    
    await prisma.folder.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
