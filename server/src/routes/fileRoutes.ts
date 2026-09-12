import { Router } from 'express';
import { uploadMiddleware, uploadFile, getFiles, getFile, downloadFile, updateFile, deleteFile } from '../controllers/fileController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadMiddleware, uploadFile);
router.get('/', getFiles);
router.get('/:id', getFile);
router.get('/:id/download', downloadFile);
router.patch('/:id', updateFile);
router.delete('/:id', deleteFile);

export default router;
