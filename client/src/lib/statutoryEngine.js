// ── ClearPath Indian Statutory Rule Engine (Single Source of Truth) ─────────
// Grounded in Indian Federal & State Regulatory Acts:
// - MSMED Act 2006, CGST Act 2017 & State PT Acts
// - State Fire Prevention & Life Safety Measures Acts
// - Water (Prevention & Control of Pollution) Act 1974 & Air Act 1981 (CPCB)
// - The Factories Act, 1948 (Sections 2m & 6)
// - State Shops & Commercial Establishments Acts / CLRA 1970 / OSH Code
// - The Electricity Act, 2003 (Section 43)
// - Food Safety & Standards Act, 2006 (Section 31)
// - Hazardous & Other Wastes (M&TM) Rules, 2016
// - Indian Boilers Act, 1923

export function getStatePortalBadge(state) {
  const s = (state || '').toLowerCase();
  if (s.includes('gujarat') || s.includes('surat') || s.includes('ahmedabad') || s.includes('vadodara') || s.includes('rajkot')) {
    return 'Routed via Investor Facilitation Portal (IFP Gujarat)';
  }
  if (s.includes('maharashtra') || s.includes('mumbai') || s.includes('pune')) {
    return 'Routed via MAITRI 2.0 Single Window';
  }
  if (s.includes('uttar pradesh') || s.includes('up') || s.includes('noida') || s.includes('kanpur') || s.includes('lucknow')) {
    return 'Routed via Nivesh Mitra 3.0';
  }
  if (s.includes('tamil nadu') || s.includes('tn') || s.includes('chennai') || s.includes('coimbatore')) {
    return 'Routed via TNSWP Single Window';
  }
  return 'Routed via National Single Window System (NSWS)';
}

export function normalizeBusinessInput(input = {}) {
  const rawSector = (input.sector || '').toLowerCase();
  let sector = 'manufacturing';
  if (rawSector.includes('textile')) {
    sector = 'textile';
  } else if (rawSector.includes('food')) {
    sector = 'food';
  } else if (rawSector.includes('chem')) {
    sector = 'chemical';
  } else if (rawSector.includes('elect')) {
    sector = 'electronics';
  } else if (rawSector.includes('pharma')) {
    sector = 'pharma';
  } else if (rawSector.includes('engineer') || rawSector.includes('manuf')) {
    sector = 'manufacturing';
  }

  let employees = 12;
  if (input.employees !== null && input.employees !== undefined) {
    const parsedEmp = parseInt(input.employees, 10);
    if (!isNaN(parsedEmp)) employees = parsedEmp;
  }

  let investmentLakh = 30;
  if (input.investmentLakh !== null && input.investmentLakh !== undefined) {
    investmentLakh = Number(input.investmentLakh);
  } else if (input.investment !== null && input.investment !== undefined) {
    const rawInv = String(input.investment).toLowerCase();
    if (rawInv.includes('cr')) {
      const m = rawInv.match(/(\d+(?:\.\d+)?)/);
      investmentLakh = m ? Math.round(parseFloat(m[1]) * 100) : 100;
    } else {
      const m = rawInv.match(/(\d+(?:\.\d+)?)/);
      investmentLakh = m ? Math.round(parseFloat(m[1])) : 30;
    }
  }

  const hazardous = input.hazardous === true || sector === 'chemical';

  const rawCity = (input.city || '').toLowerCase();
  const rawState = (input.state || '').toLowerCase();
  let state = 'Gujarat';
  if (rawState.includes('maharashtra') || rawCity.includes('mumbai') || rawCity.includes('pune')) {
    state = 'Maharashtra';
  } else if (rawState.includes('uttar pradesh') || rawState.includes('up') || rawCity.includes('noida') || rawCity.includes('kanpur') || rawCity.includes('lucknow')) {
    state = 'Uttar Pradesh';
  } else if (rawState.includes('tamil nadu') || rawState.includes('tn') || rawCity.includes('chennai') || rawCity.includes('coimbatore')) {
    state = 'Tamil Nadu';
  } else if (rawState.includes('gujarat') || rawCity.includes('surat') || rawCity.includes('ahmedabad') || rawCity.includes('vadodara') || rawCity.includes('rajkot')) {
    state = 'Gujarat';
  } else if (input.state) {
    state = input.state;
  }

  return {
    ...input,
    sector,
    employees,
    investmentLakh,
    hazardous,
    state,
    city: input.city || (state === 'Gujarat' ? 'Surat' : ''),
    stage: input.stage || 'New',
  };
}

export const STATUTORY_CATALOG = [
  {
    code: 'MSME-06',
    name: 'Udyam Registration',
    department: 'MSME',
    stage: 'Stage A: Zero-to-land / Premises Stage',
    formName: 'Udyam Portal Annex-I',
    slaDays: 3,
    riskTier: 'low',
    needsInspection: false,
    requirementType: 'BASE',
    statutoryBasis: 'MSMED Act, 2006 — Mandatory baseline MSME classification',
    docs: ['Aadhaar of Promoter', 'Business PAN Card', 'Bank Account Proof'],
    keywords: ['udyam', 'msme', 'small business', 'aadhaar', 'pan', 'msme-06'],
    matches: (ctx) => ctx.investmentLakh <= 5000,
  },
  {
    code: 'FIN-07',
    name: 'GST & Professional Tax Registration',
    department: 'Finance',
    stage: 'Stage A: Zero-to-land / Premises Stage',
    formName: 'GST REG-01 & Form-I',
    slaDays: 7,
    riskTier: 'low',
    needsInspection: false,
    requirementType: 'BASE',
    statutoryBasis: 'CGST Act, 2017 Sec 22 & State Tax on Professions Act',
    docs: ['Business PAN Card', 'Proof of Principal Place of Business', 'Cancelled Cheque'],
    keywords: ['professional tax', 'pt', 'gst', 'finance', 'fin-07', 'tax'],
    matches: () => true,
  },
  {
    code: 'FD-01',
    name: 'Provisional Fire Safety NOC',
    department: 'Safety',
    stage: 'Stage B: Pre-construction / Construction Stage',
    formName: 'Fire Safety Form-A2',
    slaDays: 21,
    getRiskTier: (ctx) => (ctx.hazardous ? 'high' : 'medium'),
    needsInspection: true,
    requirementType: 'BASE',
    statutoryBasis: 'State Fire Prevention & Life Safety Measures Act — Industrial Plot & Fire Load',
    docs: ['Fire Safety Plan', 'Building Layout Plan', 'Lease Deed'],
    keywords: ['fire', 'noc', 'fire safety', 'aag', 'fd-01'],
    matches: (ctx) =>
      ctx.hazardous === true ||
      ['textile', 'chemical', 'engineering', 'manufacturing', 'food'].includes(ctx.sector) ||
      ctx.investmentLakh >= 25,
  },
  {
    code: 'ENV-02',
    department: 'Environment',
    stage: 'Stage B: Pre-construction / Construction Stage',
    requirementType: 'BASE',
    docs: ['Process Flow Diagram', 'Effluent / Air Emission Plan', 'Site Plan & Lease Deed'],
    keywords: ['pollution', 'environment', 'consent', 'cte', 'cto', 'environmental', 'pradushan', 'env-02'],
    matches: () => true,
    dynamic: (ctx) => {
      if (ctx.hazardous === true || ctx.sector === 'chemical') {
        return {
          name: 'Pollution Consent (CTE — Red Category)',
          slaDays: 30,
          riskTier: 'high',
          needsInspection: true,
          formName: 'SPCB Form-I (Red)',
          statutoryBasis: 'Water Act 1974 & Air Act 1981 — CPCB Red Category (PI Score >= 60)',
        };
      }
      if (['textile', 'food', 'engineering', 'manufacturing'].includes(ctx.sector)) {
        return {
          name: 'Pollution Consent (CTE — Orange Category)',
          slaDays: 21,
          riskTier: 'medium',
          needsInspection: true,
          formName: 'SPCB Form-I (Orange)',
          statutoryBasis: 'CPCB Revised Classification — Orange Category Industrial Process',
        };
      }
      return {
        name: 'Pollution Consent (CTE — Green Category)',
        slaDays: 15,
        riskTier: 'low',
        needsInspection: false,
        formName: 'SPCB Green Intimation',
        statutoryBasis: 'CPCB Green Category — Non-Polluting Assembly',
      };
    },
  },
  {
    code: 'IND-03',
    name: 'Factory Building Plan & Licence',
    department: 'Industrial',
    stage: 'Stage C: Commissioning / Pre-operation Stage',
    formName: 'DISH Form-1 & Form-2',
    slaDays: 30,
    getRiskTier: (ctx) => (ctx.hazardous ? 'high' : 'medium'),
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'The Factories Act, 1948 (Section 2m & Section 6) — >= 10 Workers with Power',
    docs: ['Factory Layout Blueprint', 'Machinery Horsepower Schedule', 'Stability Certificate'],
    keywords: ['factory', 'licence', 'license', 'industrial', 'machinery', 'karkhana', 'ind-03'],
    matches: (ctx) => Number(ctx.employees) >= 10,
  },
  {
    code: 'LAB-04',
    department: 'Labour',
    stage: 'Stage C: Commissioning / Pre-operation Stage',
    needsInspection: false,
    requirementType: 'BASE',
    docs: ['Employee Muster Roll', 'Employer PAN & Address Proof', 'Partnership / Incorporation Deed'],
    keywords: ['labour', 'labor', 'worker', 'workers', 'shramik', 'karmachari', 'log', 'lab-04', 'shop', 'establishment'],
    matches: () => true,
    dynamic: (ctx) => {
      const emp = Number(ctx.employees);
      if (emp < 10) {
        return {
          name: 'Shop & Establishment Registration',
          slaDays: 7,
          riskTier: 'low',
          formName: 'Labour Form-A',
          statutoryBasis: 'State Shops & Establishments Act — < 10 Workers (Exempt from Factories Act)',
        };
      }
      if (emp >= 20) {
        return {
          name: 'Principal Employer & Contract Labour Registration',
          slaDays: 15,
          riskTier: 'medium',
          formName: 'CLRA Form-I / OSH Code',
          statutoryBasis: 'Contract Labour (R&A) Act, 1970 & EPF/ESI — >= 20 Workers',
        };
      }
      return {
        name: 'Labour Welfare & EPF/ESIC Registration',
        slaDays: 10,
        riskTier: 'low',
        formName: 'Shram Suvidha Common Form',
        statutoryBasis: 'ESIC Act, 1948 & EPF Act, 1952 — >= 10 Employees',
      };
    },
  },
  {
    code: 'UTL-05',
    name: 'HT / LT Industrial Power Sanction',
    department: 'Utilities',
    stage: 'Stage C: Commissioning / Pre-operation Stage',
    formName: 'DISCOM LT/HT Form-1',
    slaDays: 15,
    riskTier: 'low',
    needsInspection: true,
    requirementType: 'BASE',
    statutoryBasis: 'Electricity Act, 2003 (Section 43) — Industrial Connected Load',
    docs: ['Electrical Load Calculation Sheet', 'Test Report from Licensed Electrical Contractor', 'Premises Ownership / Lease Deed'],
    keywords: ['electricity', 'power', 'bijli', 'connection', 'utility', 'load', 'utl-05'],
    matches: () => true,
  },
  {
    code: 'FSSAI-09',
    name: 'FSSAI State Manufacturing Licence',
    department: 'Safety',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'FoSCoS Form-B',
    slaDays: 21,
    riskTier: 'medium',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Food Safety and Standards Act, 2006 (Section 31) — Food Processing Unit',
    docs: ['Food Processing Unit Layout', 'NABL Water Analytical Report', 'FSMS Plan & Equipment List'],
    keywords: ['fssai', 'food', 'food safety', 'foscos', 'fssai-09'],
    matches: (ctx) => ctx.sector === 'food',
  },
  {
    code: 'HAZ-11',
    name: 'Hazardous Chemical & Waste Authorization',
    department: 'Environment',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'HOWM Form-1 & MSIHC Schedule',
    slaDays: 30,
    riskTier: 'high',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Hazardous & Other Wastes (M&TM) Rules, 2016 & MSIHC Rules, 1989',
    docs: ['Material Safety Data Sheets (MSDS)', 'On-Site Emergency Plan', 'TSDF Membership Certificate'],
    keywords: ['hazardous', 'waste', 'hwm', 'haz-11', 'chemical waste'],
    matches: (ctx) => ctx.hazardous === true || ctx.sector === 'chemical',
  },
  {
    code: 'BOIL-13',
    name: 'Textile / Industrial Boiler Registration',
    department: 'Industrial',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'IBR Form-I',
    slaDays: 21,
    riskTier: 'medium',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Indian Boilers Act, 1923 — Steam / Thermal Processing Unit',
    docs: ['Boiler Manufacturer IBR Certificate', 'Steam Pipeline Drawing'],
    keywords: ['boiler', 'lifting', 'equipment', 'boil-13', 'steam', 'ibr'],
    matches: (ctx) => ctx.sector === 'textile' && Number(ctx.investmentLakh) >= 25,
  },
];

// Mapping for canonical demo IDs (req1..req7) used in the Alice applicant profile
const DEMO_CODE_TO_REQ_ID = {
  'IND-03': 'req1',
  'FD-01': 'req2',
  'ENV-02': 'req3',
  'LAB-04': 'req4',
  'UTL-05': 'req5',
  'MSME-06': 'req6',
  'FIN-07': 'req7',
};

export function evaluateStatutoryApprovals(rawInput = {}, options = {}) {
  const ctx = normalizeBusinessInput(rawInput);
  const routing = getStatePortalBadge(ctx.state);
  const preserveDemoIds = options.preserveDemoIds ?? (
    (ctx.sector === 'textile' && ctx.city?.toLowerCase() === 'surat') ||
    options.isDefaultDemo
  );

  const results = [];

  for (const entry of STATUTORY_CATALOG) {
    if (!entry.matches(ctx)) continue;

    let dynamicProps = {};
    if (typeof entry.dynamic === 'function') {
      dynamicProps = entry.dynamic(ctx);
    }

    const riskTier = dynamicProps.riskTier ||
      (typeof entry.getRiskTier === 'function' ? entry.getRiskTier(ctx) : entry.riskTier);

    const code = entry.code;
    const id = (preserveDemoIds && DEMO_CODE_TO_REQ_ID[code]) ? DEMO_CODE_TO_REQ_ID[code] : code;

    results.push({
      id,
      code,
      name: dynamicProps.name || entry.name,
      department: entry.department,
      stage: entry.stage,
      formName: dynamicProps.formName || entry.formName,
      slaDays: dynamicProps.slaDays || entry.slaDays,
      riskTier,
      needsInspection: dynamicProps.needsInspection !== undefined ? dynamicProps.needsInspection : entry.needsInspection,
      requirementType: entry.requirementType,
      statutoryBasis: dynamicProps.statutoryBasis || entry.statutoryBasis,
      docs: [...entry.docs],
      routing,
      keywords: entry.keywords,
      status: 'not_started',
    });
  }

  return results;
}

// Drop-in replacement for old generateApprovalsForBusiness
export function generateApprovalsForBusiness(data) {
  return evaluateStatutoryApprovals(data, { preserveDemoIds: false });
}

// Single source of truth knowledge base for AssistantDrawer and askAssistantAPI
export const KNOWLEDGE_BASE = [
  ...STATUTORY_CATALOG.map((item) => ({
    sourceRef: item.code,
    name: item.name || (item.code === 'ENV-02' ? 'Pollution Consent (CTE)' : 'Labour Registration'),
    department: item.department,
    slaDays: item.slaDays || 21,
    docs: item.docs,
    keywords: item.keywords,
    statutoryBasis: item.statutoryBasis || 'Statutory clearance under Indian Industrial Law',
  })),
  {
    sourceRef: 'ADM-08',
    name: 'Joint Combined Inspection',
    department: 'Joint Inspection Cell',
    slaDays: 10,
    docs: ['Joint Site Verification Checklist', 'Self-Certification'],
    keywords: ['combined', 'inspection', 'inspections', 'joint', 'combine', 'together', 'saath', 'visit', 'adm-08'],
    statutoryBasis: 'Ease of Doing Business Mandate — Unified Central Inspection Scheme',
  },
];

