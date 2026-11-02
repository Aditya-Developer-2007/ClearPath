// ── ClearPath Indian Statutory Rule Engine (Single Source of Truth) ─────────
// Grounded in Indian Federal & State Regulatory Acts:
// - MSMED Act 2006, CGST Act 2017 & State PT Acts
// - State Fire Prevention & Life Safety Measures Acts & NBC 2016 Part-4
// - Water (Prevention & Control of Pollution) Act 1974 & Air Act 1981 (CPCB / SPCB)
// - The Factories Act, 1948 (Sections 2m & 6)
// - State Shops & Commercial Establishments Acts / CLRA 1970 / OSH Code
// - The Electricity Act, 2003 (Section 43) & CEA Safety Regulations, 2023
// - Food Safety & Standards Act, 2006 (Section 31 — FoSCoS)
// - Legal Metrology Act, 2009 (Section 24) & Packaged Commodities Rules 2011 (LMPC)
// - Hazardous & Other Wastes (M&TM) Rules, 2016 & MSIHC Rules, 1989
// - Petroleum Act, 1934 & SMPV(U) Rules, 2016 (PESO)
// - Drugs and Cosmetics Act, 1940 & Schedule M (CDSCO / State FDA)
// - E-Waste Management Rules, 2022 & BIS Act, 2016 (CPCB EPR)
// - Motor Vehicles Act, 1988 & CMVR Rule 126 (AIS-156 EV Homologation — ARAI/ICAT)
// - Indian Telegraph Act / Telecom Act, 2023 (DoT Saral Sanchar OSP)
// - Indian Boilers Act, 1923 (Section 7)
// - PMEGP, CGTMSE, National PLI & State Industrial Policy Subsidies
// - State Right to Public Services (RTPS) Acts (Gujarat Jan Seva, MAITRI, TG-iPASS, etc.)
// - Public Procurement Policy for MSEs Order, 2012 (GeM & CPPP Tenders)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATASET_PATH = path.join(__dirname, '../data/statutoryDataset.json');

// Load structured production dataset directly from server/data/statutoryDataset.json
const rawDataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));

// ── 1. Real Indian States & Single Window Systems (10 States) ───────────────
export const STATE_PORTALS = rawDataset.states;

export function resolveState(stateInput = '', cityInput = '') {
  const s = String(stateInput || '').toLowerCase().trim();
  const c = String(cityInput || '').toLowerCase().trim();

  // 1. Direct city match across portals
  for (const [stName, stConfig] of Object.entries(STATE_PORTALS)) {
    if (stConfig.cities.some((cityName) => c.includes(cityName.toLowerCase()) || cityName.toLowerCase() === c)) {
      return stName;
    }
  }

  // 2. Direct state name match
  for (const stName of Object.keys(STATE_PORTALS)) {
    const stLower = stName.toLowerCase();
    if (s.includes(stLower) || stLower.includes(s)) {
      return stName;
    }
  }

  // 3. Fallback heuristics for abbreviations / aliases
  if (s.includes('up') || s.includes('uttar')) return 'Uttar Pradesh';
  if (s.includes('mh') || s.includes('maharashtra') || c.includes('mumbai') || c.includes('pune')) return 'Maharashtra';
  if (s.includes('tn') || s.includes('tamil') || c.includes('chennai')) return 'Tamil Nadu';
  if (s.includes('ka') || s.includes('karnataka') || c.includes('bengaluru') || c.includes('bangalore')) return 'Karnataka';
  if (s.includes('tg') || s.includes('telangana') || c.includes('hyderabad')) return 'Telangana';
  if (s.includes('hr') || s.includes('haryana') || c.includes('gurgaon') || c.includes('gurugram')) return 'Haryana';
  if (s.includes('rj') || s.includes('rajasthan') || c.includes('jaipur')) return 'Rajasthan';
  if (s.includes('uk') || s.includes('uttarakhand') || c.includes('haridwar') || c.includes('dehradun')) return 'Uttarakhand';
  if (s.includes('dl') || s.includes('delhi')) return 'Delhi';

  return 'Gujarat';
}

export function getStatePortalBadge(state, city) {
  const normState = resolveState(state, city);
  const portal = STATE_PORTALS[normState];
  if (portal) {
    return `Routed via ${portal.portalName}`;
  }
  return 'Routed via National Single Window System (NSWS)';
}

export function getStateConfig(state, city) {
  const normState = resolveState(state, city);
  return STATE_PORTALS[normState] || STATE_PORTALS.Gujarat;
}

// ── 2. Booming Industrial Sectors Catalog (8 Booming Sectors) ───────────────
export const SECTORS_CATALOG = rawDataset.sectors;

export function normalizeBusinessInput(input = {}) {
  const rawSector = String(input.sector || '').toLowerCase().trim();
  let sector = 'textile';

  if (rawSector.includes('auto') || rawSector.includes('ev') || rawSector.includes('vehicle') || rawSector.includes('battery') || rawSector.includes('motor') || rawSector.includes('engineering')) {
    sector = 'automotive';
  } else if (rawSector.includes('elect') || rawSector.includes('pcb') || rawSector.includes('semiconductor') || rawSector.includes('chip') || rawSector.includes('hardware')) {
    sector = 'electronics';
  } else if (rawSector.includes('renew') || rawSector.includes('solar') || rawSector.includes('wind') || rawSector.includes('hydrogen') || rawSector.includes('clean energy')) {
    sector = 'renewable';
  } else if (rawSector.includes('pharma') || rawSector.includes('drug') || rawSector.includes('api') || rawSector.includes('biotech') || rawSector.includes('medicine')) {
    sector = 'pharma';
  } else if (rawSector.includes('chem') || rawSector.includes('solvent') || rawSector.includes('resin') || rawSector.includes('polymer')) {
    sector = 'chemical';
  } else if (rawSector.includes('food') || rawSector.includes('agro') || rawSector.includes('dairy') || rawSector.includes('spice') || rawSector.includes('cold chain') || rawSector.includes('beverage')) {
    sector = 'food';
  } else if (rawSector.includes('textile') || rawSector.includes('garment') || rawSector.includes('apparel') || rawSector.includes('fabric') || rawSector.includes('spinning') || rawSector.includes('yarn')) {
    sector = 'textile';
  } else if (rawSector.includes('data') || rawSector.includes('datacenter') || rawSector.includes('cloud') || rawSector.includes('server') || rawSector.includes('it infra')) {
    sector = 'datacenter';
  } else if (rawSector.includes('manuf')) {
    sector = 'electronics';
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

  const hazardous = input.hazardous === true || sector === 'chemical' || sector === 'pharma';

  const state = resolveState(input.state, input.city);
  const city = input.city || (state === 'Gujarat' ? 'Surat' : STATE_PORTALS[state]?.cities[0] || 'Industrial City');

  return {
    ...input,
    sector,
    state,
    city,
    investmentLakh,
    employees,
    hazardous,
  };
}


export function computeStatutoryFee(code, ctx = {}) {
  const emp = Number(ctx.employees) || 12;
  const haz = Boolean(ctx.hazardous);
  const _inv = Number(ctx.investmentLakh) || 30;

  switch (code) {
    case 'MSME-06':
      return {
        statutoryFeeInr: 0,
        feeFormula: 'Exempt — Statutory Free Portal under MSMED Act, 2006',
      };
    case 'FIN-07':
      return {
        statutoryFeeInr: 0,
        feeFormula: 'Statutory Zero Fee on GSTN & State Professional Tax Portal',
      };
    case 'FD-01': {
      const fee = haz ? 15000 : 7500;
      return {
        statutoryFeeInr: fee,
        feeFormula: haz
          ? '₹15,000 High-Risk / Chemical Hazard Scrutiny Cess'
          : '₹7,500 Standard Industrial Fire Safety Review Fee',
      };
    }
    case 'ENV-02': {
      if (ctx.sector === 'renewable' && !haz) {
        return {
          statutoryFeeInr: 0,
          feeFormula: 'Exempt — CPCB White Category Exemption Undertaking',
        };
      }
      if (['electronics', 'datacenter'].includes(ctx.sector) && !haz) {
        return {
          statutoryFeeInr: 2000,
          feeFormula: 'SPCB Green Category Expedited Consent Schedule',
        };
      }
      if (['automotive', 'food', 'textile'].includes(ctx.sector) && !haz) {
        return {
          statutoryFeeInr: 7500,
          feeFormula: 'SPCB Orange Category Consent Schedule (Investment <= ₹1 Cr)',
        };
      }
      return {
        statutoryFeeInr: 15000,
        feeFormula: 'SPCB Red Category Consent Schedule (Pollution Index >= 60)',
      };
    }
    case 'IND-03':
      return {
        statutoryFeeInr: emp <= 20 ? 4500 : 9000,
        feeFormula: emp <= 20
          ? 'Factories Act Schedule-I (<= 20 Workers Slab)'
          : 'Factories Act Schedule-I (> 20 Workers Slab)',
      };
    case 'LAB-04':
      if (emp < 10) {
        return {
          statutoryFeeInr: 1000,
          feeFormula: 'State Shops & Commercial Establishments Act (< 10 Workers)',
        };
      }
      if (emp >= 20) {
        return {
          statutoryFeeInr: 5000,
          feeFormula: 'Contract Labour (R&A) Act 1970 & OSH Code (>= 20 Workers)',
        };
      }
      return {
        statutoryFeeInr: 3000,
        feeFormula: 'Shram Suvidha Common Headcount Slab (10-19 Employees)',
      };
    case 'UTL-05':
      return {
        statutoryFeeInr: 6500,
        feeFormula: 'DISCOM LT/HT Industrial Application & Line Inspection Fee',
      };
    case 'BOIL-13':
      return {
        statutoryFeeInr: 6000,
        feeFormula: 'Indian Boilers Regulations Steam Rating & Inspection Slab',
      };
    case 'FSSAI-09':
      return {
        statutoryFeeInr: 5000,
        feeFormula: 'FoSCoS Schedule-3 State Food Manufacturing Licence Fee',
      };
    case 'LM-17':
      return {
        statutoryFeeInr: 2000,
        feeFormula: 'Legal Metrology Packaged Commodities (LMPC) Rule-27 Registration Fee',
      };
    case 'HAZ-11':
      return {
        statutoryFeeInr: 12000,
        feeFormula: 'HOWM Rules 2016 Authorization & TSDF Membership Scrutiny Fee',
      };
    case 'PESO-18':
      return {
        statutoryFeeInr: 10000,
        feeFormula: 'PESO Petroleum & Pressure Vessel Inspection Fee',
      };
    case 'DRUG-12':
      return {
        statutoryFeeInr: 15000,
        feeFormula: 'CDSCO / State FDA Schedule-M Manufacturing Inspection Fee',
      };
    case 'EPR-10':
      return {
        statutoryFeeInr: 8000,
        feeFormula: 'CPCB EPR Portal Producer Responsibility Scrutiny Fee',
      };
    case 'AUTO-14':
      return {
        statutoryFeeInr: 12500,
        feeFormula: 'ARAI / ICAT Type Homologation & AIS-156 EV Testing Cess',
      };
    case 'REN-15':
      return {
        statutoryFeeInr: 7500,
        feeFormula: 'CEIG Energisation & MNRE ALMM Grid Connectivity Inspection Fee',
      };
    case 'DC-19':
      return {
        statutoryFeeInr: 10000,
        feeFormula: 'DoT Saral Sanchar OSP & High-Capacity DG Acoustic Scrutiny Fee',
      };
    default:
      return {
        statutoryFeeInr: 3500,
        feeFormula: 'Standard Statutory Scrutiny Fee',
      };
  }
}

// ── 4. Critical-Path SLA & Fee Turnaround Summary ───────────────────────────
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

// ── 4b. Urgency Scoring ─────────────────────────────────────────────────────
export function computeUrgencyScore(item) {
  if (!item || ['approved', 'rejected'].includes(item.status)) return 0;
  const now = Date.now();
  const deadline = item.slaDeadline ? new Date(item.slaDeadline).getTime() : now + 30 * 86400000;
  const diffDays = Math.ceil((deadline - now) / 86400000);
  const isOverdue = diffDays < 0;

  if (isOverdue && item.escalated) return 100;
  if (isOverdue) return 90;
  if (item.escalated) return 80;
  if (diffDays <= 1) return 70;
  if (diffDays <= 2) return 60;
  if (item.riskTier === 'high') return 55;
  return Math.max(10, 50 - diffDays);
}

// ── 5. Complete Statutory Approvals Catalog (Hydrated from Dataset) ─────────
export const STATUTORY_CATALOG = rawDataset.approvalsCatalog.map((item) => {
  const code = item.code;
  const rule = item.rule || {};

  const matches = (ctx) => {
    if (rule.always) return true;
    if (rule.maxInvestmentLakh !== undefined && Number(ctx.investmentLakh) > rule.maxInvestmentLakh) return false;
    if (rule.minInvestmentLakh !== undefined && Number(ctx.investmentLakh) < rule.minInvestmentLakh) return false;
    if (rule.minEmployees !== undefined && Number(ctx.employees) < rule.minEmployees) return false;
    if (rule.sectors && !rule.sectors.includes(ctx.sector)) return false;
    if (rule.hazardousOrSectors && !ctx.hazardous && !rule.hazardousOrSectors.includes(ctx.sector)) return false;
    if (rule.excludeSectorIfInvestmentUnder) {
      if (ctx.sector === rule.excludeSectorIfInvestmentUnder.sector && Number(ctx.investmentLakh) < rule.excludeSectorIfInvestmentUnder.minInvestmentLakh) {
        return false;
      }
    }
    if (rule.orHazardousMinInvestment !== undefined) {
      const match1 = rule.sector && ctx.sector === rule.sector;
      const match2 = ctx.hazardous && Number(ctx.investmentLakh) >= rule.orHazardousMinInvestment;
      return match1 || match2;
    }
    if (rule.sector && ctx.sector !== rule.sector) return false;
    return true;
  };

  let dynamic = undefined;
  if (code === 'ENV-02' && item.dynamicVariants) {
    dynamic = (ctx) => {
      if (['pharma', 'chemical'].includes(ctx.sector) || ctx.hazardous === true) {
        return item.dynamicVariants.red;
      }
      if (['automotive', 'food', 'textile'].includes(ctx.sector)) {
        return item.dynamicVariants.orange;
      }
      if (['electronics', 'datacenter'].includes(ctx.sector)) {
        return item.dynamicVariants.green;
      }
      return item.dynamicVariants.white;
    };
  } else if (code === 'LAB-04' && item.dynamicVariants) {
    dynamic = (ctx) => {
      const emp = Number(ctx.employees);
      if (emp < 10) return item.dynamicVariants.under10;
      if (emp >= 20) return item.dynamicVariants.over20;
      return item.dynamicVariants.standard;
    };
  }

  const getRiskTier = item.riskTierHazardous
    ? (ctx) => (ctx.hazardous ? item.riskTierHazardous : item.riskTier)
    : undefined;

  return {
    ...item,
    matches,
    dynamic,
    getRiskTier,
  };
});

// ── 6. Expanded Statutory Government Support & Subsidy Schemes (Hydrated) ───
export const SCHEMES_CATALOG = rawDataset.subsidiesCatalog.map((item) => {
  const rule = item.rule || {};

  const matches = (ctx) => {
    if (rule.maxInvestmentLakh !== undefined && Number(ctx.investmentLakh) > rule.maxInvestmentLakh) return false;
    if (rule.minInvestmentLakh !== undefined && Number(ctx.investmentLakh) < rule.minInvestmentLakh) return false;
    if (rule.sectors && !rule.sectors.includes(ctx.sector)) return false;
    if (rule.hazardousOrSectors && !ctx.hazardous && !rule.hazardousOrSectors.includes(ctx.sector)) return false;
    return true;
  };

  const getAgency = item.agencyTemplate
    ? (ctx) => item.agencyTemplate.replace('{state}', ctx.state)
    : undefined;

  const getPortal = item.portalTemplate
    ? (ctx) => STATE_PORTALS[ctx.state]?.portalName || 'State Single Window System'
    : undefined;

  return {
    ...item,
    matches,
    getAgency,
    getPortal,
  };
});

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

// ── 7. Statutory GeM & CPPP Government Tenders Catalog (Hydrated) ───────────
export const TENDERS_CATALOG = rawDataset.tendersCatalog.map((item) => ({
  ...item,
  matches: (ctx) => ctx.sector === item.sector,
}));

export function evaluateGovernmentTenders(businessInput = {}, approvalsList = []) {
  const ctx = normalizeBusinessInput(businessInput);

  let matched = TENDERS_CATALOG.filter((t) => t.matches(ctx));
  if (matched.length === 0) {
    matched = TENDERS_CATALOG.slice(0, 2);
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

// ── 8. Deterministic NLP Intent & Sector Classifier ─────────────────────────
export function classifyBusinessIntent(text = '') {
  const lower = (text || '').toLowerCase();

  // 1. Sector Classification with confidence scoring
  let sector = null;
  let classificationConfidence = 0.5;

  const sectorMatches = [];
  for (const s of SECTORS_CATALOG) {
    let score = 0;
    for (const kw of s.keywords) {
      if (lower.includes(kw)) {
        score += kw.length > 5 ? 2 : 1;
      }
    }
    if (score > 0) {
      sectorMatches.push({ sector: s.id, score });
    }
  }

  sectorMatches.sort((a, b) => b.score - a.score);
  if (sectorMatches.length > 0) {
    sector = sectorMatches[0].sector;
    classificationConfidence = Math.min(0.98, 0.7 + sectorMatches[0].score * 0.08);
  } else {
    sector = 'textile';
    classificationConfidence = 0.5;
  }

  // 2. Stage
  let stage = 'New';
  if (/(starting|start|new|open|setting up|shuru|kholna|kholni|setup)/i.test(lower)) {
    stage = 'New';
  } else if (/(expand|expansion|badhana)/i.test(lower)) {
    stage = 'Expansion';
  } else if (/(renew|renewal)/i.test(lower)) {
    stage = 'Renewal';
  }

  // 3. City & State (Cross-match against 10 Indian states)
  let city = null;
  let state = null;
  for (const [stName, stConfig] of Object.entries(STATE_PORTALS)) {
    for (const c of stConfig.cities) {
      if (lower.includes(c.toLowerCase())) {
        city = c;
        state = stName;
        break;
      }
    }
    if (city) break;
  }
  if (!city) {
    for (const stName of Object.keys(STATE_PORTALS)) {
      if (lower.includes(stName.toLowerCase())) {
        state = stName;
        city = STATE_PORTALS[stName].cities[0];
        break;
      }
    }
  }
  if (!state) {
    state = 'Gujarat';
    city = 'Surat';
  }

  // 4. Investment
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
  if (investmentLakh === null) investmentLakh = 30;

  // 5. Employees
  let employees = null;
  const workerMatch = lower.match(/(\d+)\s*(?:workers|worker|employees|employee|people|log|staff|shramik|karmachari)\b/i);
  if (workerMatch) {
    employees = parseInt(workerMatch[1], 10);
  }
  if (employees === null) employees = 12;

  // 6. Hazardous
  const isSectorHazardous = ['chemical', 'pharma'].includes(sector);
  const hazardous = isSectorHazardous || lower.includes('hazard') || lower.includes('chemical') || lower.includes('toxic') || lower.includes('acid');

  return {
    sector,
    state,
    city,
    investmentLakh,
    employees,
    hazardous,
    stage,
    classificationConfidence: parseFloat(classificationConfidence.toFixed(2)),
  };
}

// ── 9. Statutory Approvals Evaluator (Single Source of Truth) ───────────────
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
  const routing = getStatePortalBadge(ctx.state, ctx.city);
  const stateConfig = getStateConfig(ctx.state, ctx.city);

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
      rtpsActClause: `${stateConfig.rtpsAct} — Auto-Escalation & ${stateConfig.rtpsPenalty} SLA Delay Liability`,
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
  const stateConfig = getStateConfig(state);
  const rtpsActClause = app.rtpsActClause || `${stateConfig.rtpsAct} — Auto-Escalation & ${stateConfig.rtpsPenalty} SLA Delay Liability`;

  return { ...app, stage, formName, requirementType, statutoryBasis, routing, statutoryFeeInr, feeFormula, rtpsActClause };
}

// ── 10. AI Assistant Knowledge Base (8 Booming Sectors) ──────────────────────
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
    name: 'Government Support & Subsidy Schemes (PMEGP, CGTMSE, State Subsidy, PLI)',
    department: 'MSME',
    slaDays: 15,
    docs: ['Udyam Registration Certificate', 'Detailed Project Report (DPR)', 'Bank Sanction Letter', 'Machinery Invoices'],
    keywords: ['subsidy', 'subsidies', 'scheme', 'schemes', 'loan', 'grant', 'grants', 'support', 'pmegp', 'cgtmse', 'pli', 'chhut', 'yojana', 'interest subsidy', 'gov-14'],
    statutoryBasis: 'Credit Linked Capital Subsidy Scheme, PLI Scheme & State Industrial Policy',
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
