import express from 'express';
import { evaluateStatutoryApprovals, evaluateEligibleSchemes } from '../engine/statutoryEngine.js';
import { getDB, saveDB } from '../store/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/applications — Evaluate statutory rules & submit new application
router.post('/', protect, (req, res) => {
  try {
    const rawData = req.body || {};
    const evaluated = evaluateStatutoryApprovals(rawData);
    const approvals = evaluated.map((a) => ({
      ...a,
      slaDeadline: new Date(Date.now() + (a.slaDays || 21) * 86400000).toISOString(),
      escalated: false,
    }));
    const schemes = evaluateEligibleSchemes(rawData);
    const estimatedDays = approvals.reduce((max, a) => Math.max(max, a.slaDays || 0), 0) || 30;

    const newAppId = `APP-${Math.floor(1000 + Math.random() * 9000)}`;

    res.json({
      application: { id: newAppId },
      approvals,
      schemes,
      estimatedDays,
    });
  } catch (error) {
    console.error('[Application Route Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications/mine — Return applications and registered business units
router.get('/mine', protect, (req, res) => {
  try {
    const db = getDB();
    const primaryUnit = db.businesses[0] || db.applications[0] || {};
    const schemes = evaluateEligibleSchemes(primaryUnit);
    res.json({
      applications: db.applications,
      businesses: db.businesses,
      schemes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
