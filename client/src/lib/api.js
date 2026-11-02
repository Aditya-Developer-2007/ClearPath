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
  classifyBusinessIntent,
  SECTORS_CATALOG,
  STATE_PORTALS,
} from './statutoryEngine.js';

export const DEMO_PROFILE_ADDRESS = 'Plot 14, GIDC Sachin, Surat';

export {
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
  classifyBusinessIntent,
  SECTORS_CATALOG,
  STATE_PORTALS,
};

export function deriveApprovalMetadata(app, state = 'Gujarat') {
  if (app.statutoryBasis && app.stage && app.formName && app.routing) {
    return app;
  }
  const name = (app.name || '').toLowerCase();

  const catalogMatch = STATUTORY_CATALOG.find((item) =>
    item.keywords?.some((kw) => name.includes(kw))
  );

  const stage = app.stage || catalogMatch?.stage || 'Stage D: Industry-Specific Compliance';
  const formName = app.formName || catalogMatch?.formName || 'Standard CAF';
  const requirementType = app.requirementType || catalogMatch?.requirementType || 'BASE';
  const statutoryBasis = app.statutoryBasis || catalogMatch?.statutoryBasis || 'Statutory clearance under Indian Industrial Law';
  const routing = app.routing || getStatePortalBadge(state);

  return { ...app, stage, formName, requirementType, statutoryBasis, routing };
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Authentication API ───────────────────────────────────────────────────────
export const loginAPI = async (emailOrPayload, optionalPassword) => {
  let email = '';
  let password = '';
  if (typeof emailOrPayload === 'object' && emailOrPayload !== null) {
    email = emailOrPayload.email;
    password = emailOrPayload.password;
  } else {
    email = emailOrPayload;
    password = optionalPassword;
  }
  return api.post('/auth/login', { email, password });
};

export const registerAPI = async (userData) => {
  return api.post('/auth/register', userData);
};

export const getMeAPI = async () => {
  return api.get('/auth/me');
};

// ── Public & Intake API ─────────────────────────────────────────────────────
export const getApprovalsAPI = async () => {
  return api.get('/public/approvals');
};

export const publicStatsAPI = async () => {
  return api.get('/public/stats');
};

export const intakeAPI = async (text) => {
  return api.post('/ai/intake', { text });
};

// ── Applications API ────────────────────────────────────────────────────────
export const submitApplicationAPI = async (data) => {
  return api.post('/applications', data);
};

export const getMyApplicationsAPI = async () => {
  return api.get('/applications/mine');
};

// ── Approvals & Workspace API ───────────────────────────────────────────────
export const getApprovalDetailAPI = async (id) => {
  return api.get(`/approvals/${id}`);
};

export const getApprovalAPI = getApprovalDetailAPI;

export const uploadDocumentAPI = async (id, payload) => {
  return api.post(`/approvals/${id}/documents`, payload);
};

export const checkDocumentAPI = uploadDocumentAPI;

export const submitApprovalAPI = async (id) => {
  return api.post(`/approvals/${id}/submit`);
};

export const getMessagesAPI = async (id) => {
  return api.get(`/approvals/${id}/messages`);
};

export const sendMessageAPI = async (id, text, senderName, senderRole, customMsgId) => {
  return api.post(`/approvals/${id}/messages`, { text, senderName, senderRole, customMsgId });
};

// ── Officer API ─────────────────────────────────────────────────────────────
export const getOfficerQueueAPI = async () => {
  return api.get('/approvals/queue');
};

export const getOfficerApprovalAPI = async (id) => {
  return api.get(`/approvals/${id}`);
};

export const officerActionAPI = async (id, { action, note, officerName, msgId }) => {
  return api.patch(`/approvals/${id}/action`, { action, note, officerName, msgId });
};

// ── Admin Governance & Inspections API ──────────────────────────────────────
export const getAdminAnalyticsAPI = async () => {
  return api.get('/admin/analytics');
};

export const slaAuditAPI = async () => {
  return api.post('/admin/sla-audit');
};

export const getAdminInspectionsAPI = async () => {
  return api.get('/admin/inspections');
};

export const getInspectionsAPI = getAdminInspectionsAPI;

export const scheduleInspectionAPI = async ({ id, slotDate }) => {
  return api.post('/admin/inspections/schedule', { id, slotDate });
};

export const getAuditIntegrityAPI = async () => {
  return api.get('/admin/audit-integrity');
};

// ── AI Engine API ───────────────────────────────────────────────────────────
export const aiSummarizeAPI = async (approvalRequestId) => {
  return api.post('/ai/summarize', { approvalRequestId });
};

export const getAdminInsightsAPI = async (analyticsData) => {
  return api.post('/ai/insight', analyticsData);
};

export const askAIAPI = async (question) => {
  return api.post('/ai/ask', { question });
};

export const askAssistantAPI = askAIAPI;

export const explainQueryAPI = async (note) => {
  return api.post('/ai/explain-query', { note });
};

export default api;
