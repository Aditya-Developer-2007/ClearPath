// ── Officer queue mock store ───────────────────────────────────────────────
// This module owns the authoritative shared state for officer-side mocks.
// The applicant mock (api.js / myApplicationsCache) holds the *applicant* view
// of the same approval requests. When the officer acts on a request, we update
// BOTH stores so the cross-role demo is consistent.

import { resetApplicantStore } from './applicantStore';
import { computeUrgencyScore } from '../lib/statutoryEngine';

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
      pan: 'AABCS1429B',
      unitSize: '500 sq.m',
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
      pan: 'AABCS1429B',
      unitSize: '500 sq.m',
    },
    warnings: [
      {
        field: 'address',
        doc1: 'Application form',
        doc2: 'Lease deed',
        note: 'Address on the lease deed differs from your application. Fix it before submitting.',
        message: "Business address mismatch: Declared 'Plot 22, Udhna, Surat' does not match registered allotment 'Plot 14, GIDC Sachin, Surat'",
      },
    ],
  },
];

// ── Applicant profiles (officer sees these) ────────────────────────────────
const APPLICANT_PROFILES = {
  req2: {
    name: 'Aarav Mehta',
    sector: 'Textile',
    city: 'Surat',
    investment: '₹30 lakh',
    employees: 12,
    hazardous: false,
    address: DEMO_PROFILE_ADDRESS,
    pan: 'AABCS1429B',
    gstin: '24AABCS1429B1Z5',
    udyam: 'UDYAM-GJ-22-0048192',
  },
  'q-1': {
    name: 'Dilip Shah',
    sector: 'Chemical',
    city: 'Bharuch',
    investment: '₹85 lakh',
    employees: 34,
    hazardous: true,
    address: 'Plot 88, Chemical Zone, Ankleshwar GIDC, Bharuch',
    pan: 'AAECD4491D',
  },
  'q-2': {
    name: 'Priya Mehta',
    sector: 'Engineering',
    city: 'Coimbatore',
    investment: '₹45 lakh',
    employees: 16,
    hazardous: false,
    address: 'Plot 18, SIDCO Industrial Estate, Peelamedu, Coimbatore',
    pan: 'AAMCP7712E',
  },
  'q-3': {
    name: 'Ramesh Trivedi',
    sector: 'Textile',
    city: 'Ahmedabad',
    investment: '₹60 lakh',
    employees: 22,
    hazardous: false,
    address: 'Survey 104, Narol Textile Park, Ahmedabad',
    pan: 'AABTR9901F',
  },
  'q-4': {
    name: 'Sunita Patel',
    sector: 'Food Processing',
    city: 'Ahmedabad',
    investment: '₹40 lakh',
    employees: 15,
    hazardous: false,
    address: 'Plot 102, Sanand GIDC Phase-II, Ahmedabad',
    pan: 'AAPPC6621G',
  },
  'q-5': {
    name: 'Harish Bhandari',
    sector: 'Electronics',
    city: 'Vadodara',
    investment: '₹90 lakh',
    employees: 28,
    hazardous: false,
    address: 'Plot 72, Makarpura GIDC, Vadodara',
    pan: 'AABHB3319H',
  },
  'q-6': {
    name: 'Neha Joshi',
    sector: 'Textile',
    city: 'Surat',
    investment: '₹75 lakh',
    employees: 25,
    hazardous: false,
    address: 'Plot 55, Pandesara GIDC, Surat',
    pan: 'AAJPJ8820J',
  },
  'q-7': {
    name: 'Vikram Nair',
    sector: 'Chemical',
    city: 'Bharuch',
    investment: '₹1.5 cr',
    employees: 48,
    hazardous: true,
    address: 'Plot 12, Dahej PCPIR, Bharuch',
    pan: 'AABZN5512K',
  },
};

// ── Documents per request ─────────────────────────────────────────────────
const DOCS_PER_REQUEST = {
  req2: DOCS_REQ2,
  'q-1': [
    { id: 'd10', docType: 'HOWM Form-1', label: 'HOWM Form-1', fileName: 'howm_form_narmada.pdf', validated: false, warnings: [{ field: 'address', doc1: 'HOWM Form-1', doc2: 'Master Profile', note: 'Slight address variation detected in TSDF waste consignment schedule.' }] },
    { id: 'd11', docType: 'Emergency Response Plan', label: 'Emergency Response Plan', fileName: 'erp_narmada.pdf', validated: true, warnings: [] },
  ],
  'q-2': [
    { id: 'd20', docType: 'Factory Layout Blueprint', label: 'Factory Layout Blueprint', fileName: 'blueprint_kaveri.pdf', validated: true, warnings: [] },
    { id: 'd21', docType: 'Machinery Horsepower Schedule', label: 'Machinery Horsepower Schedule', fileName: 'hp_schedule_kaveri.pdf', validated: true, warnings: [] },
  ],
  'q-3': [
    { id: 'd30', docType: 'Effluent Treatment Plan', label: 'Effluent Treatment Plan', fileName: 'etp_sabarmati.pdf', validated: true, warnings: [] },
    { id: 'd31', docType: 'Air Emission Plan', label: 'Air Emission Plan', fileName: 'air_plan_sabarmati.pdf', validated: false, warnings: [{ field: 'Stack Height', doc1: 'Air Emission Plan', doc2: 'Consent Application', note: 'Boiler stack height must be at least 30m above ground level for textile dyeing boilers.' }] },
  ],
  'q-4': [
    { id: 'd40', docType: 'Food Safety Management Plan', label: 'Food Safety Management Plan', fileName: 'fsms_pragati.pdf', validated: true, warnings: [] },
    { id: 'd41', docType: 'Water Potability Report', label: 'Water Potability Report', fileName: 'water_report_pragati.pdf', validated: true, warnings: [] },
  ],
  'q-5': [
    { id: 'd50', docType: 'Electrical Load Sheet', label: 'Electrical Load Sheet', fileName: 'load_shakti.pdf', validated: true, warnings: [] },
    { id: 'd51', docType: 'Contractor Test Report', label: 'Contractor Test Report', fileName: 'test_report_shakti.pdf', validated: true, warnings: [] },
  ],
  'q-6': [
    { id: 'd60', docType: 'Boiler Maker Certificate', label: 'Boiler Maker Certificate', fileName: 'boiler_maker_tapi.pdf', validated: true, warnings: [] },
    { id: 'd61', docType: 'Hydraulic Test Certificate', label: 'Hydraulic Test Certificate', fileName: 'hydro_test_tapi.pdf', validated: true, warnings: [] },
  ],
  'q-7': [
    { id: 'd70', docType: 'Site Plan', label: 'Site Plan', fileName: 'site_plan_zydex.pdf', validated: true, warnings: [] },
    { id: 'd71', docType: 'Fire Safety Plan', label: 'Fire Safety Plan', fileName: 'fire_plan_zydex.pdf', validated: true, warnings: [] },
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
    { docType: 'Emergency Response Plan', label: 'Emergency Response Plan', required: true },
    { docType: 'HOWM Form-1', label: 'HOWM Form-1', required: true },
  ],
  'q-2': [
    { docType: 'Factory Layout Blueprint', label: 'Factory Layout Blueprint', required: true },
    { docType: 'Machinery Horsepower Schedule', label: 'Machinery Horsepower Schedule', required: true },
  ],
  'q-3': [
    { docType: 'Effluent Treatment Plan', label: 'Effluent Treatment Plan', required: true },
    { docType: 'Air Emission Plan', label: 'Air Emission Plan', required: true },
  ],
  'q-4': [
    { docType: 'Food Safety Management Plan', label: 'Food Safety Management Plan', required: true },
    { docType: 'Water Potability Report', label: 'Water Potability Report', required: true },
  ],
  'q-5': [
    { docType: 'Electrical Load Sheet', label: 'Electrical Load Sheet', required: true },
    { docType: 'Contractor Test Report', label: 'Contractor Test Report', required: true },
  ],
  'q-6': [
    { docType: 'Boiler Maker Certificate', label: 'Boiler Maker Certificate', required: true },
    { docType: 'Hydraulic Test Certificate', label: 'Hydraulic Test Certificate', required: true },
  ],
  'q-7': [
    { docType: 'Site Plan', label: 'Site Plan', required: true },
    { docType: 'Fire Safety Plan', label: 'Fire Safety Plan', required: true },
  ],
};

// ── Activity logs per request ──────────────────────────────────────────────
const ACTIVITY_LOGS_INITIAL = {
  req2: [
    { action: 'Application Created', by: 'Aarav Mehta', timestamp: D(-10), note: 'Submitted via IFP Gujarat single window' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-9), note: 'Auto-routed to Safety & Fire Services' },
    { action: 'Query Raised', by: 'Vikramaditya Sinh', timestamp: D(-2), note: 'Doc incomplete, NOC mismatch' },
  ],
  'q-1': [
    { action: 'Application Created', by: 'Dilip Shah', timestamp: D(-14), note: 'HOWM Rule 6 Authorization request' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-13), note: 'Assigned to GPCB Regional Office, Ankleshwar' },
    { action: 'Escalated to Senior Officer (SLA breached)', by: 'System', timestamp: D(-3), note: 'SLA deadline breached. Reassigned to Member Secretary, State PCB.' },
  ],
  'q-2': [
    { action: 'Application Created', by: 'Priya Mehta', timestamp: D(-5), note: 'Factory Licence Form-1 application' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-4), note: 'Assigned to Inspectorate of Factories' },
  ],
  'q-3': [
    { action: 'Application Created', by: 'Ramesh Trivedi', timestamp: D(-3), note: 'CTE Red Category process application' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-2), note: 'Assigned to Regional Officer, GPCB' },
  ],
  'q-4': [
    { action: 'Application Created', by: 'Sunita Patel', timestamp: D(-8), note: 'FoSCoS State Licence application' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-7), note: 'Assigned to Food Safety Officer, Sanand' },
    { action: 'Under Review', by: 'S. K. Deshmukh', timestamp: D(-3), note: 'FSMS scrutiny under progress' },
  ],
  'q-5': [
    { action: 'Application Created', by: 'Harish Bhandari', timestamp: D(-20), note: 'LT/HT power connection request' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-19), note: 'Assigned to Executive Engineer, DGVCL' },
    { action: 'Under Review', by: 'K. Desai, Executive Engineer', timestamp: D(-10), note: 'Transformer load verification pending' },
  ],
  'q-6': [
    { action: 'Application Created', by: 'Neha Joshi', timestamp: D(-30), note: 'Boiler registration under Section 7' },
    { action: 'Approved', by: 'Er. Devendra Patel', timestamp: D(-5), note: 'Hydraulic pressure test verified at 18 kg/cm2.' },
  ],
  'q-7': [
    { action: 'Application Created', by: 'Vikram Nair', timestamp: D(-6), note: 'Provisional Fire Safety NOC application' },
    { action: 'Officer Assigned', by: 'System', timestamp: D(-5), note: 'Assigned to Dahej Fire & Emergency Services' },
  ],
};

// ── Messages per request ───────────────────────────────────────────────────
const MESSAGES_INITIAL = {
  req2: [
    {
      id: 'm1',
      senderRole: 'officer',
      senderName: 'Vikramaditya Sinh',
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
      senderName: 'Dr. Meenakshi Nair, Senior Env Engineer',
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
      text: 'Please find the updated FSMS and water testing certification attached.',
      timestamp: D(-2),
    },
  ],
  'q-5': [],
  'q-6': [],
  'q-7': [],
};

// ── Initial queue rows (source of truth) ──────────────────────────────────
const QUEUE_INITIAL = [
  {
    id: 'req2',
    applicantName: 'Aarav Mehta',
    unitName: 'Surya Vastra Mills Pvt. Ltd., Surat',
    name: 'Provisional Fire Safety NOC',
    department: 'Safety',
    status: 'query_raised',
    riskTier: 'high',
    slaDeadline: D(6),
    escalated: false,
    escalatedFrom: null,
    warningsCount: 1,
    lastActionAt: D(-2),
    assignedOfficerName: 'Vikramaditya Sinh',
    statutoryFeeInr: 7500,
    feeFormula: '₹15/sq.m Fire Cess under State Fire Act',
    rtpsActClause: 'Right to Public Services Act — Auto-Escalation & ₹250/day SLA Delay Liability',
  },
  {
    id: 'q-1',
    applicantName: 'Dilip Shah',
    unitName: 'Narmada Specialty Chemicals Pvt. Ltd., Bharuch',
    name: 'Hazardous Chemical Authorization (HOWM)',
    department: 'Environment',
    status: 'submitted',
    riskTier: 'high',
    slaDeadline: D(-3),
    escalated: true,
    escalatedFrom: 'SLA Breach Auto-Escalation',
    warningsCount: 1,
    lastActionAt: D(-3),
    assignedOfficerName: 'Dr. Meenakshi Nair, Senior Env Engineer',
    statutoryFeeInr: 12000,
    feeFormula: 'HOWM Rules Authorization & Scrutiny Fee',
    rtpsActClause: 'Right to Public Services Act — Auto-Escalation & ₹250/day SLA Delay Liability',
  },
  {
    id: 'q-2',
    applicantName: 'Priya Mehta',
    unitName: 'Kaveri Precision Engg Works, Coimbatore',
    name: 'Factory Building Plan & Licence',
    department: 'Industrial',
    status: 'submitted',
    riskTier: 'medium',
    slaDeadline: D(1),
    escalated: false,
    warningsCount: 0,
    lastActionAt: D(-4),
    assignedOfficerName: 'Er. Devendra Patel',
    statutoryFeeInr: 4500,
    feeFormula: 'Factories Act Schedule-I (HP + Workforce Slab)',
    rtpsActClause: 'Right to Public Services Act — Auto-Escalation & ₹250/day SLA Delay Liability',
  },
  {
    id: 'q-3',
    applicantName: 'Ramesh Trivedi',
    unitName: 'Sabarmati Dyeing & Bleaching House, Ahmedabad',
    name: 'Pollution Consent (CTE — Red Category)',
    department: 'Environment',
    status: 'submitted',
    riskTier: 'high',
    slaDeadline: D(24),
    escalated: false,
    warningsCount: 1,
    lastActionAt: D(-2),
    assignedOfficerName: 'Dr. Meenakshi Nair',
    statutoryFeeInr: 15000,
    feeFormula: 'SPCB Consent Fee Slab for Investment <= ₹1 Cr',
    rtpsActClause: 'Right to Public Services Act — Auto-Escalation & ₹250/day SLA Delay Liability',
  },
  {
    id: 'q-4',
    applicantName: 'Sunita Patel',
    unitName: 'Pragati Cold Chain & Agro Foods, Ahmedabad',
    name: 'FSSAI State Manufacturing Licence',
    department: 'Safety',
    status: 'under_review',
    riskTier: 'medium',
    slaDeadline: D(26),
    escalated: false,
    warningsCount: 0,
    lastActionAt: D(-3),
    assignedOfficerName: 'S. K. Deshmukh',
    statutoryFeeInr: 5000,
    feeFormula: 'FoSCoS Schedule-3 State Manufacturing Fee (Annual)',
    rtpsActClause: 'Right to Public Services Act — Auto-Escalation & ₹250/day SLA Delay Liability',
  },
  {
    id: 'q-5',
    applicantName: 'Harish Bhandari',
    unitName: 'shakti Switchgear & Transformers, Vadodara',
    name: 'HT Industrial Power Sanction',
    department: 'Utilities',
    status: 'under_review',
    riskTier: 'low',
    slaDeadline: D(30),
    escalated: false,
    warningsCount: 0,
    lastActionAt: D(-10),
    assignedOfficerName: 'K. Desai, Executive Engineer',
    statutoryFeeInr: 6500,
    feeFormula: 'DISCOM LT/HT Application & Line Inspection Fee',
    rtpsActClause: 'Right to Public Services Act — Auto-Escalation & ₹250/day SLA Delay Liability',
  },
  {
    id: 'q-6',
    applicantName: 'Neha Joshi',
    unitName: 'Tapi Synthetics & Filaments, Surat',
    name: 'Industrial Boiler Registration',
    department: 'Industrial',
    status: 'approved',
    riskTier: 'medium',
    slaDeadline: D(30),
    escalated: false,
    warningsCount: 0,
    lastActionAt: D(-5),
    assignedOfficerName: 'Er. Devendra Patel',
    statutoryFeeInr: 6000,
    feeFormula: 'Indian Boiler Regulations Steam Rating Slab',
    rtpsActClause: 'Right to Public Services Act — Auto-Escalation & ₹250/day SLA Delay Liability',
  },
  {
    id: 'q-7',
    applicantName: 'Vikram Nair',
    unitName: 'Zydex Bio-Polymers LLP, Bharuch',
    name: 'Provisional Fire Safety NOC',
    department: 'Safety',
    status: 'submitted',
    riskTier: 'high',
    slaDeadline: D(28),
    escalated: false,
    warningsCount: 0,
    lastActionAt: D(-5),
    assignedOfficerName: 'Vikramaditya Sinh',
    statutoryFeeInr: 7500,
    feeFormula: '₹15/sq.m Fire Cess under State Fire Act',
    rtpsActClause: 'Right to Public Services Act — Auto-Escalation & ₹250/day SLA Delay Liability',
  },
];

// ── Mutable state ──────────────────────────────────────────────────────────
export let officerStore = {
  queue: QUEUE_INITIAL.map((r) => ({ ...r, urgencyScore: computeUrgencyScore(r) })),
  activityLogs: JSON.parse(JSON.stringify(ACTIVITY_LOGS_INITIAL)),
  messages: JSON.parse(JSON.stringify(MESSAGES_INITIAL)),
  documents: JSON.parse(JSON.stringify(DOCS_PER_REQUEST)),
};

export function getOfficerStore() {
  return officerStore;
}

// ── Reset ──────────────────────────────────────────────────────────────────
export function resetOfficerStore() {
  officerStore = {
    queue: QUEUE_INITIAL.map((r) => ({ ...r, urgencyScore: computeUrgencyScore(r) })),
    activityLogs: JSON.parse(JSON.stringify(ACTIVITY_LOGS_INITIAL)),
    messages: JSON.parse(JSON.stringify(MESSAGES_INITIAL)),
    documents: JSON.parse(JSON.stringify(DOCS_PER_REQUEST)),
  };
  resetApplicantStore();
}

// ── Helpers for detail view ────────────────────────────────────────────────
export { APPLICANT_PROFILES, DOCS_PER_REQUEST, REQUIRED_DOCS_PER_REQUEST };
