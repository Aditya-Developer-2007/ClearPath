import express from 'express';
import { getDB, saveDB, getApprovalComposite, updateApprovalStatus } from '../store/db.js';
import { DEMO_PROFILE_ADDRESS } from '../store/seedData.js';
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

// GET /api/approvals/queue — Officer Review Queue
// MUST be registered before /:id so Express does not capture "queue" as an ID
router.get('/queue', protect, (req, res) => {
  try {
    const db = getDB();
    res.json(db.queue.map((r) => ({ ...r })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/approvals/:id — Approval request details (for both Applicant & Officer views)
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

// POST /api/approvals/:id/documents — Document upload & consistency verification
router.post('/:id/documents', protect, (req, res) => {
  try {
    const { id } = req.params;
    const { docType, fileName, declaredFields } = req.body;
    const db = getDB();

    const normalizedDeclared = declaredFields?.address?.trim().toLowerCase();
    const normalizedTarget = DEMO_PROFILE_ADDRESS.trim().toLowerCase();
    const hasMismatch = docType === 'Lease Deed' && normalizedDeclared && normalizedDeclared !== normalizedTarget;

    const warnings = hasMismatch
      ? [
          {
            field: 'Business Address',
            doc1: 'Application form',
            doc2: 'Lease deed',
            note: 'Address on the lease deed differs from your application. Fix it before submitting.',
          },
        ]
      : [];

    const docRecord = {
      id: `doc-${Date.now()}-${docType.toLowerCase().replace(/\s+/g, '-')}`,
      docType,
      label: docType,
      fileName: fileName || `${docType.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      validated: warnings.length === 0,
      declaredFields: declaredFields
        ? { ...declaredFields }
        : { address: DEMO_PROFILE_ADDRESS, pan: 'ABCDE1234F', unitSize: '1500 sqft' },
      warnings,
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
      document: docRecord,
      warnings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/approvals/:id/submit — Submit approval application to officer queue
router.post('/:id/submit', protect, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    updateApprovalStatus(id, 'submitted');

    if (!db.activityLogs[id]) db.activityLogs[id] = [];
    db.activityLogs[id].push({
      action: 'Submitted for Review',
      by: req.user?.name || 'Applicant',
      timestamp: new Date().toISOString(),
      note: 'All required documents submitted',
    });

    saveDB();
    res.json({ success: true });
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
    const byOfficer = officerName || req.user?.name || 'Bob Officer';

    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      query: 'query_raised',
    };
    const newStatus = statusMap[action] || 'submitted';

    updateApprovalStatus(id, newStatus);

    const actionLabels = { approve: 'Approved', reject: 'Rejected', query: 'Query Raised' };
    const logEntry = {
      action: actionLabels[action] || action,
      by: byOfficer,
      timestamp: ts,
      note: note || '',
    };
    if (!db.activityLogs[id]) db.activityLogs[id] = [];
    db.activityLogs[id].push(logEntry);

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
    }

    saveDB();

    res.json({
      id,
      status: newStatus,
      lastActionAt: ts,
      activityLog: db.activityLogs[id],
      messages: db.messages[id],
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
    const name = senderName || req.user?.name || (role === 'officer' ? 'Bob Officer' : 'You');
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
