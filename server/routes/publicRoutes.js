import express from 'express';
import { generateApprovalsForBusiness } from '../engine/statutoryEngine.js';

const router = express.Router();

router.get('/stats', (req, res) => {
  res.json([
    { dept: 'Pollution Control', days: 14 },
    { dept: 'Fire Department', days: 21 },
    { dept: 'Labour Dept', days: 8 },
    { dept: 'Electricity Board', days: 12 },
  ]);
});

router.get('/approvals', (req, res) => {
  const approvals = generateApprovalsForBusiness({ sector: 'textile' });
  res.json(approvals);
});

export default router;
