import axios from 'axios';
import { users, approvals } from '../mocks';
import { myApplicationsCache } from '../mocks/applicantStore';
import {
  officerStore,
  resetOfficerStore,
  APPLICANT_PROFILES,
  DOCS_PER_REQUEST,
  REQUIRED_DOCS_PER_REQUEST,
  DEMO_PROFILE_ADDRESS,
} from '../mocks/officerQueue';
import {
  resetAdminStore,
  getAnalytics,
  fastForward,
  getInspections,
  scheduleInspection,
} from '../mocks/adminStore';

export { DEMO_PROFILE_ADDRESS };

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ───────────────────────────────────────────────────────────────────
export const loginAPI = async (email) => {
  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find((u) => u.email === email);
        if (user) {
          resolve({ data: { token: `mock-token-${user.id}`, user } });
        } else {
          reject(new Error('User not found'));
        }
      }, 300);
    });
  }
  return api.post('/login', { email });
};

// ── Public ─────────────────────────────────────────────────────────────────
export const getApprovalsAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ data: approvals }), 300);
    });
  }
  return api.get('/approvals');
};

export const publicStatsAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: [
            { dept: 'Pollution Control', days: 14 },
            { dept: 'Fire Department', days: 21 },
            { dept: 'Labour Dept', days: 8 },
            { dept: 'Electricity Board', days: 12 },
          ],
        });
      }, 500);
    });
  }
  return api.get('/public/stats');
};

export const intakeAPI = async (text) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lower = text.toLowerCase();
        let stage = null;
        if (/(starting|start|new|open|setting up|shuru|kholna)/i.test(lower)) {
          stage = 'New';
        } else if (/(expand|expansion|badhana)/i.test(lower)) {
          stage = 'Expansion';
        } else if (/(renew)/i.test(lower)) {
          stage = 'Renewal';
        }

        if (lower.includes('textile') || lower.includes('surat') || lower.includes('lakh')) {
          resolve({ data: { ok: true, data: { sector: 'Textile', state: 'Gujarat', city: 'Surat', investmentLakh: 30, employees: 12, hazardous: null, stage } } });
        } else if (stage) {
          resolve({ data: { ok: true, data: { stage } } });
        } else {
          resolve({ data: { ok: false } });
        }
      }, 800);
    });
  }
  return api.post('/ai/intake', { text });
};

export const submitApplicationAPI = async (data) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            application: { id: 'APP-999' },
            approvals: [
              { id: 'a1', name: 'Factory Licence', department: 'Industrial', docs: ['ID Proof', 'Site Plan'], slaDays: 15, riskTier: 'medium', status: 'not_started', needsInspection: false },
              { id: 'a2', name: 'Fire NOC', department: 'Safety', docs: ['Building Plan'], slaDays: 21, riskTier: 'high', status: 'not_started', needsInspection: true },
              { id: 'a3', name: 'Pollution Consent', department: 'Environment', docs: ['Waste Plan'], slaDays: 30, riskTier: 'high', status: 'not_started', needsInspection: true },
              { id: 'a4', name: 'Labour Registration', department: 'Labour', docs: ['Employee List'], slaDays: 7, riskTier: 'low', status: 'not_started', needsInspection: false },
              { id: 'a5', name: 'Electricity Connection', department: 'Utilities', docs: ['Load Estimate'], slaDays: 14, riskTier: 'medium', status: 'not_started', needsInspection: false },
              { id: 'a6', name: 'Udyam Registration', department: 'MSME', docs: ['Aadhar'], slaDays: 3, riskTier: 'low', status: 'not_started', needsInspection: false },
              { id: 'a7', name: 'Professional Tax', department: 'Finance', docs: ['PAN'], slaDays: 7, riskTier: 'low', status: 'not_started', needsInspection: false },
            ],
            estimatedDays: 24,
          },
        });
      }, 1000);
    });
  }
  return api.post('/applications', data);
};

// ── Applicant view ─────────────────────────────────────────────────────────
export const getMyApplicationsAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: myApplicationsCache });
      }, 800);
    });
  }
  return api.get('/applications/mine');
};

export const getApprovalAPI = async (id) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const req =
          myApplicationsCache.applications[0].approvalRequests.find((r) => r.id === id) ||
          myApplicationsCache.applications[0].approvalRequests[1];
        const docs = officerStore.documents?.[id] || DOCS_PER_REQUEST[id] || [];
        resolve({
          data: {
            id,
            name: req.name,
            department: req.department,
            status: req.status,
            assignedOfficerName: req.assignedOfficerName || 'Bob Officer',
            deskNo: req.deskNo || '2',
            lastActionAt: req.lastActionAt,
            slaDeadline: req.slaDeadline,
            escalated: req.escalated,
            riskTier: req.riskTier,
            needsInspection: req.needsInspection,
            requiredDocs: REQUIRED_DOCS_PER_REQUEST[id] || [
              { docType: 'Building Plan', label: 'Building Plan', required: true },
              { docType: 'Fire Safety Plan', label: 'Fire Safety Plan', required: true },
              { docType: 'Lease Deed', label: 'Lease Deed', required: true },
            ],
            documents: docs.map((d) => ({
              ...d,
              declaredFields: d.declaredFields
                ? { ...d.declaredFields }
                : {
                    address: DEMO_PROFILE_ADDRESS,
                    pan: 'ABCDE1234F',
                    unitSize: '1500 sqft',
                  },
            })),
            activityLog: officerStore.activityLogs[id] || [
              { action: 'Application Created', by: 'You', timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), note: '' },
              { action: 'Officer Assigned', by: 'System', timestamp: new Date(Date.now() - 9 * 86400000).toISOString(), note: '' },
              { action: 'Query Raised', by: 'Bob Officer', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), note: 'Doc incomplete, NOC mismatch' },
            ],
          },
        });
      }, 500);
    });
  }
  return api.get(`/approvals/${id}`);
};

export const checkDocumentAPI = async (id, payload) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { docType, fileName, declaredFields } = payload;
        const normalizedDeclared = declaredFields?.address?.trim().toLowerCase();
        const normalizedTarget = DEMO_PROFILE_ADDRESS.trim().toLowerCase();
        const hasMismatch = docType === 'Lease Deed' && normalizedDeclared !== normalizedTarget;

        const warnings = hasMismatch
          ? [{
              field: 'Business Address',
              doc1: 'Application form',
              doc2: 'Lease deed',
              note: 'Address on the lease deed differs from your application. Fix it before submitting.',
            }]
          : [];

        const docRecord = {
          id: `doc-${Date.now()}-${docType.toLowerCase().replace(/\s+/g, '-')}`,
          docType,
          label: docType,
          fileName,
          validated: warnings.length === 0,
          declaredFields: declaredFields
            ? { ...declaredFields }
            : { address: DEMO_PROFILE_ADDRESS, pan: 'ABCDE1234F', unitSize: '1500 sqft' },
          warnings,
        };

        // Persist in shared officerStore.documents so applicant workspace keeps it!
        if (!officerStore.documents) officerStore.documents = {};
        if (!officerStore.documents[id]) officerStore.documents[id] = [...(DOCS_PER_REQUEST[id] || [])];
        const existingIdx = officerStore.documents[id].findIndex((d) => d.docType === docType);
        if (existingIdx >= 0) {
          officerStore.documents[id][existingIdx] = docRecord;
        } else {
          officerStore.documents[id].push(docRecord);
        }

        resolve({
          data: {
            document: docRecord,
            warnings,
          },
        });
      }, 600);
    });
  }
  return api.post(`/approvals/${id}/documents`, payload);
};

export const submitApprovalAPI = async (id) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Update applicant-side store
        const app = myApplicationsCache.applications[0];
        const req = app.approvalRequests.find((r) => r.id === id);
        if (req) {
          req.status = 'submitted';
          req.lastActionAt = new Date().toISOString();
        }
        // Update officer-side store
        const qRow = officerStore.queue.find((r) => r.id === id);
        if (qRow) {
          qRow.status = 'submitted';
          qRow.lastActionAt = new Date().toISOString();
        }
        resolve({ data: { success: true } });
      }, 500);
    });
  }
  return api.post(`/approvals/${id}/submit`);
};

export const getMessagesAPI = async (id) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const msgs = officerStore.messages[id] ?? [];
        resolve({ data: msgs });
      }, 500);
    });
  }
  return api.get(`/approvals/${id}/messages`);
};

export const sendMessageAPI = async (id, text, senderName, senderRole, customMsgId) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const msgId = customMsgId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const newMsg = {
          id: msgId,
          senderRole: senderRole || 'applicant',
          senderName: senderName || (senderRole === 'officer' ? 'Bob Officer' : 'You'),
          text,
          timestamp: new Date().toISOString(),
        };
        if (!officerStore.messages[id]) officerStore.messages[id] = [];
        const isDuplicate = officerStore.messages[id].some((m) => m.id === msgId);
        if (!isDuplicate) {
          officerStore.messages[id].push(newMsg);
        }
        resolve({ data: { success: true, message: newMsg, messages: [...officerStore.messages[id]] } });
      }, 500);
    });
  }
  return api.post(`/approvals/${id}/messages`, { text });
};

// ── Officer API ────────────────────────────────────────────────────────────
export const getOfficerQueueAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: officerStore.queue.map((r) => ({ ...r })) });
      }, 600);
    });
  }
  return api.get('/approvals/queue');
};

export const getOfficerApprovalAPI = async (id) => {
  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const row = officerStore.queue.find((r) => r.id === id);
        if (!row) {
          reject(new Error('Not found'));
          return;
        }
        const docs = officerStore.documents?.[id] || DOCS_PER_REQUEST[id] || [];
        resolve({
          data: {
            id: row.id,
            name: row.name,
            department: row.department,
            status: row.status,
            riskTier: row.riskTier,
            slaDeadline: row.slaDeadline,
            escalated: row.escalated,
            assignedOfficerName: row.assignedOfficerName || 'Bob Officer',
            warningsCount: row.warningsCount,
            lastActionAt: row.lastActionAt,
            applicantName: row.applicantName,
            unitName: row.unitName,
            applicantProfile: APPLICANT_PROFILES[id] || null,
            requiredDocs: REQUIRED_DOCS_PER_REQUEST[id] || [],
            documents: docs.map((d) => ({ ...d })),
            activityLog: officerStore.activityLogs[id] || [],
            messages: officerStore.messages[id] || [],
          },
        });
      }, 500);
    });
  }
  return api.get(`/approvals/${id}`);
};

export const officerActionAPI = async (id, { action, note, officerName, msgId }) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const ts = new Date().toISOString();
        const byOfficer = officerName || 'Bob Officer';

        // Map action -> status
        const statusMap = {
          approve: 'approved',
          reject: 'rejected',
          query: 'query_raised',
        };
        const newStatus = statusMap[action] || 'submitted';

        // Update officer store queue row
        const qRow = officerStore.queue.find((r) => r.id === id);
        if (qRow) {
          qRow.status = newStatus;
          qRow.lastActionAt = ts;
        }

        // Update applicant-side store for cross-role
        const app = myApplicationsCache.applications[0];
        const applicantReq = app?.approvalRequests.find((r) => r.id === id);
        if (applicantReq) {
          applicantReq.status = newStatus;
          applicantReq.lastActionAt = ts;
        }

        // Activity log entry
        const actionLabels = { approve: 'Approved', reject: 'Rejected', query: 'Query Raised' };
        const logEntry = {
          action: actionLabels[action] || action,
          by: byOfficer,
          timestamp: ts,
          note: note || '',
        };
        if (!officerStore.activityLogs[id]) officerStore.activityLogs[id] = [];
        officerStore.activityLogs[id].push(logEntry);

        // Add message to thread when raising a query (appended only here in action handler)
        if (action === 'query' && note) {
          const queryMsgId = msgId || `msg-q-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          const queryMsg = {
            id: queryMsgId,
            senderRole: 'officer',
            senderName: byOfficer,
            text: note,
            timestamp: ts,
          };
          if (!officerStore.messages[id]) officerStore.messages[id] = [];
          const exists = officerStore.messages[id].some((m) => m.id === queryMsgId);
          if (!exists) {
            officerStore.messages[id].push(queryMsg);
          }
        }

        resolve({
          data: {
            id,
            status: newStatus,
            lastActionAt: ts,
            activityLog: officerStore.activityLogs[id],
            messages: officerStore.messages[id],
          },
        });
      }, 700);
    });
  }
  return api.patch(`/approvals/${id}/action`, { action, note });
};

export const aiSummarizeAPI = async (approvalRequestId) => {
  if (USE_MOCK) {
    const summaries = {
      'req2': {
        summary: [
          'Fire NOC application for textile unit in Surat GIDC Sachin area.',
          'Lease deed address does not match the application profile — address mismatch warning raised.',
          'Building plan is verified valid; fire safety plan document is missing.',
        ],
        flags: ['Address mismatch', 'Missing document', 'Escalated'],
      },
      'q-1': {
        summary: [
          'Hazardous Waste NOC for chemical manufacturing unit in Surat.',
          'Fire safety plan shows a different site address than the application form.',
          'Hazmat certificate is valid; SLA already breached — case is escalated.',
        ],
        flags: ['Address mismatch', 'SLA breached', 'High hazard', 'Escalated'],
      },
      'q-2': {
        summary: [
          'Fire Safety Certificate for food processing unit in Vadodara.',
          'All documents submitted and validated; no consistency warnings.',
          'SLA is due in 1 day — priority review recommended.',
        ],
        flags: ['SLA near', 'Priority'],
      },
      'q-3': {
        summary: [
          'New fire NOC application for textile unit in Surat GIDC.',
          'Fire safety plan has an escape route discrepancy against the building plan.',
          'High risk tier — requires on-site inspection before approval.',
        ],
        flags: ['Document mismatch', 'Inspection required', 'High risk'],
      },
    };
    const def = {
      summary: [
        'Approval request is under review by the fire department.',
        'All submitted documents appear consistent with the application profile.',
        'No critical flags detected at this time.',
      ],
      flags: [],
    };
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: { ok: true, ...(summaries[approvalRequestId] || def) } });
      }, 500);
    });
  }
  return api.post('/ai/summarize', { approvalRequestId });
};

// ── Admin ──────────────────────────────────────────────────────────────────
export const getAdminAnalyticsAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: getAnalytics() });
      }, 300);
    });
  }
  return api.get('/admin/analytics');
};

export const fastForwardAPI = async (days) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = fastForward(days);
        resolve({ data: result });
      }, 300);
    });
  }
  return api.post('/admin/fast-forward', { days });
};

export const getAdminInspectionsAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: getInspections() });
      }, 300);
    });
  }
  return api.get('/admin/inspections');
};

export const scheduleInspectionAPI = async ({ id, slotDate }) => {
  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const updated = scheduleInspection(id, slotDate);
        if (updated) {
          resolve({ data: updated });
        } else {
          reject(new Error('Inspection proposal not found'));
        }
      }, 300);
    });
  }
  return api.post('/admin/inspections/schedule', { id, slotDate });
};

export const getAdminInsightsAPI = async (analyticsData) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const depts = analyticsData?.byDepartment || [];
        const breaches = analyticsData?.totals?.breaches ?? 0;
        const escalations = analyticsData?.totals?.escalations ?? 0;
        const sortedByDays = [...depts].sort((a, b) => b.avgDays - a.avgDays);
        const slowestDept = sortedByDays[0] || { dept: 'Environment', avgDays: 22, pending: 2 };

        const insights = [
          {
            title: `${slowestDept.dept} processing bottleneck (${slowestDept.avgDays}d average)`,
            action: `Reassign ${slowestDept.pending} pending files or activate auto-delegation rules to prevent SLA slippage.`,
          },
          {
            title: escalations > 0
              ? `${escalations} critical escalation${escalations > 1 ? 's' : ''} require immediate senior sign-off`
              : `Zero senior officer escalations in the current cycle`,
            action: escalations > 0
              ? `Prioritize senior officer review queues for high-risk textile and chemical unit filings.`
              : `Review upcoming 48-hour deadlines to maintain current positive compliance velocity.`,
          },
          {
            title: 'Joint inspection clustering opportunity',
            action: 'Merge safety and environmental site visits in Surat industrial zone to save visits and reduce turnaround by 4 days.',
          },
        ];
        resolve({ data: { ok: true, insights } });
      }, 600);
    });
  }
  return api.post('/ai/insight', analyticsData);
};

export const resetMockDataAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resetOfficerStore();
        resetAdminStore();
        resolve({ data: { success: true } });
      }, 100);
    });
  }
  return Promise.resolve({ data: { success: true } });
};

export default api;

