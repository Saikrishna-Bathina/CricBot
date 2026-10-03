import express from 'express';
import { analyzeMatchScenario } from '../controllers/scenarioController.js';

const router = express.Router();

router.post('/scenarios/analyze', analyzeMatchScenario);

export default router;
