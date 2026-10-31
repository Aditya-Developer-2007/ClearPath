import express from 'express';
import {
  evaluateStatutoryApprovals,
  evaluateEligibleSchemes,
  calculateCriticalPath,
  evaluateGovernmentTenders,
} from '../engine/statutoryEngine.js';
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
    const criticalPath = calculateCriticalPath(approvals);
    const estimatedDays = criticalPath.estimatedDays;
    const tenderGate = evaluateGovernmentTenders(rawData, approvals);

    const newAppId = `APP-${Math.floor(1000 + Math.random() * 9000)}`;

    res.json({
      application: { id: newAppId },
      approvals,
      schemes,
      estimatedDays,
      criticalPath,
      totalStatutoryFeeInr: criticalPath.totalStatutoryFeeInr,
      tenderGate,
    });
  } catch (error) {
    console.error('[Application Route Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications/mine — Return applications, registered business units, and compliance gate
router.get('/mine', protect, (req, res) => {
  try {
    const db = getDB();
    const primaryUnit = db.businesses[0] || db.applications[0] || {};
    const schemes = evaluateEligibleSchemes(primaryUnit);
    const activeApprovals = db.applications[0]?.approvalRequests || [];
    const tenderGate = evaluateGovernmentTenders(primaryUnit, activeApprovals);

    res.json({
      applications: db.applications,
      businesses: db.businesses,
      schemes,
      tenderGate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/applications/unlock-tenders-demo — Rapid testing helper to approve all clearances
router.post('/unlock-tenders-demo', protect, (req, res) => {
  try {
    const db = getDB();
    const primaryApp = db.applications[0];
    if (primaryApp && Array.isArray(primaryApp.approvalRequests)) {
      primaryApp.approvalRequests.forEach((reqItem) => {
        reqItem.status = 'approved';
        reqItem.lastActionAt = new Date().toISOString();
      });
      db.queue.forEach((qRow) => {
        if (qRow.id === 'req2') {
          qRow.status = 'approved';
          qRow.lastActionAt = new Date().toISOString();
        }
      });
      saveDB();
    }
    const primaryUnit = db.businesses[0] || primaryApp || {};
    const tenderGate = evaluateGovernmentTenders(primaryUnit, primaryApp?.approvalRequests || []);
    res.json({ success: true, tenderGate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
