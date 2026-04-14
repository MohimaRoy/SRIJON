import express from 'express';
import { uploadSingle, uploadMultiple } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/single', upload.single('file'), uploadSingle);
router.post('/multiple', upload.array('files', 10), uploadMultiple);
// Add root post support for components that only use /upload
router.post('/', upload.single('file'), uploadSingle);

export default router;
