import axios from 'axios';
import {
  getStatePortalBadge,
  evaluateStatutoryApprovals,
  generateApprovalsForBusiness,
  KNOWLEDGE_BASE,
  STATUTORY_CATALOG,
  SCHEMES_CATALOG,
  evaluateEligibleSchemes,
  computeStatutoryFee,
  computeUrgencyScore,
  calculateCriticalPath,
  TENDERS_CATALOG,
  evaluateGovernmentTenders,
} from './statutoryEngine.js';
import { myApplicationsCache } from '../mocks/applicantStore.js';
import {
  officerStore,
  resetOfficerStore,
  APPLICANT_PROFILES,
  DOCS_PER_REQUEST,
  REQUIRED_DOCS_PER_REQUEST,
  DEMO_PROFILE_ADDRESS,
} from '../mocks/officerQueue.js';
import {
  resetAdminStore,
  getAnalytics,
  fastForward,
  getInspections,
  scheduleInspection,
} from '../mocks/adminStore.js';

export {
  DEMO_PROFILE_ADDRESS,
  getStatePortalBadge,
  evaluateStatutoryApprovals,
  generateApprovalsForBusiness,
  KNOWLEDGE_BASE,
  STATUTORY_CATALOG,
  SCHEMES_CATALOG,
  evaluateEligibleSchemes,
  computeStatutoryFee,
  computeUrgencyScore,
  calculateCriticalPath,
  TENDERS_CATALOG,
  evaluateGovernmentTenders,
};

export const users = [
  { id: 'u1', name: 'Aarav Mehta', email: 'applicant@demo.com', role: 'applicant', department: 'Textile Operations', deskNo: 'A12' },
  { id: '1', name: 'Aarav Mehta', email: 'alice@applicant.com', role: 'applicant', department: 'Textile Operations', deskNo: 'A12' },
  { id: 'u2', name: 'Vikramaditya Sinh', email: 'officer@demo.com', role: 'officer', department: 'Safety', deskNo: '2' },
  { id: '2', name: 'Vikramaditya Sinh', email: 'gupta@officer.com', role: 'officer', department: 'Safety', deskNo: '2' },
  { id: '4', name: 'Vikramaditya Sinh', email: 'bob@officer.com', role: 'officer', department: 'Safety', deskNo: '2' },
  { id: 'u3', name: 'Rajeshwari Iyer, IAS', email: 'admin@demo.com', role: 'admin', department: 'Industries & Mines', deskNo: 'C56' },
  { id: '3', name: 'Rajeshwari Iyer, IAS', email: 'charlie@admin.com', role: 'admin', department: 'Industries & Mines', deskNo: 'C56' },
];

export function deriveApprovalMetadata(app, state = 'Gujarat') {
  if (app.statutoryBasis && app.stage && app.formName && app.routing) {
    return app;
  }
  const name = (app.name || '').toLowerCase();
  
  // Find match in STATUTORY_CATALOG by keywords
  const catalogMatch = STATUTORY_CATALOG.find((item) =>
    item.keywords?.some((kw) => name.includes(kw))
  );

  let stage = app.stage || catalogMatch?.stage || 'Stage D: Industry-Specific Compliance';
  let formName = app.formName || catalogMatch?.formName || 'Standard CAF';
  let requirementType = app.requirementType || catalogMatch?.requirementType || 'BASE';
  let statutoryBasis = app.statutoryBasis || catalogMatch?.statutoryBasis || 'Statutory clearance under Indian Industrial Law';
  let routing = app.routing || getStatePortalBadge(state);

  return { ...app, stage, formName, requirementType, statutoryBasis, routing };
}

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
      setTimeout(() => resolve({ data: generateApprovalsForBusiness({ sector: 'textile' }) }), 300);
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
        const lower = (text || '').toLowerCase();

        // 1. Stage
        let stage = null;
        if (/(starting|start|new|open|setting up|shuru|kholna|kholni|setup)/i.test(lower)) {
          stage = 'New';
        } else if (/(expand|expansion|badhana)/i.test(lower)) {
          stage = 'Expansion';
        } else if (/(renew|renewal)/i.test(lower)) {
          stage = 'Renewal';
        }

        // 2. Sector (textile, food, chemical, engineering/manufacturing)
        let sector = null;
        if (lower.includes('textile')) {
          sector = 'Textile';
        } else if (lower.includes('chemical')) {
          sector = 'Chemicals';
        } else if (lower.includes('food')) {
          sector = 'Food Processing';
        } else if (lower.includes('engineering') || lower.includes('manufacturing')) {
          sector = 'Manufacturing';
        } else if (lower.includes('electronics')) {
          sector = 'Electronics';
        }

        // 3. Location (Surat, Ahmedabad, Vadodara, Rajkot mapped to Gujarat)
        let city = null;
        let state = null;
        if (lower.includes('surat')) {
          city = 'Surat';
          state = 'Gujarat';
        } else if (lower.includes('ahmedabad')) {
          city = 'Ahmedabad';
          state = 'Gujarat';
        } else if (lower.includes('vadodara')) {
          city = 'Vadodara';
          state = 'Gujarat';
        } else if (lower.includes('rajkot')) {
          city = 'Rajkot';
          state = 'Gujarat';
        }

        // 4. Investment: handle lakh, crore, L
        let investmentLakh = null;
        const croreMatch = lower.match(/(?:(?:rs\.?|inr|₹)\s*)?(\d+(?:\.\d+)?)\s*(?:crore|cr)\b/i);
        if (croreMatch) {
          investmentLakh = Math.round(parseFloat(croreMatch[1]) * 100);
        } else {
          const lakhMatch = lower.match(/(?:(?:rs\.?|inr|₹)\s*)?(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b/i);
          if (lakhMatch) {
            investmentLakh = Math.round(parseFloat(lakhMatch[1]));
          }
        }

        // 5. Workers / Employees: ("12 workers", "12 log")
        let employees = null;
        const workerMatch = lower.match(/(\d+)\s*(?:workers|worker|employees|employee|people|log|staff|shramik|karmachari)\b/i);
        if (workerMatch) {
          employees = parseInt(workerMatch[1], 10);
        }

        // 6. Hazardous: "hazardous"/"chemical" => hazardous:true
        let hazardous = null;
        if (lower.includes('hazardous') || lower.includes('chemical')) {
          hazardous = true;
        }

        const hasAnyParsed = sector !== null || city !== null || state !== null || investmentLakh !== null || employees !== null || hazardous !== null || stage !== null;

        if (hasAnyParsed) {
          resolve({
            data: {
              ok: true,
              data: {
                sector,
                state,
                city,
                investmentLakh,
                employees,
                hazardous,
                stage,
              },
            },
          });
        } else {
          resolve({ data: { ok: false } });
        }
      }, 600);
    });
  }
  return api.post('/ai/intake', { text });
};

export const submitApplicationAPI = async (data) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const approvals = evaluateStatutoryApprovals(data);
        const schemes = evaluateEligibleSchemes(data);
        const estimatedDays = approvals.reduce((max, a) => Math.max(max, a.slaDays || 0), 0) || 30;
        resolve({
          data: {
            application: { id: 'APP-' + Math.floor(Math.random() * 10000) },
            approvals,
            schemes,
            estimatedDays,
          },
        });
      }, 600);
    });
  }
  return api.post('/applications', data);
};

// ── Applicant view ─────────────────────────────────────────────────────────
export const getMyApplicationsAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const primaryUnit = myApplicationsCache.applications[0] || {};
        const activeApprovals = primaryUnit.approvalRequests || [];
        const schemes = evaluateEligibleSchemes(primaryUnit);
        const tenderGate = evaluateGovernmentTenders(primaryUnit, activeApprovals);
        resolve({ data: { ...myApplicationsCache, schemes, tenderGate } });
      }, 800);
    });
  }
  return api.get('/applications/mine');
};

export const unlockTendersDemoAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const app = myApplicationsCache.applications[0];
        if (app?.approvalRequests) {
          app.approvalRequests.forEach((r) => { r.status = 'approved'; });
        }
        officerStore.queue.forEach((q) => { if (q.id === 'req2') q.status = 'approved'; });
        const tenderGate = evaluateGovernmentTenders(app, app?.approvalRequests || []);
        resolve({ data: { success: true, tenderGate } });
      }, 300);
    });
  }
  return api.post('/applications/unlock-tenders-demo');
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
            statutoryBasis: req.statutoryBasis || 'State Statutory Clearance Act',
            formName: req.formName || 'Standard CAF',
            stage: req.stage || 'Stage C: Commissioning / Pre-operation Stage',
            requirementType: req.requirementType || 'BASE',
            routing: req.routing || 'Routed via State Portal',
            requiredDocs: (() => {
              if (REQUIRED_DOCS_PER_REQUEST[id]) return REQUIRED_DOCS_PER_REQUEST[id];
              if (req.docs && Array.isArray(req.docs) && req.docs.length > 0) {
                return req.docs.map((d) => ({ docType: d, label: d, required: true }));
              }
              const name = req.name.toLowerCase();
              if (name.includes('fssai')) return [
                { docType: 'FoSCoS Form-B', label: 'FoSCoS Form-B', required: true },
                { docType: 'Manufacturing Layout', label: 'Manufacturing Layout', required: true },
                { docType: 'Machinery List with HP', label: 'Machinery List with HP', required: true },
                { docType: 'Potable Water Lab Report', label: 'Potable Water Lab Report', required: true },
                { docType: 'Premises Proof', label: 'Premises Proof', required: true }
              ];
              if (name.includes('bis') || name.includes('wpc') || name.includes('epr')) return [
                { docType: 'EPR Action Plan', label: 'EPR Action Plan', required: true },
                { docType: 'Product Manual', label: 'Product Manual', required: true },
                { docType: 'ISO Certificate', label: 'ISO Certificate', required: true }
              ];
              if (name.includes('hazardous')) return [
                { docType: 'HWM Form 1', label: 'HWM Form 1', required: true },
                { docType: 'Flow Chart', label: 'Flow Chart', required: true },
                { docType: 'ETP Adequacy Report', label: 'ETP Adequacy Report', required: true }
              ];
              if (name.includes('boiler') || name.includes('lifting')) return [
                { docType: 'Maker\'s Stamp', label: 'Maker\'s Stamp', required: true },
                { docType: 'Form III-C', label: 'Form III-C', required: true },
                { docType: 'NDT Report', label: 'NDT Report', required: true }
              ];
              if (name.includes('factory')) return [
                { docType: 'Factory Plan', label: 'Factory Plan', required: true },
                { docType: 'Stability Certificate', label: 'Stability Certificate', required: true },
                { docType: 'Health Register', label: 'Health Register', required: true }
              ];
              if (name.includes('pollution') || name.includes('cto') || name.includes('cte')) return [
                { docType: 'Waste Management Plan', label: 'Waste Management Plan', required: true },
                { docType: 'ETP Blueprint', label: 'ETP Blueprint', required: true }
              ];
              if (name.includes('fire')) return [
                { docType: 'Fire Safety Plan', label: 'Fire Safety Plan', required: true },
                { docType: 'Escape Route Map', label: 'Escape Route Map', required: true }
              ];
              return [
                { docType: 'Building Plan', label: 'Building Plan', required: true },
                { docType: 'Fire Safety Plan', label: 'Fire Safety Plan', required: true },
                { docType: 'Lease Deed', label: 'Lease Deed', required: true }
              ];
            })(),
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

        // Persist in shared officerStore.documents so applicant workspace keeps it
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
        const req = app?.approvalRequests?.find((r) => r.id === id);
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
  return api.post(`/approvals/${id}/messages`, { text, senderName, senderRole, customMsgId });
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
        const applicantReq = app?.approvalRequests?.find((r) => r.id === id);
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

        // Add message to thread when raising a query
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
  return api.patch(`/approvals/${id}/action`, { action, note, officerName, msgId });
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
            action: breaches > 0
              ? `Reassign ${slowestDept.pending} pending files or activate auto-delegation rules to clear ${breaches} SLA breach${breaches > 1 ? 'es' : ''}.`
              : `Reassign ${slowestDept.pending} pending files or activate auto-delegation rules to prevent SLA slippage.`,
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

const askCache = new Map();

export const askAssistantAPI = async (question) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!question || typeof question !== 'string' || !question.trim()) {
          return resolve({ data: { ok: false } });
        }

        const normalized = question.trim().toLowerCase();
        if (askCache.has(normalized)) {
          return resolve({ data: askCache.get(normalized) });
        }

        const isOffTopic = /(rate|tariff|slab|cement|price|how much gst|rate of gst|gst on)/i.test(normalized);

        let matchedEntry = null;
        if (!isOffTopic) {
          for (const entry of KNOWLEDGE_BASE) {
            const hasMatch = entry.keywords?.some((kw) => normalized.includes(kw));
            if (hasMatch) {
              matchedEntry = entry;
              break;
            }
          }
        }

        let result;
        if (matchedEntry) {
          const isDocQuestion = /(document|documents|docs|kya chahiye|paper|papers|certificate|chahiye)/i.test(normalized);
          const isTimeQuestion = /(how long|how much time|days|sla|time|kitne din|kitna samay|kab tak|duration|din)/i.test(normalized);

          let answer = '';
          if (matchedEntry.sourceRef === 'GOV-14') {
            answer = 'Eligible government support schemes include PMEGP (up to 35% capital subsidy for projects <= ₹50 Lakh), CGTMSE (collateral-free credit guarantee up to ₹5 Crore), State Interest Subsidy (5-7% for 5 years), and ZED green compliance grants. Apply via KVIC e-Portal, SIDBI, or State Directorate under Credit Linked Capital Subsidy Scheme & State Industrial Policy.';
          } else if (matchedEntry.sourceRef === 'ADM-08') {
            answer = 'Inspections for Fire Safety and Pollution Clearance can be combined into a single joint visit. This reduces separate visits and coordinates site verification across departments under the Unified Central Inspection Scheme.';
          } else if (isDocQuestion) {
            answer = `For ${matchedEntry.name} (${matchedEntry.department}), required documents under ${matchedEntry.statutoryBasis || 'statutory rules'} are: ${matchedEntry.docs.join(', ')}. Ensure declared details match your profile.`;
          } else if (isTimeQuestion) {
            answer = `${matchedEntry.name} under ${matchedEntry.department} has a statutory SLA of ${matchedEntry.slaDays} working days for review and clearance as governed by ${matchedEntry.statutoryBasis || 'statutory rules'}.`;
          } else {
            answer = `${matchedEntry.name} is processed by ${matchedEntry.department} within a statutory SLA of ${matchedEntry.slaDays} days (${matchedEntry.statutoryBasis || 'Statutory clearance'}). Required documents: ${matchedEntry.docs.join(', ')}.`;
          }

          result = {
            ok: true,
            answer,
            sources: [matchedEntry.sourceRef],
            confident: true,
          };
        } else {
          result = {
            ok: true,
            answer: "I am strictly grounded to master regulations and statutory acts. I cannot answer this off-topic query. Please use the application thread to talk to an officer for further assistance.",
            sources: [],
            confident: false,
          };
        }

        askCache.set(normalized, result);
        resolve({ data: result });
      }, 600);
    });
  }
  return api.post('/ai/ask', { question });
};

const explainCache = new Map();

export const explainQueryAPI = async (note) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const key = (note || '').trim().toLowerCase();
        if (explainCache.has(key)) {
          return resolve({ data: { ok: true, explanation: explainCache.get(key) } });
        }

        let explanation;
        if (key.includes('address')) {
          explanation = {
            explanation: 'The officer noted an address discrepancy on your documents. The address must match the registered business address in your application profile exactly.',
            steps: [
              'Check the business address on your uploaded documents.',
              'Verify against the address in your application profile.',
              'Update your document or profile and re-upload.',
            ],
            hindi: 'अधिकारी ने पते में विसंगति पाई है। कृपया सुनिश्चित करें कि सभी दस्तावेजों पर पता आपके आवेदन से मेल खाता है।',
          };
        } else if (key.includes('doc') || key.includes('document')) {
          explanation = {
            explanation: 'The officer indicated that required documentation is incomplete or missing from your submission.',
            steps: [
              'Review the required documents checklist for this clearance.',
              'Ensure all pages are legible and signed.',
              'Upload the missing document in the workspace.',
            ],
            hindi: 'अधिकारी ने अपूर्ण या छूटे हुए दस्तावेज बताए हैं। कृपया आवश्यक दस्तावेज पुनः अपलोड करें।',
          };
        } else {
          explanation = {
            explanation: 'The reviewing officer has requested clarification regarding your application details.',
            steps: [
              "Read the officer's query carefully.",
              'Reply in this thread with the requested clarification.',
              'Upload any supporting documents if needed.',
            ],
            hindi: 'समीक्षा अधिकारी ने आपके आवेदन के संबंध में स्पष्टीकरण मांगा है। कृपया संदेश का उत्तर दें।',
          };
        }

        explainCache.set(key, explanation);
        resolve({ data: { ok: true, explanation } });
      }, 500);
    });
  }
  return api.post('/ai/explain-query', { note });
};

export const getAuditIntegrityAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            ok: true,
            intact: true,
            totalApprovalsAudited: 8,
            totalLogEntriesVerified: 18,
            algorithm: 'SHA-256 Hash Chain',
          },
        });
      }, 100);
    });
  }
  return api.get('/admin/audit-integrity');
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
  return api.post('/reset');
};

export default api;
