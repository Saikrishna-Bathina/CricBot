import express from 'express';
import { getLiveness, getReadiness } from '../controllers/healthController.js';

const router = express.Router();

router.get('/health', getLiveness);
router.get('/health/ready', getReadiness);

export default router;
