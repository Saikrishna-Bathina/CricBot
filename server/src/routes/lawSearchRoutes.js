import express from 'express';
import { searchLaws, getSourceDetails } from '../controllers/lawSearchController.js';

const router = express.Router();

router.get('/laws/search', searchLaws);
router.get('/sources/:sourceId', getSourceDetails);

export default router;
