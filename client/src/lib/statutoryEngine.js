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
// - PMEGP, CGTMSE & State Industrial Policy Subsidies
// - Right to Public Services (RTPS) Act Timelines & Statutory Guarantee
// - Public Procurement Policy for MSEs Order, 2012 (GeM & CPPP Tenders)

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

// ── Dynamic Statutory Fee Calculator ─────────────────────────────────────────
export function computeStatutoryFee(code, ctx = {}) {
  const emp = Number(ctx.employees) || 12;
  const haz = Boolean(ctx.hazardous);

  switch (code) {
    case 'MSME-06':
      return {
        statutoryFeeInr: 0,
        feeFormula: 'Exempt — Statutory Free Portal under MSMED Act',
      };
    case 'FIN-07':
      return {
        statutoryFeeInr: 0,
        feeFormula: 'Statutory Zero Fee on GSTN & State Tax Portal',
      };
    case 'FD-01': {
      const fee = 5000 + (haz ? 10000 : 2500);
      return {
        statutoryFeeInr: fee,
        feeFormula: '₹15/sq.m Fire Cess under State Fire Act',
      };
    }
    case 'ENV-02': {
      if (haz || ctx.sector === 'chemical') {
        return {
          statutoryFeeInr: 15000,
          feeFormula: 'SPCB Consent Fee Slab for Investment <= ₹1 Cr',
        };
      }
      if (['textile', 'food', 'engineering', 'manufacturing'].includes(ctx.sector)) {
        return {
          statutoryFeeInr: 7500,
          feeFormula: 'SPCB Consent Fee Slab for Investment <= ₹1 Cr',
        };
      }
      return {
        statutoryFeeInr: 2000,
        feeFormula: 'SPCB Consent Fee Slab for Investment <= ₹1 Cr',
      };
    }
    case 'IND-03':
      return {
        statutoryFeeInr: emp <= 20 ? 4500 : 9000,
        feeFormula: 'Factories Act Schedule-I (HP + Workforce Slab)',
      };
    case 'LAB-04':
      return {
        statutoryFeeInr: emp < 10 ? 1000 : 3000,
        feeFormula: 'Shram Suvidha Headcount Slab',
      };
    case 'UTL-05':
      return {
        statutoryFeeInr: 6500,
        feeFormula: 'DISCOM LT/HT Application & Line Inspection Fee',
      };
    case 'FSSAI-09':
      return {
        statutoryFeeInr: 5000,
        feeFormula: 'FoSCoS Schedule-3 State Manufacturing Fee (Annual)',
      };
    case 'HAZ-11':
      return {
        statutoryFeeInr: 12000,
        feeFormula: 'HOWM Rules Authorization & Scrutiny Fee',
      };
    case 'BOIL-13':
      return {
        statutoryFeeInr: 6000,
        feeFormula: 'Indian Boiler Regulations Steam Rating Slab',
      };
    default:
      return {
        statutoryFeeInr: 2500,
        feeFormula: 'Standard Statutory Scrutiny Fee',
      };
  }
}

// ── RTPS Urgency Score Calculator ───────────────────────────────────────────
export function computeUrgencyScore(approval) {
  if (!approval) return 0;
  if (['approved', 'rejected'].includes(approval.status)) return 0;

  let score = 50;
  const now = Date.now();
  const deadlineMs = approval.slaDeadline
    ? new Date(approval.slaDeadline).getTime()
    : now + (approval.slaDays || 21) * 86400000;

  const hoursRemaining = (deadlineMs - now) / 3600000;

  if (hoursRemaining < 0) {
    const daysOverdue = Math.abs(Math.floor(hoursRemaining / 24));
    score += 100 + daysOverdue * 10;
  } else if (hoursRemaining <= 48) {
    score += 60;
  } else if (hoursRemaining <= 120) {
    score += 40;
  } else if (hoursRemaining <= 240) {
    score += 20;
  } else {
    score += 5;
  }

  if (approval.escalated) {
    score += 50;
  }

  const risk = (approval.riskTier || '').toLowerCase();
  if (risk === 'high') score += 30;
  else if (risk === 'medium') score += 15;
  else score += 5;

  const warnings = Number(approval.warningsCount) || (approval.documents ? approval.documents.reduce((acc, d) => acc + (d.warnings?.length || 0), 0) : 0);
  score += warnings * 10;

  return score;
}

// ── Critical-Path SLA & Fee Turnaround Summary ───────────────────────────────
export function calculateCriticalPath(approvals = []) {
  if (!Array.isArray(approvals) || approvals.length === 0) {
    return {
      estimatedDays: 0,
      sequentialDays: 0,
      parallelDaysSaved: 0,
      totalStatutoryFeeInr: 0,
      stageBreakdown: {},
    };
  }

  const stageBreakdown = {};
  let sequentialDays = 0;
  let totalStatutoryFeeInr = 0;

  for (const app of approvals) {
    const stage = app.stage || 'Stage C: Commissioning / Pre-operation Stage';
    const sla = Number(app.slaDays) || 0;
    const fee = Number(app.statutoryFeeInr) || 0;

    sequentialDays += sla;
    totalStatutoryFeeInr += fee;

    if (!stageBreakdown[stage]) {
      stageBreakdown[stage] = { maxDays: 0, approvals: [] };
    }
    stageBreakdown[stage].approvals.push(app.id || app.code);
    if (sla > stageBreakdown[stage].maxDays) {
      stageBreakdown[stage].maxDays = sla;
    }
  }

  let estimatedDays = 0;
  for (const stageKey of Object.keys(stageBreakdown)) {
    estimatedDays += stageBreakdown[stageKey].maxDays;
  }

  if (estimatedDays === 0) estimatedDays = 30;
  const parallelDaysSaved = Math.max(0, sequentialDays - estimatedDays);

  return {
    estimatedDays,
    sequentialDays,
    parallelDaysSaved,
    totalStatutoryFeeInr,
    stageBreakdown,
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
    keywords: ['professional tax', 'pt', 'gst registration', 'gst certificate', 'gst portal', 'finance', 'fin-07'],
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
    statutoryBasis: 'Food Safety & Standards Act, 2006 (Section 31) — State Manufacturing Capacity',
    docs: ['Food Safety Management System (FSMS) Plan', 'Water Potability Test Report', 'List of Food Categories & Equipment'],
    keywords: ['fssai', 'food', 'khana', 'edible', 'foscos', 'fssai-09'],
    matches: (ctx) => ctx.sector === 'food',
  },
  {
    code: 'HAZ-11',
    name: 'Hazardous Waste Authorization (HOWM)',
    department: 'Environment',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'HOWM Form-1 & MSIHC Schedule',
    slaDays: 45,
    riskTier: 'high',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Hazardous & Other Wastes (M&TM) Rules, 2016 & MSIHC Rules, 1989',
    docs: ['Emergency Response Plan', 'Hazardous Waste Generation & Storage Protocol', 'TSDF Membership Certificate'],
    keywords: ['hazardous', 'chemical', 'toxic', 'waste', 'hazmat', 'msihc', 'haz-11'],
    matches: (ctx) => ctx.hazardous === true || ctx.sector === 'chemical',
  },
  {
    code: 'BOIL-13',
    name: 'Industrial Boiler Registration',
    department: 'Industrial',
    stage: 'Stage C: Commissioning / Pre-operation Stage',
    formName: 'Boiler Form-B',
    slaDays: 21,
    riskTier: 'medium',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Indian Boilers Act, 1923 (Section 7) — Steam Generation Vessels',
    docs: ['Boiler Maker Certificate', 'Welder Qualification Record', 'Hydraulic Test Certificate'],
    keywords: ['boiler', 'steam', 'steam vessel', 'pressure vessel', 'boil-13'],
    matches: (ctx) => ['textile', 'chemical'].includes(ctx.sector),
  },
];

// ── Statutory Government Support & Subsidy Schemes Catalog ──────────────────
export const SCHEMES_CATALOG = [
  {
    code: 'SCH-01',
    name: 'PMEGP Capital Subsidy (Margin Money Scheme)',
    agency: 'Ministry of MSME (KVIC)',
    benefit: '15% to 35% Capital Subsidy on Project Cost',
    eligibilityBasis: 'Eligible: Manufacturing unit with project investment <= ₹50 Lakh under PMEGP norms',
    portal: 'KVIC PMEGP e-Portal',
    matches: (ctx) => Number(ctx.investmentLakh) <= 50,
  },
  {
    code: 'SCH-02',
    name: 'CGTMSE Collateral-Free Credit Guarantee',
    agency: 'SIDBI & Ministry of MSME',
    benefit: 'Up to 85% Credit Guarantee Cover (No Collateral up to ₹5 Cr)',
    eligibilityBasis: 'Eligible: MSME credit facility <= ₹5 Crore under CGTMSE Trust rules',
    portal: 'CGTMSE Member Lending Portal',
    matches: (ctx) => Number(ctx.investmentLakh) <= 500,
  },
  {
    code: 'SCH-03',
    name: 'State Industrial Policy Interest & Power Subsidy',
    getAgency: (ctx) => (ctx.state === 'Gujarat' ? 'Industries & Mines Dept, Gujarat' : 'State Directorate of Industries'),
    benefit: '5% to 7% Interest Subsidy for 5 Years + Electricity Duty Exemption',
    eligibilityBasis: 'Eligible: Concessional term loan interest & industrial power tariff exemption',
    getPortal: (ctx) => (ctx.state === 'Gujarat' ? 'Investor Facilitation Portal (IFP Gujarat)' : 'State Single Window System'),
    matches: (ctx) => Number(ctx.investmentLakh) <= 5000,
  },
  {
    code: 'SCH-04',
    name: 'ZED Certification & Clean Technology Subsidy',
    agency: 'Ministry of MSME',
    benefit: 'Up to 80% Subsidy on Clean Tech, Energy Audits & ZED Certification',
    eligibilityBasis: 'Eligible: Zero Defect Zero Effect (ZED) green process compliance',
    portal: 'MSME ZED Official Portal',
    matches: (ctx) => ctx.hazardous === true || ['textile', 'chemical', 'food'].includes(ctx.sector),
  },
];

export function evaluateEligibleSchemes(rawInput = {}) {
  const ctx = normalizeBusinessInput(rawInput);
  const matched = [];

  for (const entry of SCHEMES_CATALOG) {
    if (!entry.matches(ctx)) continue;
    matched.push({
      code: entry.code,
      name: entry.name,
      agency: typeof entry.getAgency === 'function' ? entry.getAgency(ctx) : entry.agency,
      benefit: entry.benefit,
      eligibilityBasis: entry.eligibilityBasis,
      portal: typeof entry.getPortal === 'function' ? entry.getPortal(ctx) : entry.portal,
    });
  }

  return matched;
}

// ── Statutory GeM / CPPP Government Tenders Catalog ─────────────────────────
export const TENDERS_CATALOG = [
  // Textile (sector === "textile")
  {
    code: 'TND-GJ-101',
    name: 'Supply of Fire-Retardant Industrial Cotton Uniforms & Fabric',
    buyer: 'Gujarat State Road Transport Corp (GSRTC) — GeM Portal',
    tenderValue: '₹42.50 Lakh',
    emdExemption: '100% MSE Exempt (Udyam Verified)',
    portalRef: 'GEM/2026/B/4829104',
    bidWindow: '21 Days Open',
    statutoryPreRequisite: 'Requires 100% Approved Factory, Fire Safety & GPCB Clearances',
    sector: 'textile',
    matches: (ctx) => ctx.sector === 'textile',
  },
  {
    code: 'TND-IN-102',
    name: 'Procurement of Institutional Bed Linen & Hospital Textiles',
    buyer: 'ESIC Model Hospitals Directorate (Ministry of Labour)',
    tenderValue: '₹68.00 Lakh',
    emdExemption: 'MSE Price Preference (15% Band)',
    portalRef: 'CPPP/2026/ESIC/8821',
    bidWindow: '30 Days Open',
    statutoryPreRequisite: 'Requires Valid Udyam, GST, EPF/ESIC & Boiler Compliance',
    sector: 'textile',
    matches: (ctx) => ctx.sector === 'textile',
  },

  // Food Processing (sector === "food")
  {
    code: 'TND-GJ-201',
    name: 'Supply of Fortified Edible Oil & Spices for Mid-Day Meal Scheme',
    buyer: 'Commissioner of Mid-Day Meals, Govt. of Gujarat',
    tenderValue: '₹85.00 Lakh',
    emdExemption: '100% MSE Exempt',
    portalRef: 'GEM/2026/B/5190231',
    bidWindow: '18 Days Open',
    statutoryPreRequisite: 'Requires Active FSSAI State Manufacturing Licence & SPCB Consent',
    sector: 'food',
    matches: (ctx) => ctx.sector === 'food',
  },
  {
    code: 'TND-IN-202',
    name: 'Empanelment of Processed Ration Suppliers for CAPF Canteens',
    buyer: 'Kendriya Police Kalyan Bhandar (Ministry of Home Affairs)',
    tenderValue: '₹1.20 Crore',
    emdExemption: 'MSE Turnover Relaxed',
    portalRef: 'CPPP/2026/MHA/3319',
    bidWindow: '25 Days Open',
    statutoryPreRequisite: 'Requires 100% Statutory Clearance & NABL Food Safety Audit',
    sector: 'food',
    matches: (ctx) => ctx.sector === 'food',
  },

  // Chemical / Hazardous (sector === "chemical" or hazardous === true)
  {
    code: 'TND-GJ-301',
    name: 'Supply of Water Treatment & Effluent Neutralization Chemicals',
    buyer: 'Gujarat Industrial Development Corporation (GIDC Water Supply)',
    tenderValue: '₹1.45 Crore',
    emdExemption: '100% MSE Exempt',
    portalRef: 'GEM/2026/B/6091822',
    bidWindow: '14 Days Open',
    statutoryPreRequisite: 'Requires Red-Category CTE/CTO & HOWM Hazardous Authorization',
    sector: 'chemical',
    matches: (ctx) => ctx.hazardous === true || ctx.sector === 'chemical',
  },
  {
    code: 'TND-IN-302',
    name: 'Industrial Specialty Solvents & Lab Reagents Rate Contract',
    buyer: 'ONGC Western Onshore Basin, Vadodara',
    tenderValue: '₹2.10 Crore',
    emdExemption: 'MSE Purchase Preference',
    portalRef: 'CPPP/2026/ONGC/7741',
    bidWindow: '28 Days Open',
    statutoryPreRequisite: 'Requires Chief Fire Officer NOC & DISH Factory Licence',
    sector: 'chemical',
    matches: (ctx) => ctx.hazardous === true || ctx.sector === 'chemical',
  },

  // Engineering / Manufacturing / Default
  {
    code: 'TND-IN-401',
    name: 'Supply of LT/HT Switchgear Enclosures & Precision Fabricated Parts',
    buyer: 'Dakshin Gujarat Vij Company Ltd. (DGVCL DISCOM)',
    tenderValue: '₹54.00 Lakh',
    emdExemption: '100% MSE Exempt',
    portalRef: 'GEM/2026/B/7120944',
    bidWindow: '20 Days Open',
    statutoryPreRequisite: 'Requires Factory Licence, DISCOM Sanction & Udyam Registration',
    sector: 'engineering',
    matches: (ctx) => ['engineering', 'manufacturing', 'electronics', 'pharma'].includes(ctx.sector),
  },
  {
    code: 'TND-IN-402',
    name: 'Rate Contract for Industrial Valves & Mechanical Assemblies',
    buyer: 'Indian Railways — Western Railway Workshop, Dahod',
    tenderValue: '₹92.00 Lakh',
    emdExemption: '100% MSE Exempt',
    portalRef: 'IREPS/2026/WR/1190',
    bidWindow: '24 Days Open',
    statutoryPreRequisite: 'Requires 100% Statutory Clearances & DISH Approval',
    sector: 'engineering',
    matches: (ctx) => ['engineering', 'manufacturing', 'electronics', 'pharma'].includes(ctx.sector),
  },
];

export function evaluateGovernmentTenders(businessInput = {}, approvalsList = []) {
  const ctx = normalizeBusinessInput(businessInput);

  let matched = TENDERS_CATALOG.filter((t) => t.matches(ctx));
  if (matched.length === 0) {
    matched = TENDERS_CATALOG.filter((t) => ['TND-IN-401', 'TND-IN-402'].includes(t.code));
  }

  const list = Array.isArray(approvalsList) ? approvalsList : [];
  const totalApprovals = list.length;
  const approvedList = list.filter((a) => a.status === 'approved');
  const approvedCount = approvedList.length;
  const pendingApprovals = list
    .filter((a) => a.status !== 'approved')
    .map((a) => ({ id: a.id || a.code, code: a.code || a.id, name: a.name, status: a.status || 'not_started' }));

  const isUnlocked = totalApprovals > 0 && approvedCount === totalApprovals;

  return {
    isUnlocked,
    totalApprovals,
    approvedCount,
    pendingCount: pendingApprovals.length,
    blockingApprovals: pendingApprovals,
    tenders: matched.map((t) => ({
      id: t.code,
      code: t.code,
      name: t.name,
      title: t.name,
      buyer: t.buyer,
      issuingAuthority: t.buyer,
      tenderValue: t.tenderValue,
      estimatedValue: t.tenderValue,
      emdExemption: t.emdExemption,
      portalRef: t.portalRef,
      portal: t.portalRef?.includes('GEM') ? 'GeM (Govt. e-Marketplace)' : (t.portalRef?.includes('IREPS') ? 'IREPS Railway Portal' : 'CPPP Central Portal'),
      bidWindow: t.bidWindow,
      bidWindowDays: parseInt(t.bidWindow, 10) || 21,
      statutoryPreRequisite: t.statutoryPreRequisite,
      prerequisite: t.statutoryPreRequisite,
      sector: t.sector,
    })),
  };
}

// Mapping for canonical demo IDs (req1..req7)
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
    const feeInfo = computeStatutoryFee(code, ctx);

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
      statutoryFeeInr: dynamicProps.statutoryFeeInr !== undefined ? dynamicProps.statutoryFeeInr : feeInfo.statutoryFeeInr,
      feeFormula: dynamicProps.feeFormula || feeInfo.feeFormula,
      rtpsActClause: 'Right to Public Services Act — Auto-Escalation & ₹250/day SLA Delay Liability',
    });
  }

  results.schemes = evaluateEligibleSchemes(rawInput);
  const criticalPath = calculateCriticalPath(results);
  results.criticalPath = criticalPath;
  results.totalStatutoryFeeInr = criticalPath.totalStatutoryFeeInr;
  results.estimatedDays = criticalPath.estimatedDays;
  results.tenderGate = evaluateGovernmentTenders(rawInput, results);

  return results;
}

export function generateApprovalsForBusiness(data) {
  return evaluateStatutoryApprovals(data, { preserveDemoIds: false });
}

export function deriveApprovalMetadata(app, state = 'Gujarat') {
  if (app.statutoryBasis && app.stage && app.formName && app.routing && app.statutoryFeeInr !== undefined) {
    return app;
  }
  const name = (app.name || '').toLowerCase();

  const catalogMatch = STATUTORY_CATALOG.find((item) =>
    item.keywords?.some((kw) => name.includes(kw))
  );

  let stage = app.stage || catalogMatch?.stage || 'Stage D: Industry-Specific Compliance';
  let formName = app.formName || catalogMatch?.formName || 'Standard CAF';
  let requirementType = app.requirementType || catalogMatch?.requirementType || 'BASE';
  let statutoryBasis = app.statutoryBasis || catalogMatch?.statutoryBasis || 'Statutory clearance under Indian Industrial Law';
  let routing = app.routing || getStatePortalBadge(state);

  const feeInfo = computeStatutoryFee(catalogMatch?.code || app.code, app);
  const statutoryFeeInr = app.statutoryFeeInr !== undefined ? app.statutoryFeeInr : feeInfo.statutoryFeeInr;
  const feeFormula = app.feeFormula || feeInfo.feeFormula;
  const rtpsActClause = app.rtpsActClause || 'Right to Public Services Act — Auto-Escalation & ₹250/day SLA Delay Liability';

  return { ...app, stage, formName, requirementType, statutoryBasis, routing, statutoryFeeInr, feeFormula, rtpsActClause };
}

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
  {
    sourceRef: 'GOV-14',
    name: 'Government Support & Subsidy Schemes (PMEGP, CGTMSE, State Subsidy)',
    department: 'MSME',
    slaDays: 15,
    docs: ['Udyam Registration Certificate', 'Detailed Project Report (DPR)', 'Bank Sanction Letter', 'Machinery Invoices'],
    keywords: ['subsidy', 'subsidies', 'scheme', 'schemes', 'loan', 'grant', 'grants', 'support', 'pmegp', 'cgtmse', 'chhut', 'yojana', 'interest subsidy', 'gov-14'],
    statutoryBasis: 'Credit Linked Capital Subsidy Scheme & State Industrial Policy',
  },
  {
    sourceRef: 'TND-15',
    name: 'GeM & CPPP Government Procurement / Tender Matchmaker',
    department: 'MSME',
    slaDays: 1,
    docs: ['Approved Statutory Licences & NOCs', 'Udyam Registration Certificate', 'GST Returns (GSTR-3B)', 'Audited Financial Statements'],
    keywords: ['tender', 'tenders', 'gem', 'procurement', 'bid', 'bids', 'bidding', 'contract', 'contracts', 'government order', 'cppp', 'tnd-15'],
    statutoryBasis: 'Public Procurement Policy for Micro and Small Enterprises (MSEs) Order, 2012 & GeM Special Provisions',
  },
];
