// ── Officer queue mock store ───────────────────────────────────────────────
// This module owns the authoritative shared state for officer-side mocks.
// The applicant mock (api.js / myApplicationsCache) holds the *applicant* view
// of the same approval requests.  When the officer acts on a request, we must
// update BOTH stores so the cross-role demo is consistent.

import { resetApplicantStore } from './applicantStore';

export const DEMO_PROFILE_ADDRESS = 'Plot 14, GIDC Sachin, Surat';

const now = Date.now();
const D = (deltaDays) => new Date(now + deltaDays * 86400000).toISOString();

// ── Shared document data ───────────────────────────────────────────────────
const DOCS_REQ2 = [
  {
    id: 'd1',
    docType: 'Building Plan',
    label: 'Building Plan',
    fileName: 'building_plan.pdf',
    validated: true,
    declaredFields: {
      address: DEMO_PROFILE_ADDRESS,
      pan: 'ABCDE1234F',
      unitSize: '1500 sqft',
    },
    warnings: [],
  },
  {
    id: 'd2',
    docType: 'Lease Deed',
    label: 'Lease Deed',
    fileName: 'lease_deed.pdf',
    validated: false,
    declaredFields: {
      address: DEMO_PROFILE_ADDRESS,
      pan: 'ABCDE1234F',
      unitSize: '1500 sqft',
    },
    warnings: [
      {
        field: 'Business Address',
        doc1: 'Application form',
        doc2: 'Lease deed',
        note: 'Address on the lease deed differs from your application. Fix it before submitting.',
      },
    ],
  },
];

// ── Applicant profiles (officer sees these) ────────────────────────────────
const APPLICANT_PROFILES = {
  req2: {
    name: 'Alice Applicant',
    sector: 'Textile',
    city: 'Surat',
    investment: '₹30 lakh',
    employees: 12,
    hazardous: false,
    address: DEMO_PROFILE_ADDRESS,
  },
  'q-1': {
    name: 'Dilip Shah',
    sector: 'Chemical',
    city: 'Surat',
    investment: '₹85 lakh',
    employees: 34,
    hazardous: true,
    address: 'Plot 88, Chemical Zone, Surat',
  },
  'q-2': {
    name: 'Priya Mehta',
    sector: 'Food Processing',
    city: 'Vadodara',
    investment: '₹22 lakh',
    employees: 8,
    hazardous: false,
    address: '12, Makarpura GIDC, Vadodara',
  },
  'q-3': {
    name: 'Ramesh Trivedi',
    sector: 'Textile',
    city: 'Surat',
    investment: '₹18 lakh',
    employees: 10,
    hazardous: false,
    address: 'Plot 14, GIDC Sachin, Surat',
  },
  'q-4': {
    name: 'Sunita Patel',
    sector: 'Engineering',
    city: 'Rajkot',
    investment: '₹45 lakh',
    employees: 20,
    hazardous: false,
    address: 'B-12, Rajkot Industrial Estate',
  },
  'q-5': {
    name: 'Harish Bhandari',
    sector: 'Pharma',
    city: 'Ankleshwar',
    investment: '₹1.2 cr',
    employees: 55,
    hazardous: true,
    address: 'Lot 7, Ankleshwar GIDC, Bharuch',
  },
  'q-6': {
    name: 'Neha Joshi',
    sector: 'Agro Processing',
    city: 'Anand',
    investment: '₹14 lakh',
    employees: 6,
    hazardous: false,
    address: 'Survey 44, Anand',
  },
  'q-7': {
    name: 'Vikram Nair',
    sector: 'IT Hardware',
    city: 'Gandhinagar',
    investment: '₹60 lakh',
    employees: 28,
    hazardous: false,
    address: 'InfoCity Phase 2, Gandhinagar',
  },
};

// ── Documents per request ─────────────────────────────────────────────────
const DOCS_PER_REQUEST = {
  req2: DOCS_REQ2,
  'q-1': [
    { id: 'd10', docType: 'Fire Safety Plan', label: 'Fire Safety Plan', fileName: 'fire_plan_shah.pdf', validated: false, warnings: [{ field: 'Business Address', doc1: 'Application form', doc2: 'Lease deed', note: 'Address on the lease deed differs from your application. Fix it before submitting.' }] },
    { id: 'd11', docType: 'Hazmat Certificate', label: 'Hazmat Certificate', fileName: 'hazmat_cert.pdf', validated: true, warnings: [] },
  ],
  'q-2': [
    { id: 'd20', docType: 'Fire NOC', label: 'Fire NOC', fileName: 'noc_mehta.pdf', validated: true, warnings: [] },
    { id: 'd21', docType: 'Building Plan', label: 'Building Plan', fileName: 'bp_mehta.pdf', validated: true, warnings: [] },
  ],
  'q-3': [
    { id: 'd30', docType: 'Building Plan', label: 'Building Plan', fileName: 'bp_ramesh.pdf', validated: true, warnings: [] },
    { id: 'd31', docType: 'Fire Safety Plan', label: 'Fire Safety Plan', fileName: 'fsp_ramesh.pdf', validated: false, warnings: [{ field: 'Escape Route', doc1: 'Building Plan', doc2: 'Fire Safety Plan', note: 'Escape route shown on building plan does not match the fire safety plan.' }] },
  ],
  'q-4': [
    { id: 'd40', docType: 'Factory Plan', label: 'Factory Plan', fileName: 'factory_plan.pdf', validated: true, warnings: [] },
  ],
  'q-5': [
    { id: 'd50', docType: 'Hazmat Certificate', label: 'Hazmat Certificate', fileName: 'hazmat_bhandari.pdf', validated: true, warnings: [] },
    { id: 'd51', docType: 'Environmental Clearance', label: 'Environmental Clearance', fileName: 'env_clear.pdf', validated: true, warnings: [] },
  ],
  'q-6': [
    { id: 'd60', docType: 'NOC Certificate', label: 'NOC Certificate', fileName: 'noc_neha.pdf', validated: true, warnings: [] },
  ],
  'q-7': [
    { id: 'd70', docType: 'Site Plan', label: 'Site Plan', fileName: 'site_plan_vikram.pdf', validated: true, warnings: [] },
  ],
};

// ── Required docs per request ──────────────────────────────────────────────
const REQUIRED_DOCS_PER_REQUEST = {
  req2: [
    { docType: 'Building Plan', label: 'Building Plan', required: true },
    { docType: 'Fire Safety Plan', label: 'Fire Safety Plan', required: true },
    { docType: 'Lease Deed', label: 'Lease Deed', required: true },
  ],
  'q-1': [
    { docType: 'Fire Safety Plan', label: 'Fire Safety Plan', required: true },
    { docType: 'Hazmat Certificate', label: 'Hazmat Certificate', required: true },
  ],
  'q-2': [
    { docType: 'Fire NOC', label: 'Fire NOC', required: true },
    { docType: 'Building Plan', label: 'Building Plan', required: true },
  ],
  'q-3': [
    { docType: 'Building Plan', label: 'Building Plan', required: true },
    { docType: 'Fire Safety Plan', label: 'Fire Safety Plan', required: true },
  ],
  'q-4': [{ docType: 'Factory Plan', label: 'Factory Plan', required: true }],
  'q-5': [
    { docType: 'Hazmat Certificate', label: 'Hazmat Certificate', required: true },
    { docType: 'Environmental Clearance', label: 'Environmental Clearance', required: true },
  ],
  'q-6': [{ docType: 'NOC Certificate', label: 'NOC Certificate', required: true }],
  'q-7': [{ docType: 'Site Plan', label: 'Site Plan', required: true }],
};

// ── Activity logs per request ──────────────────────────────────────────────
const ACTIVITY_LOGS_INITIAL = {
  req2: [
    { action: 'Application Created', by: 'Alice Applicant', timestamp: D(-10), note: '' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-9), note: '' },
    { action: 'Query Raised', by: 'Bob Officer', timestamp: D(-2), note: 'Doc incomplete, NOC mismatch' },
  ],
  'q-1': [
    { action: 'Application Created', by: 'Dilip Shah', timestamp: D(-14), note: '' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-13), note: '' },
    { action: 'Escalated', by: 'System', timestamp: D(-3), note: 'SLA breached. Escalated to senior.' },
  ],
  'q-2': [
    { action: 'Application Created', by: 'Priya Mehta', timestamp: D(-5), note: '' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-4), note: '' },
  ],
  'q-3': [
    { action: 'Application Created', by: 'Ramesh Trivedi', timestamp: D(-3), note: '' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-2), note: '' },
  ],
  'q-4': [
    { action: 'Application Created', by: 'Sunita Patel', timestamp: D(-8), note: '' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-7), note: '' },
    { action: 'Under Review', by: 'Bob Officer', timestamp: D(-3), note: '' },
  ],
  'q-5': [
    { action: 'Application Created', by: 'Harish Bhandari', timestamp: D(-20), note: '' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-19), note: '' },
    { action: 'Under Review', by: 'Bob Officer', timestamp: D(-10), note: '' },
  ],
  'q-6': [
    { action: 'Application Created', by: 'Neha Joshi', timestamp: D(-30), note: '' },
    { action: 'Approved', by: 'Bob Officer', timestamp: D(-5), note: 'All documents verified.' },
  ],
  'q-7': [
    { action: 'Application Created', by: 'Vikram Nair', timestamp: D(-6), note: '' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-5), note: '' },
  ],
};

// ── Messages per request ───────────────────────────────────────────────────
const MESSAGES_INITIAL = {
  req2: [
    {
      id: 'm1',
      senderRole: 'officer',
      senderName: 'Bob Officer',
      text: 'Doc incomplete, NOC mismatch',
      timestamp: D(-2),
      aiExplanation: {
        explanation: 'The address on your Lease Deed does not match the address provided in your main application profile.',
        steps: [
          'Check the address on your Lease Deed.',
          'Update your application profile address if it is wrong.',
          'Re-upload the Lease Deed.',
        ],
        hindi: 'लीज डीड का पता आपके आवेदन से मेल नहीं खाता। कृपया इसे ठीक करें।',
      },
    },
  ],
  'q-1': [
    {
      id: 'm10',
      senderRole: 'officer',
      senderName: 'Bob Officer',
      text: 'Address mismatch on fire safety plan. Please update and resubmit.',
      timestamp: D(-3),
    },
  ],
  'q-2': [],
  'q-3': [],
  'q-4': [
    {
      id: 'm40',
      senderRole: 'applicant',
      senderName: 'Sunita Patel',
      text: 'Please find the updated factory plan attached.',
      timestamp: D(-2),
    },
  ],
  'q-5': [],
  'q-6': [],
  'q-7': [],
};

// ── Initial queue rows (source of truth) ──────────────────────────────────
const QUEUE_INITIAL = [
  // req2 — shared with applicant store (overdue + escalated)
  {
    id: 'req2',
    applicantName: 'Alice Applicant',
    unitName: 'Textile unit, Surat',
    name: 'Fire NOC',
    department: 'Fire Dept',
    status: 'query_raised',
    riskTier: 'high',
    slaDeadline: D(-2),
    escalated: true,
    escalatedFrom: 'Safety Inspector',
    warningsCount: 1,
    lastActionAt: D(-2),
    assignedOfficerName: 'Bob Officer',
  },
  // q-1 — Shah Corp, overdue + escalated
  {
    id: 'q-1',
    applicantName: 'Dilip Shah',
    unitName: 'Shah Corp Chemicals, Surat',
    name: 'Hazardous Waste NOC',
    department: 'Fire Dept',
    status: 'submitted',
    riskTier: 'high',
    slaDeadline: D(-3),
    escalated: true,
    escalatedFrom: 'SLA Breach Auto-Escalation',
    warningsCount: 1,
    lastActionAt: D(-3),
    assignedOfficerName: 'Bob Officer',
  },
  // q-2 — Mehta Ind, due in 1 day
  {
    id: 'q-2',
    applicantName: 'Priya Mehta',
    unitName: 'Mehta Industries, Vadodara',
    name: 'Fire Safety Certificate',
    department: 'Fire Dept',
    status: 'submitted',
    riskTier: 'medium',
    slaDeadline: D(1),
    escalated: false,
    warningsCount: 0,
    lastActionAt: D(-4),
    assignedOfficerName: 'Bob Officer',
  },
  // q-3 — Ramesh Trivedi, high risk, new submission with warnings
  {
    id: 'q-3',
    applicantName: 'Ramesh Trivedi',
    unitName: 'Trivedi Textiles, Surat',
    name: 'Fire NOC',
    department: 'Fire Dept',
    status: 'submitted',
    riskTier: 'high',
    slaDeadline: D(5),
    escalated: false,
    warningsCount: 1,
    lastActionAt: D(-2),
    assignedOfficerName: 'Bob Officer',
  },
  // q-4 — Sunita Patel, normal in review
  {
    id: 'q-4',
    applicantName: 'Sunita Patel',
    unitName: 'Patel Forge, Rajkot',
    name: 'Fire Clearance',
    department: 'Fire Dept',
    status: 'under_review',
    riskTier: 'medium',
    slaDeadline: D(8),
    escalated: false,
    warningsCount: 0,
    lastActionAt: D(-3),
    assignedOfficerName: 'Bob Officer',
  },
  // q-5 — Harish Bhandari, pharma, longer SLA
  {
    id: 'q-5',
    applicantName: 'Harish Bhandari',
    unitName: 'Bhandari Pharma, Ankleshwar',
    name: 'Fire Safety Audit',
    department: 'Fire Dept',
    status: 'under_review',
    riskTier: 'high',
    slaDeadline: D(12),
    escalated: false,
    warningsCount: 0,
    lastActionAt: D(-10),
    assignedOfficerName: 'Bob Officer',
  },
  // q-6 — Neha Joshi, already approved
  {
    id: 'q-6',
    applicantName: 'Neha Joshi',
    unitName: 'Joshi Agro, Anand',
    name: 'Fire NOC',
    department: 'Fire Dept',
    status: 'approved',
    riskTier: 'low',
    slaDeadline: D(30),
    escalated: false,
    warningsCount: 0,
    lastActionAt: D(-5),
    assignedOfficerName: 'Bob Officer',
  },
  // q-7 — Vikram Nair, low risk, comfortable SLA
  {
    id: 'q-7',
    applicantName: 'Vikram Nair',
    unitName: 'Nair Tech, Gandhinagar',
    name: 'Electrical Safety NOC',
    department: 'Fire Dept',
    status: 'submitted',
    riskTier: 'low',
    slaDeadline: D(14),
    escalated: false,
    warningsCount: 0,
    lastActionAt: D(-5),
    assignedOfficerName: 'Bob Officer',
  },
];

// ── Mutable state ──────────────────────────────────────────────────────────
// We use a single object so both the queue list and detail views always share
// live data.
export let officerStore = {
  queue: QUEUE_INITIAL.map((r) => ({ ...r })),
  activityLogs: JSON.parse(JSON.stringify(ACTIVITY_LOGS_INITIAL)),
  messages: JSON.parse(JSON.stringify(MESSAGES_INITIAL)),
  documents: JSON.parse(JSON.stringify(DOCS_PER_REQUEST)),
};

// ── Reset ──────────────────────────────────────────────────────────────────
export function resetOfficerStore() {
  officerStore = {
    queue: QUEUE_INITIAL.map((r) => ({ ...r })),
    activityLogs: JSON.parse(JSON.stringify(ACTIVITY_LOGS_INITIAL)),
    messages: JSON.parse(JSON.stringify(MESSAGES_INITIAL)),
    documents: JSON.parse(JSON.stringify(DOCS_PER_REQUEST)),
  };
  resetApplicantStore();
}

// ── Helpers for detail view ────────────────────────────────────────────────
export { APPLICANT_PROFILES, DOCS_PER_REQUEST, REQUIRED_DOCS_PER_REQUEST };

