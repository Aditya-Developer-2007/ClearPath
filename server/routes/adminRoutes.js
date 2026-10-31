import express from 'express';
import { getDB, saveDB, resetDB, verifyAuditChainContinuity, appendActivityLog } from '../store/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

export const SENIOR_OFFICERS = {
  'Fire Dept': 'Director, State Fire & Emergency Services',
  Safety: 'Director, State Fire & Emergency Services',
  Environment: 'Member Secretary, State PCB',
  Industrial: 'Chief Inspector of Factories (DISH)',
  Labour: 'Additional Labour Commissioner',
  Utilities: 'Chief Engineer (Commercial), State DISCOM',
  MSME: 'Joint Director of Industries (MSME)',
  Finance: 'Joint Commissioner of State Tax',
};

// GET /api/admin/audit-integrity — Cryptographic audit chain verification
router.get('/audit-integrity', protect, (req, res) => {
  try {
    const auditResult = verifyAuditChainContinuity();
    res.json(auditResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/analytics — Dynamic governance analytics with deep statutory telemetry
router.get('/analytics', protect, (req, res) => {
  try {
    const db = getDB();
    const currentNow = new Date();

    const applicationUnits = new Set();
    db.queue.forEach((r) => {
      const key = r.unitName || r.applicantName || r.id;
      if (key) applicationUnits.add(key);
    });
    db.applications.forEach((a) => {
      const key = (a.sector && a.city) ? `${a.sector}, ${a.city}` : a.id;
      if (key) applicationUnits.add(key);
    });
    const totalApplications = applicationUnits.size;

    const reqsMap = new Map();
    db.queue.forEach((r) => reqsMap.set(r.id, { ...r }));
    db.applications.forEach((app) => {
      (app.approvalRequests || []).forEach((r) => {
        if (!reqsMap.has(r.id)) {
          reqsMap.set(r.id, {
            id: r.id,
            name: r.name,
            applicantName: 'Aarav Mehta',
            unitName: `${app.sector}, ${app.city}`,
            department: r.department,
            status: r.status,
            slaDeadline: r.slaDeadline || new Date(Date.now() + (r.slaDays || 21) * 86400000).toISOString(),
            escalated: r.escalated,
            lastActionAt: r.lastActionAt,
            statutoryFeeInr: r.statutoryFeeInr,
          });
        }
      });
    });

    const allReqs = Array.from(reqsMap.values());
    const openReqs = allReqs.filter((r) => !['approved', 'rejected'].includes(r.status));
    const breaches = openReqs.filter((r) => new Date(r.slaDeadline) < currentNow);
    const escalations = allReqs.filter((r) => r.escalated);

    const totals = {
      applications: totalApplications,
      breaches: breaches.length,
      escalations: escalations.length,
    };

    const depts = ['Fire Dept', 'Environment', 'Industrial', 'Utilities', 'Labour'];
    const byDepartment = depts.map((dept) => {
      const deptAll = allReqs.filter((r) => r.department === dept || (dept === 'Fire Dept' && r.department === 'Safety'));
      const deptOpen = deptAll.filter((r) => !['approved', 'rejected'].includes(r.status));
      const deptBreaches = deptOpen.filter((r) => new Date(r.slaDeadline) < currentNow).length;

      let avgDays = 14;
      if (dept === 'Fire Dept') avgDays = 14;
      else if (dept === 'Environment') avgDays = 22;
      else if (dept === 'Industrial') avgDays = 16;
      else if (dept === 'Utilities') avgDays = 11;
      else if (dept === 'Labour') avgDays = 8;

      return {
        dept,
        avgDays,
        breaches: deptBreaches,
        pending: deptOpen.length,
      };
    });

    const slowest = openReqs.map((r) => {
      const overdueDays = Math.max(0, Math.ceil((currentNow - new Date(r.slaDeadline)) / 86400000));
      const daysTaken = r.lastActionAt
        ? Math.max(1, Math.round((currentNow - new Date(r.lastActionAt)) / 86400000))
        : 8;

      return {
        id: r.id,
        name: r.name,
        applicantName: r.applicantName || 'Aarav Mehta',
        dept: r.department || 'General',
        daysTaken,
        overdueDays,
        escalated: r.escalated || false,
      };
    }).sort((a, b) => {
      if (b.overdueDays !== a.overdueDays) return b.overdueDays - a.overdueDays;
      return b.daysTaken - a.daysTaken;
    });

    let totalStatutoryFeesTracked = 0;
    allReqs.forEach((r) => {
      totalStatutoryFeesTracked += Number(r.statutoryFeeInr) || 0;
    });

    let combinedInspectionsSaved = 0;
    (db.inspections || []).forEach((insp) => {
      combinedInspectionsSaved += Number(insp.visitsSaved) || 0;
    });

    const auditIntegrity = verifyAuditChainContinuity();

    res.json({
      totals,
      byDepartment,
      slowest,
      escalationCount: totals.escalations,
      totalStatutoryFeesTracked,
      combinedInspectionsSaved,
      auditIntegrity,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/fast-forward — Simulate time shift and trigger SLA escalations
router.post('/fast-forward', protect, (req, res) => {
  try {
    const days = req.body.days !== undefined ? Number(req.body.days) : 10;
    if (days <= 0) {
      return res.json({ shifted: 0, newlyEscalated: [] });
    }
    const db = getDB();
    const currentNow = new Date();
    const newlyEscalated = [];
    let shiftedCount = 0;

    const escalateRequest = (id, department) => {
      const queueRow = db.queue.find((r) => r.id === id);
      let cacheReq = null;
      for (const app of db.applications) {
        const found = (app.approvalRequests || []).find((r) => r.id === id);
        if (found) {
          cacheReq = found;
          break;
        }
      }

      if (!queueRow && !cacheReq) return false;
      const isAlreadyEscalated = (queueRow && queueRow.escalated) || (cacheReq && cacheReq.escalated);
      if (isAlreadyEscalated) return false;

      const dept = department || queueRow?.department || cacheReq?.department || 'Safety';
      const officerName = SENIOR_OFFICERS[dept] || 'Senior Officer';
      const assignedOfficerTitle = `${officerName}, Senior Officer, ${dept}`;
      const nowIso = new Date().toISOString();

      if (queueRow) {
        queueRow.escalated = true;
        queueRow.escalatedFrom = 'SLA Breach Auto-Escalation';
        queueRow.assignedOfficerName = assignedOfficerTitle;
      }
      if (cacheReq) {
        cacheReq.escalated = true;
        cacheReq.assignedOfficerName = assignedOfficerTitle;
      }

      appendActivityLog(id, {
        action: 'Escalated to Senior Officer (SLA breached)',
        by: 'System',
        timestamp: nowIso,
        note: `SLA deadline breached. Reassigned to ${assignedOfficerTitle}.`,
      });

      if (!db.messages[id]) db.messages[id] = [];
      db.messages[id].push({
        id: `msg-sys-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        senderRole: 'system',
        senderName: 'System',
        text: `SLA deadline breached. Request escalated to ${assignedOfficerTitle}.`,
        timestamp: nowIso,
      });

      return true;
    };

    // 1. Shift open requests in queue
    db.queue.forEach((row) => {
      if (!['approved', 'rejected'].includes(row.status)) {
        const oldMs = row.slaDeadline ? new Date(row.slaDeadline).getTime() : (Date.now() + 14 * 86400000);
        if (!isNaN(oldMs)) {
          const newDeadline = new Date(oldMs - days * 86400000).toISOString();
          row.slaDeadline = newDeadline;
          shiftedCount++;

          if (new Date(newDeadline) < currentNow && row.escalated === false) {
            const didEscalate = escalateRequest(row.id, row.department);
            if (didEscalate && !newlyEscalated.includes(row.id)) {
              newlyEscalated.push(row.id);
            }
          }
        }
      }
    });

    // 2. Sync to applicant store
    db.applications.forEach((app) => {
      (app.approvalRequests || []).forEach((req) => {
        const queueRow = db.queue.find((q) => q.id === req.id);
        if (queueRow) {
          req.slaDeadline = queueRow.slaDeadline;
          req.escalated = queueRow.escalated;
          if (queueRow.escalated) {
            req.assignedOfficerName = queueRow.assignedOfficerName;
          }
        } else if (!['approved', 'rejected'].includes(req.status)) {
          const oldMs = req.slaDeadline
            ? new Date(req.slaDeadline).getTime()
            : (Date.now() + (req.slaDays || 21) * 86400000);
          if (!isNaN(oldMs)) {
            const newDeadline = new Date(oldMs - days * 86400000).toISOString();
            req.slaDeadline = newDeadline;
            shiftedCount++;

            if (new Date(newDeadline) < currentNow && req.escalated === false) {
              const didEscalate = escalateRequest(req.id, req.department);
              if (didEscalate && !newlyEscalated.includes(req.id)) {
                newlyEscalated.push(req.id);
              }
            }
          }
        }
      });
    });

    saveDB();
    res.json({ shifted: shiftedCount, newlyEscalated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/inspections — Joint inspection proposals
router.get('/inspections', protect, (req, res) => {
  try {
    const db = getDB();
    res.json(db.inspections.map((i) => ({ ...i })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/inspections/schedule — Confirm combined inspection schedule
router.post('/inspections/schedule', protect, (req, res) => {
  try {
    const { id, slotDate } = req.body;
    const db = getDB();
    const proposal = db.inspections.find((i) => i.id === id);

    if (!proposal) {
      return res.status(404).json({ error: 'Inspection proposal not found' });
    }

    proposal.status = 'scheduled';
    if (slotDate) {
      proposal.proposedDate = slotDate;
    }

    if (
      proposal.applicantName === 'Aarav Mehta' ||
      proposal.applicantName === 'Alice Applicant' ||
      proposal.approvalRequestIds.includes('req2')
    ) {
      if (db.applications[0]) {
        db.applications[0].scheduledInspection = {
          id: proposal.id,
          date: slotDate || proposal.proposedDate,
          unitName: proposal.unitName,
        };
      }
    }

    saveDB();
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/reset & POST /api/reset — Restore initial Golden Demo state
router.post('/reset', protect, (req, res) => {
  try {
    resetDB();
    res.json({ success: true, message: 'Database reset to golden demo state' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
