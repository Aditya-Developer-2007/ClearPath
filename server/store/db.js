import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getInitialSeedData } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, '.runtime-db.json');

let _db = null;

export function getDB() {
  if (_db) return _db;

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      _db = JSON.parse(raw);
      return _db;
    }
  } catch (err) {
    console.warn('[DB] Could not read existing .runtime-db.json, resetting to seed data:', err.message);
  }

  _db = getInitialSeedData();
  saveDB();
  return _db;
}

export function saveDB() {
  if (!_db) return;
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(_db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to save .runtime-db.json:', err.message);
  }
}

export function resetDB() {
  _db = getInitialSeedData();
  saveDB();
  return _db;
}

export function findUserByEmail(email) {
  if (!email) return null;
  const db = getDB();
  const normalized = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findUserById(id) {
  if (!id) return null;
  const db = getDB();
  return db.users.find((u) => u.id === id) || null;
}

export function getApprovalComposite(id) {
  const db = getDB();

  // 1. Look in queue
  const queueRow = db.queue.find((r) => r.id === id);

  // 2. Look in applications
  let appReq = null;
  let parentApp = null;
  for (const app of db.applications) {
    const found = (app.approvalRequests || []).find((r) => r.id === id);
    if (found) {
      appReq = found;
      parentApp = app;
      break;
    }
  }

  if (!queueRow && !appReq) return null;

  const docs = db.documents[id] || [];
  const reqDocs = db.requiredDocs[id] || (appReq?.docs ? appReq.docs.map(d => ({ docType: d, label: d, required: true })) : []);
  const activityLog = db.activityLogs[id] || [];
  const msgs = db.messages[id] || [];
  const profile = db.applicantProfiles[id] || (parentApp ? {
    name: 'Alice Applicant',
    sector: parentApp.sector,
    city: parentApp.city,
    investment: '₹30 lakh',
    employees: 12,
    hazardous: false,
    address: 'Plot 14, GIDC Sachin, Surat',
  } : null);

  return {
    id,
    name: queueRow?.name || appReq?.name,
    department: queueRow?.department || appReq?.department,
    status: queueRow?.status || appReq?.status || 'not_started',
    riskTier: queueRow?.riskTier || appReq?.riskTier || 'medium',
    slaDeadline: queueRow?.slaDeadline || appReq?.slaDeadline,
    escalated: queueRow?.escalated ?? appReq?.escalated ?? false,
    escalatedFrom: queueRow?.escalatedFrom || null,
    assignedOfficerName: queueRow?.assignedOfficerName || appReq?.assignedOfficerName || 'Bob Officer',
    deskNo: appReq?.deskNo || '2',
    warningsCount: queueRow?.warningsCount ?? 0,
    lastActionAt: queueRow?.lastActionAt || appReq?.lastActionAt || null,
    applicantName: queueRow?.applicantName || 'Alice Applicant',
    unitName: queueRow?.unitName || (parentApp ? `${parentApp.sector}, ${parentApp.city}` : 'Textile unit, Surat'),
    applicantProfile: profile,
    requiredDocs: reqDocs,
    documents: docs,
    activityLog,
    messages: msgs,
    statutoryBasis: appReq?.statutoryBasis || queueRow?.statutoryBasis || 'Statutory clearance under Indian Industrial Law',
    formName: appReq?.formName || queueRow?.formName || 'Standard CAF',
    stage: appReq?.stage || queueRow?.stage || 'Stage C: Commissioning / Pre-operation Stage',
    requirementType: appReq?.requirementType || queueRow?.requirementType || 'BASE',
    routing: appReq?.routing || queueRow?.routing || 'Routed via State Portal',
    needsInspection: appReq?.needsInspection ?? (queueRow ? true : false),
  };
}

export function updateApprovalStatus(id, newStatus, extra = {}) {
  const db = getDB();
  const ts = new Date().toISOString();

  // Update in queue
  const qRow = db.queue.find((r) => r.id === id);
  if (qRow) {
    qRow.status = newStatus;
    qRow.lastActionAt = ts;
    if (extra.escalated !== undefined) qRow.escalated = extra.escalated;
    if (extra.escalatedFrom) qRow.escalatedFrom = extra.escalatedFrom;
    if (extra.assignedOfficerName) qRow.assignedOfficerName = extra.assignedOfficerName;
    if (extra.warningsCount !== undefined) qRow.warningsCount = extra.warningsCount;
  }

  // Update in applications
  for (const app of db.applications) {
    const req = (app.approvalRequests || []).find((r) => r.id === id);
    if (req) {
      req.status = newStatus;
      req.lastActionAt = ts;
      if (extra.escalated !== undefined) req.escalated = extra.escalated;
      if (extra.assignedOfficerName) req.assignedOfficerName = extra.assignedOfficerName;
    }
  }

  saveDB();
}

