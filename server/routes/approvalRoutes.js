import express from 'express';
import { getDB, saveDB, getApprovalComposite, updateApprovalStatus, appendActivityLog } from '../store/db.js';
import { DEMO_PROFILE_ADDRESS } from '../store/seedData.js';
import { computeUrgencyScore } from '../engine/statutoryEngine.js';
import { verifyDocumentSubmission } from '../engine/verificationEngine.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/approvals — Public standard checklist
router.get('/', (req, res) => {
  try {
    const approvals = getDB().applications[0]?.approvalRequests || [];
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/approvals/queue — Officer Review Queue with deterministic RTPS Urgency Scoring
router.get('/queue', protect, (req, res) => {
  try {
    const db = getDB();
    const currentNow = new Date();

    const computedQueue = db.queue.map((row) => {
      const docs = db.documents[row.id] || [];
      const warningsCount = row.warningsCount !== undefined
        ? row.warningsCount
        : docs.reduce((acc, d) => acc + (d.warnings?.length || 0), 0);

      const urgencyScore = computeUrgencyScore({ ...row, warningsCount });
      return {
        ...row,
        warningsCount,
        urgencyScore,
      };
    });

    // Sort deterministically:
    // 1. Escalated / overdue first
    // 2. Highest urgencyScore
    // 3. Earliest slaDeadline
    // 4. Stable ID tie-breaker
    computedQueue.sort((a, b) => {
      const aOverdue = new Date(a.slaDeadline) < currentNow;
      const bOverdue = new Date(b.slaDeadline) < currentNow;

      if (a.escalated !== b.escalated) return (b.escalated ? 1 : 0) - (a.escalated ? 1 : 0);
      if (aOverdue !== bOverdue) return (bOverdue ? 1 : 0) - (aOverdue ? 1 : 0);
      if (b.urgencyScore !== a.urgencyScore) return b.urgencyScore - a.urgencyScore;

      const aTime = a.slaDeadline ? new Date(a.slaDeadline).getTime() : 0;
      const bTime = b.slaDeadline ? new Date(b.slaDeadline).getTime() : 0;
      if (aTime !== bTime) return aTime - bTime;

      return String(a.id).localeCompare(String(b.id));
    });

    res.json(computedQueue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/approvals/:id — Approval request details
router.get('/:id', protect, (req, res) => {
  try {
    const composite = getApprovalComposite(req.params.id);
    if (!composite) {
      return res.status(404).json({ error: 'Approval request not found' });
    }
    res.json(composite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handler for document check & upload
const handleDocumentUpload = (req, res) => {
  try {
    const { id } = req.params;
    const { docType, fileName, declaredFields } = req.body;
    const db = getDB();

    const composite = getApprovalComposite(id);
    const masterProfile = composite?.applicantProfile || db.applicantProfiles[id] || db.businesses[0] || {
      address: DEMO_PROFILE_ADDRESS,
      pan: 'AABCS1429B',
    };
    const existingDocs = db.documents[id] || [];

    const verification = verifyDocumentSubmission(
      composite,
      docType,
      fileName,
      declaredFields,
      masterProfile,
      existingDocs
    );

    const warnings = verification.warnings;
    const docHash = verification.docHash;

    const docRecord = {
      id: `doc-${Date.now()}-${docType.toLowerCase().replace(/\s+/g, '-')}`,
      docType,
      label: docType,
      fileName: fileName || `${docType.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      validated: warnings.length === 0,
      declaredFields: declaredFields
        ? { ...declaredFields }
        : { address: masterProfile.address || DEMO_PROFILE_ADDRESS, pan: masterProfile.pan || 'AABCS1429B', unitSize: '500 sq.m' },
      warnings,
      docHash,
    };

    if (!db.documents[id]) db.documents[id] = [];
    const existingIdx = db.documents[id].findIndex((d) => d.docType === docType);
    if (existingIdx >= 0) {
      db.documents[id][existingIdx] = docRecord;
    } else {
      db.documents[id].push(docRecord);
    }

    const qRow = db.queue.find((r) => r.id === id);
    if (qRow) {
      qRow.warningsCount = warnings.length;
    }

    saveDB();

    res.json({
      ok: warnings.length === 0,
      document: docRecord,
      warnings,
      docHash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/approvals/:id/documents & POST /api/approvals/:id/check-doc
router.post('/:id/documents', protect, handleDocumentUpload);
router.post('/:id/check-doc', protect, handleDocumentUpload);

// POST /api/approvals/:id/submit — Submit approval application to officer queue
router.post('/:id/submit', protect, (req, res) => {
  try {
    const { id } = req.params;

    updateApprovalStatus(id, 'submitted');

    appendActivityLog(id, {
      action: 'Submitted for Review',
      by: req.user?.name || 'Aarav Mehta',
      note: 'All required documents submitted with statutory declaration',
    });

    res.json({ success: true, approval: getApprovalComposite(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/approvals/:id/action — Officer action (approve / reject / query)
router.patch('/:id/action', protect, (req, res) => {
  try {
    const { id } = req.params;
    const { action, note, officerName, msgId } = req.body;
    const db = getDB();
    const ts = new Date().toISOString();
    const byOfficer = officerName || req.user?.name || 'Vikramaditya Sinh';

    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      query: 'query_raised',
    };
    const newStatus = statusMap[action] || 'submitted';

    updateApprovalStatus(id, newStatus, { assignedOfficerName: byOfficer });

    const actionLabels = { approve: 'Approved', reject: 'Rejected', query: 'Query Raised' };
    appendActivityLog(id, {
      action: actionLabels[action] || action,
      by: byOfficer,
      timestamp: ts,
      note: note || '',
    });

    if (action === 'query' && note) {
      const queryMsgId = msgId || `msg-q-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const queryMsg = {
        id: queryMsgId,
        senderRole: 'officer',
        senderName: byOfficer,
        text: note,
        timestamp: ts,
      };
      if (!db.messages[id]) db.messages[id] = [];
      const exists = db.messages[id].some((m) => m.id === queryMsgId);
      if (!exists) {
        db.messages[id].push(queryMsg);
      }
      saveDB();
    }

    const qRow = db.queue.find((r) => r.id === id);

    res.json({
      id,
      status: newStatus,
      lastActionAt: ts,
      activityLog: db.activityLogs[id],
      messages: db.messages[id] || [],
      certificateMeta: qRow?.certificateMeta || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/approvals/:id/messages — Approval conversation thread
router.get('/:id/messages', protect, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    res.json(db.messages[id] || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/approvals/:id/messages — Send message in conversation thread
router.post('/:id/messages', protect, (req, res) => {
  try {
    const { id } = req.params;
    const { text, senderName, senderRole, customMsgId } = req.body;
    const db = getDB();

    const role = senderRole || req.user?.role || 'applicant';
    const name = senderName || req.user?.name || (role === 'officer' ? 'Vikramaditya Sinh' : 'Aarav Mehta');
    const msgId = customMsgId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const newMsg = {
      id: msgId,
      senderRole: role,
      senderName: name,
      text,
      timestamp: new Date().toISOString(),
    };

    if (!db.messages[id]) db.messages[id] = [];
    const isDuplicate = db.messages[id].some((m) => m.id === msgId);
    if (!isDuplicate) {
      db.messages[id].push(newMsg);
    }

    saveDB();

    res.json({
      success: true,
      message: newMsg,
      messages: [...db.messages[id]],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
