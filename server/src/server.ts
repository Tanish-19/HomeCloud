import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { initializeStorage } from './utils/fs';
import authRoutes from './routes/authRoutes';
import fileRoutes from './routes/fileRoutes';
import folderRoutes from './routes/folderRoutes';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);

// Health Check Endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  const health: any = {
    status: 'ok',
    service: 'home-cloud',
    database: 'disconnected',
    storage: 'disconnected',
    storageWritable: false,
  };

  // Check Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
  } catch (error) {
    console.error('Database connection failed:', error);
  }

  // Check Storage
  const storagePath = process.env.STORAGE_PATH;
  if (storagePath) {
    try {
      // Check if path exists and is a directory
      const stats = await fs.stat(storagePath);
      if (stats.isDirectory()) {
        health.storage = 'connected';
        
        // Check if writable by trying to create and delete a temporary file
        const testFile = path.join(storagePath, '.healthcheck');
        try {
          await fs.writeFile(testFile, 'ok');
          await fs.unlink(testFile);
          health.storageWritable = true;
        } catch (err) {
          console.error('Storage is not writable:', err);
        }
      }
    } catch (error) {
      console.error('Storage path check failed:', error);
      health.status = 'degraded';
    }
  } else {
    health.status = 'degraded';
  }

  res.json(health);
});

// Start Server
async function startServer() {
  try {
    if (process.env.STORAGE_PATH) {
      await initializeStorage();
    }
    
    app.listen(PORT, HOST, () => {
      console.log(`====================================`);
      console.log(`        HOME CLOUD SERVER`);
      console.log(`====================================`);
      console.log(`Server running on: http://${HOST}:${PORT}`);
      console.log(`Storage Path: ${process.env.STORAGE_PATH}`);
      console.log(`====================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
