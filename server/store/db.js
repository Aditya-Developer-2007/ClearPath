import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { getInitialSeedData } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, '.runtime-db.json');

let _db = null;

export function computeLogAuditHash(prevHash, action, by, timestamp, note) {
  const payload = `${prevHash || 'GENESIS_000000000000'}|${action || ''}|${by || ''}|${timestamp || ''}|${note || ''}`;
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export function buildChainedActivityLog(rawLogs = []) {
  let prevHash = 'GENESIS_000000000000';
  return rawLogs.map((log) => {
    const ts = log.timestamp || new Date().toISOString();
    const note = log.note || '';
    const auditHash = computeLogAuditHash(prevHash, log.action, log.by, ts, note);
    const chained = {
      ...log,
      timestamp: ts,
      note,
      prevHash,
      auditHash,
    };
    prevHash = auditHash;
    return chained;
  });
}

export function appendActivityLog(approvalId, logEntry) {
  const db = getDB();
  if (!db.activityLogs) db.activityLogs = {};
  if (!db.activityLogs[approvalId]) {
    db.activityLogs[approvalId] = [];
  }
  const currentLogs = db.activityLogs[approvalId];
  const lastLog = currentLogs.length > 0 ? currentLogs[currentLogs.length - 1] : null;
  const prevHash = lastLog?.auditHash || 'GENESIS_000000000000';
  const timestamp = logEntry.timestamp || new Date().toISOString();
  const note = logEntry.note || '';

  const auditHash = computeLogAuditHash(prevHash, logEntry.action, logEntry.by, timestamp, note);

  const newLog = {
    ...logEntry,
    timestamp,
    note,
    prevHash,
    auditHash,
  };

  currentLogs.push(newLog);
  saveDB();
  return newLog;
}

export function verifyAuditChainContinuity() {
  const db = getDB();
  let totalApprovalsAudited = 0;
  let totalLogEntriesVerified = 0;
  let intact = true;
  const errors = [];

  for (const [appId, logs] of Object.entries(db.activityLogs || {})) {
    totalApprovalsAudited++;
    let expectedPrevHash = 'GENESIS_000000000000';

    for (let i = 0; i < logs.length; i++) {
      const entry = logs[i];
      totalLogEntriesVerified++;

      if (entry.prevHash !== expectedPrevHash) {
        intact = false;
        errors.push(`Broken chain link in ${appId} at index ${i}: expected prevHash ${expectedPrevHash}, got ${entry.prevHash}`);
      }

      const calculatedHash = computeLogAuditHash(entry.prevHash, entry.action, entry.by, entry.timestamp, entry.note);
      if (entry.auditHash !== calculatedHash) {
        intact = false;
        errors.push(`Corrupt hash in ${appId} at index ${i}: calculated ${calculatedHash}, stored ${entry.auditHash}`);
      }

      expectedPrevHash = entry.auditHash;
    }
  }

  return {
    ok: intact,
    intact,
    totalApprovalsAudited,
    totalLogEntriesVerified,
    algorithm: 'SHA-256 Hash Chain',
    errors: intact ? [] : errors,
  };
}

export function getDB() {
  if (_db) return _db;

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      _db = JSON.parse(raw);
      if (Array.isArray(_db.users)) {
        let dirty = false;
        _db.users.forEach((u) => {
          if (u.id === 'u1' && (u.email.includes('demo') || u.email.includes('alice'))) {
            u.email = 'aarav.mehta@suryavastra.in';
            u.passwordHash = 'a1b2c3d4e5f60718293a4b5c6d7e8f90:286193c0c901f9562074190a7dbe682904b70b7ab7f241bae570ba007b6037ca6f4a024a62e6b742f6f5eec458513e43959c08c190b63b05fa70ff2298da3dbc';
            dirty = true;
          } else if (u.id === 'u2' && (u.email.includes('demo') || u.email.includes('officer') || u.email.includes('bob'))) {
            u.email = 'vikram.sinh@fire.gujarat.gov.in';
            u.passwordHash = 'a1b2c3d4e5f60718293a4b5c6d7e8f90:286193c0c901f9562074190a7dbe682904b70b7ab7f241bae570ba007b6037ca6f4a024a62e6b742f6f5eec458513e43959c08c190b63b05fa70ff2298da3dbc';
            dirty = true;
          } else if (u.id === 'u3' && (u.email.includes('demo') || u.email.includes('admin') || u.email.includes('charlie'))) {
            u.email = 'r.iyer@industries.gov.in';
            u.passwordHash = 'a1b2c3d4e5f60718293a4b5c6d7e8f90:286193c0c901f9562074190a7dbe682904b70b7ab7f241bae570ba007b6037ca6f4a024a62e6b742f6f5eec458513e43959c08c190b63b05fa70ff2298da3dbc';
            dirty = true;
          }
        });
        if (dirty) saveDB();
      }
      return _db;
    }
  } catch (err) {
    console.warn('[DB] Could not read existing .runtime-db.json, initializing production data:', err.message);
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
  // Production safety: retain user data, reload live db
  return getDB();
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
    name: 'Aarav Mehta',
    sector: parentApp.sector,
    city: parentApp.city,
    investment: '₹30 lakh',
    employees: 12,
    hazardous: false,
    address: 'Plot 14, GIDC Sachin, Surat',
    pan: 'AABCS1429B',
    gstin: '24AABCS1429B1Z5',
    udyam: 'UDYAM-GJ-22-0048192',
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
    assignedOfficerName: queueRow?.assignedOfficerName || appReq?.assignedOfficerName || 'Vikramaditya Sinh',
    deskNo: appReq?.deskNo || '2',
    warningsCount: queueRow?.warningsCount ?? 0,
    lastActionAt: queueRow?.lastActionAt || appReq?.lastActionAt || null,
    applicantName: queueRow?.applicantName || 'Aarav Mehta',
    unitName: queueRow?.unitName || (parentApp ? `${parentApp.sector}, ${parentApp.city}` : 'Surya Vastra Mills Pvt. Ltd., Surat'),
    applicantProfile: profile,
    requiredDocs: reqDocs,
    documents: docs,
    activityLog,
    messages: msgs,
    statutoryBasis: appReq?.statutoryBasis || queueRow?.statutoryBasis || 'Statutory clearance under Indian Industrial Law',
    formName: appReq?.formName || queueRow?.formName || 'Standard CAF',
    stage: appReq?.stage || queueRow?.stage || 'Stage C: Commissioning / Pre-operation Stage',
    requirementType: appReq?.requirementType || queueRow?.requirementType || 'BASE',
    routing: appReq?.routing || queueRow?.routing || 'Routed via Investor Facilitation Portal (IFP Gujarat)',
    needsInspection: appReq?.needsInspection ?? (queueRow ? true : false),
    statutoryFeeInr: appReq?.statutoryFeeInr !== undefined ? appReq.statutoryFeeInr : (queueRow?.statutoryFeeInr || 2500),
    feeFormula: appReq?.feeFormula || queueRow?.feeFormula || 'Standard Statutory Fee Schedule',
    rtpsActClause: appReq?.rtpsActClause || queueRow?.rtpsActClause || 'Right to Public Services Act — Auto-Escalation & ₹250/day SLA Delay Liability',
    certificateMeta: queueRow?.certificateMeta || appReq?.certificateMeta || null,
  };
}

export function updateApprovalStatus(id, newStatus, extra = {}) {
  const db = getDB();
  const ts = new Date().toISOString();

  // Find target objects
  const qRow = db.queue.find((r) => r.id === id);
  let appReq = null;
  for (const app of db.applications) {
    const found = (app.approvalRequests || []).find((r) => r.id === id);
    if (found) {
      appReq = found;
      break;
    }
  }

  // Generate certificateMeta on approval
  let certMeta = null;
  if (newStatus === 'approved') {
    const officer = extra.assignedOfficerName || qRow?.assignedOfficerName || appReq?.assignedOfficerName || 'Vikramaditya Sinh';
    const dept = (qRow?.department || appReq?.department || 'GOV').toUpperCase().slice(0, 4);
    certMeta = {
      certificateNo: `NOC-${dept}-2026-${id.toUpperCase()}`,
      issuedAt: ts,
      approvedBy: officer,
      sha256Signature: crypto.createHash('sha256').update(`${id}:${qRow?.name || appReq?.name}:${officer}:${ts}`).digest('hex'),
      statutoryBasis: qRow?.statutoryBasis || appReq?.statutoryBasis || 'Statutory clearance under Indian Industrial Law',
    };
  }

  // Update in queue
  if (qRow) {
    qRow.status = newStatus;
    qRow.lastActionAt = ts;
    if (extra.escalated !== undefined) qRow.escalated = extra.escalated;
    if (extra.escalatedFrom) qRow.escalatedFrom = extra.escalatedFrom;
    if (extra.assignedOfficerName) qRow.assignedOfficerName = extra.assignedOfficerName;
    if (extra.warningsCount !== undefined) qRow.warningsCount = extra.warningsCount;
    if (certMeta) qRow.certificateMeta = certMeta;
  }

  // Update in applications
  if (appReq) {
    appReq.status = newStatus;
    appReq.lastActionAt = ts;
    if (extra.escalated !== undefined) appReq.escalated = extra.escalated;
    if (extra.assignedOfficerName) appReq.assignedOfficerName = extra.assignedOfficerName;
    if (certMeta) appReq.certificateMeta = certMeta;
  }

  saveDB();
}
