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

// ── 1. Real Indian States & Single Window Systems (10 States) ───────────────
export const STATE_PORTALS = {
  Gujarat: {
    state: 'Gujarat',
    portalName: 'Investor Facilitation Portal (IFP Gujarat)',
    spcb: 'Gujarat Pollution Control Board (GPCB)',
    discom: 'DGVCL / MGVCL / UGVCL / PGVCL',
    rtpsAct: 'Gujarat Jan Seva Act, 2013',
    rtpsPenalty: '₹250/day',
    rtpsPenaltyPerDay: 250,
    cities: ['Surat', 'Ahmedabad', 'Vadodara', 'Rajkot', 'Ankleshwar', 'Sanand', 'Vapi', 'Bharuch', 'Dahej'],
  },
  Maharashtra: {
    state: 'Maharashtra',
    portalName: 'MAITRI 2.0 Single Window',
    spcb: 'Maharashtra Pollution Control Board (MPCB)',
    discom: 'MSEDCL (Mahavitaran)',
    rtpsAct: 'Maharashtra Right to Public Services Act, 2015',
    rtpsPenalty: '₹500/day',
    rtpsPenaltyPerDay: 500,
    cities: ['Mumbai', 'Pune', 'Chakan', 'Nashik', 'Aurangabad', 'Nagpur'],
  },
  Delhi: {
    state: 'Delhi',
    portalName: 'Delhi Single Window System',
    spcb: 'Delhi Pollution Control Committee (DPCC)',
    discom: 'BSES Rajdhani / BSES Yamuna / TPDDL',
    rtpsAct: 'Delhi Right to Citizen Services Act, 2011',
    rtpsPenalty: '₹200/day',
    rtpsPenaltyPerDay: 200,
    cities: ['New Delhi', 'Delhi', 'Okhla', 'Bawana', 'Narela'],
  },
  'Uttar Pradesh': {
    state: 'Uttar Pradesh',
    portalName: 'Nivesh Mitra 3.0',
    spcb: 'Uttar Pradesh Pollution Control Board (UPPCB)',
    discom: 'UPPCL / PVVNL / MVVNL',
    rtpsAct: 'UP Janhit Guarantee Act, 2011',
    rtpsPenalty: '₹250/day',
    rtpsPenaltyPerDay: 250,
    cities: ['Noida', 'Greater Noida', 'Ghaziabad', 'Lucknow', 'Kanpur'],
  },
  'Tamil Nadu': {
    state: 'Tamil Nadu',
    portalName: 'TNSWP Single Window',
    spcb: 'Tamil Nadu Pollution Control Board (TNPCB)',
    discom: 'TANGEDCO',
    rtpsAct: 'Tamil Nadu Business Facilitation Act, 2018',
    rtpsPenalty: '₹250/day',
    rtpsPenaltyPerDay: 250,
    cities: ['Chennai', 'Coimbatore', 'Hosur', 'Tiruppur', 'Sriperumbudur'],
  },
  Karnataka: {
    state: 'Karnataka',
    portalName: 'Karnataka Udyog Mitra',
    spcb: 'Karnataka State Pollution Control Board (KSPCB)',
    discom: 'BESCOM / MESCOM / HESCOM',
    rtpsAct: 'Karnataka Sakala Services Act, 2011',
    rtpsPenalty: '₹200/day',
    rtpsPenaltyPerDay: 200,
    cities: ['Bengaluru', 'Bangalore', 'Peenya', 'Mysuru', 'Mysore', 'Hubballi', 'Hubli'],
  },
  Telangana: {
    state: 'Telangana',
    portalName: 'TG-iPASS',
    spcb: 'Telangana State Pollution Control Board (TGPCB)',
    discom: 'TSSPDCL / TSNPDCL',
    rtpsAct: 'Telangana Industrial Project Approval & Self-Certification System (TG-iPASS) Act, 2014',
    rtpsPenalty: '₹1,000/day',
    rtpsPenaltyPerDay: 1000,
    cities: ['Hyderabad', 'Genome Valley', 'Warangal'],
  },
  Haryana: {
    state: 'Haryana',
    portalName: 'HEPC Single Window',
    spcb: 'Haryana State Pollution Control Board (HSPCB)',
    discom: 'DHBVN / UHBVN',
    rtpsAct: 'Haryana Right to Service Act, 2014',
    rtpsPenalty: '₹250/day',
    rtpsPenaltyPerDay: 250,
    cities: ['Gurugram', 'Gurgaon', 'Manesar', 'Faridabad', 'Panipat'],
  },
  Rajasthan: {
    state: 'Rajasthan',
    portalName: 'RajNivesh',
    spcb: 'Rajasthan State Pollution Control Board (RSPCB)',
    discom: 'JVVNL / AVVNL / JdVVNL',
    rtpsAct: 'Rajasthan Guaranteed Delivery of Public Services Act, 2011',
    rtpsPenalty: '₹250/day',
    rtpsPenaltyPerDay: 250,
    cities: ['Jaipur', 'Bhiwadi', 'Neemrana', 'Kota'],
  },
  Uttarakhand: {
    state: 'Uttarakhand',
    portalName: 'Invest Uttarakhand CAF',
    spcb: 'Uttarakhand Pollution Control Board (UKPCB)',
    discom: 'UPCL',
    rtpsAct: 'Uttarakhand Right to Service Act, 2011',
    rtpsPenalty: '₹250/day',
    rtpsPenaltyPerDay: 250,
    cities: ['Haridwar', 'Pantnagar', 'Dehradun', 'Haldwani', 'Rudrapur'],
  },
};

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
export const SECTORS_CATALOG = [
  {
    id: 'automotive',
    name: 'Automobile, EV & Battery Assembly',
    nicCode: '2910',
    cpcbCategory: 'Orange',
    description: 'Electric vehicles, battery pack integration, auto components, chassis and precision powertrain manufacturing',
    keywords: ['automotive', 'automobile', 'auto', 'ev', 'electric vehicle', 'battery', 'lithium', 'chassis', 'motor', 'vehicle', 'car', 'bike', 'scooter', 'powertrain', 'gadi', 'gaadi', 'engineering'],
    defaultHazardous: false,
  },
  {
    id: 'electronics',
    name: 'Electronics, PCB & Semiconductor Assembly',
    nicCode: '2610',
    cpcbCategory: 'Green',
    description: 'Printed circuit board (PCB) assembly, semiconductor packaging, SMT lines, IoT devices and consumer hardware',
    keywords: ['electronics', 'electronic', 'pcb', 'semiconductor', 'chip', 'smt', 'iot', 'hardware', 'sensors', 'circuit', 'microcontroller', 'manufacturing'],
    defaultHazardous: false,
  },
  {
    id: 'renewable',
    name: 'Renewable Energy, Solar PV & Green Hydrogen',
    nicCode: '2710',
    cpcbCategory: 'White',
    description: 'Solar photovoltaic module fabrication, wind turbine sub-assemblies, green hydrogen electrolyzers and clean energy systems',
    keywords: ['renewable', 'solar', 'solar pv', 'photovoltaic', 'wind', 'green hydrogen', 'hydrogen', 'clean tech', 'clean energy', 'panel', 'electrolyzer'],
    defaultHazardous: false,
  },
  {
    id: 'pharma',
    name: 'Pharmaceuticals, Bulk Drugs (API) & Biotech',
    nicCode: '2100',
    cpcbCategory: 'Red',
    description: 'Active Pharmaceutical Ingredients (API), bulk drug syntheses, formulation oral solids/injectables and biological therapeutics',
    keywords: ['pharma', 'pharmaceuticals', 'pharmaceutical', 'bulk drug', 'api', 'medicine', 'biotech', 'biotechnology', 'drug', 'formulation', 'tablet', 'syrup', 'dawa', 'dawakhana', 'vaccine'],
    defaultHazardous: true,
  },
  {
    id: 'chemical',
    name: 'Specialty Chemicals, Petrochemicals & Solvents',
    nicCode: '2011',
    cpcbCategory: 'Red',
    description: 'Organic specialty intermediates, industrial solvents, fine chemical syntheses, polymers and resins',
    keywords: ['chemical', 'chemicals', 'specialty chemicals', 'petrochemical', 'solvent', 'acid', 'polymer', 'resin', 'paint', 'dye', 'pigment', 'distillation'],
    defaultHazardous: true,
  },
  {
    id: 'food',
    name: 'Food Processing, Cold Chain & Agro-Tech',
    nicCode: '1010',
    cpcbCategory: 'Orange',
    description: 'Commercial packaged foods, edible oil refineries, spice processing, dairy manufacturing and integrated cold-chain logistics',
    keywords: ['food', 'food processing', 'agro', 'agro-tech', 'cold chain', 'cold storage', 'dairy', 'spice', 'edible oil', 'beverage', 'khana', 'flour', 'grains', 'biscuit', 'bakery'],
    defaultHazardous: false,
  },
  {
    id: 'textile',
    name: 'Textiles, Apparel & Technical Textiles',
    nicCode: '1311',
    cpcbCategory: 'Orange',
    description: 'Powerloom weaving, circular knitting, synthetic filament yarn processing, apparel garmenting and geotextiles',
    keywords: ['textile', 'textiles', 'apparel', 'garment', 'garments', 'fabric', 'cotton', 'spinning', 'weaving', 'yarn', 'dyeing', 'kapda', 'powerloom', 'surat textile'],
    defaultHazardous: false,
  },
  {
    id: 'datacenter',
    name: 'IT Infrastructure, Cloud & Hyperscale Data Centers',
    nicCode: '6311',
    cpcbCategory: 'Green',
    description: 'Enterprise data halls, server rack colocation, high-availability cloud infrastructure and optical network telecommunications',
    keywords: ['datacenter', 'data center', 'cloud', 'server', 'rack', 'hyperscale', 'hosting', 'colocation', 'it infra', 'telecom', 'telecommunications', 'compute'],
    defaultHazardous: false,
  },
];

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

  // Specialty chemical & Pharma are CPCB Red / auto-hazardous
  const hazardous = input.hazardous === true || sector === 'chemical' || sector === 'pharma';

  const state = resolveState(input.state, input.city);
  const city = input.city || (state === 'Gujarat' ? 'Surat' : STATE_PORTALS[state]?.cities[0] || 'Industrial City');

  return {
    ...input,
    sector,
    employees,
    investmentLakh,
    hazardous,
    state,
    city,
    stage: input.stage || 'New',
  };
}

// ── 3. Dynamic Statutory Fee Calculator ───────────────────────────────────────
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

// ── 5. Complete Statutory Approvals Catalog (17 Clearances) ─────────────────
export const STATUTORY_CATALOG = [
  // ── BASE CLEARANCES ───────────────────────────────────────────────────────
  {
    code: 'MSME-06',
    name: 'Udyam MSME Registration',
    department: 'MSME',
    stage: 'Stage A: Zero-to-land / Premises Stage',
    formName: 'Udyam Portal Annex-I',
    slaDays: 3,
    riskTier: 'low',
    needsInspection: false,
    requirementType: 'BASE',
    statutoryBasis: 'MSMED Act, 2006 Sec 8 — Mandatory baseline MSME classification',
    docs: ['Aadhaar of Promoter', 'Business PAN Card', 'Bank Account Proof'],
    keywords: ['udyam', 'msme', 'small business', 'aadhaar', 'pan', 'msme-06'],
    matches: (ctx) => Number(ctx.investmentLakh) <= 5000,
  },
  {
    code: 'FIN-07',
    name: 'GST & State Professional Tax Registration',
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
    statutoryBasis: 'State Fire Prevention Act & NBC 2016 Part-4 — Industrial Fire Load Norms',
    docs: ['Fire Safety Plan', 'Building Layout Plan', 'Lease Deed'],
    keywords: ['fire', 'noc', 'fire safety', 'aag', 'fd-01', 'chief fire officer'],
    matches: (ctx) => ctx.sector !== 'renewable' || Number(ctx.investmentLakh) >= 25,
  },
  {
    code: 'ENV-02',
    department: 'Environment',
    stage: 'Stage B: Pre-construction / Construction Stage',
    requirementType: 'BASE',
    docs: ['Process Flow Diagram', 'Effluent / Air Emission Plan', 'Site Plan & Lease Deed'],
    keywords: ['pollution', 'environment', 'consent', 'cte', 'cto', 'gpcb', 'mpcb', 'uppcb', 'spcb', 'env-02'],
    matches: () => true,
    dynamic: (ctx) => {
      if (['pharma', 'chemical'].includes(ctx.sector) || ctx.hazardous === true) {
        return {
          name: 'Pollution Consent (CTE — Red Category)',
          slaDays: 30,
          riskTier: 'high',
          needsInspection: true,
          formName: 'SPCB Form-I (Red Category — PI >= 60)',
          statutoryBasis: 'Water Act 1974 Sec 25 & Air Act 1981 Sec 21 — CPCB Red Category (PI >= 60)',
        };
      }
      if (['automotive', 'food', 'textile'].includes(ctx.sector)) {
        return {
          name: 'Pollution Consent (CTE — Orange Category)',
          slaDays: 21,
          riskTier: 'medium',
          needsInspection: true,
          formName: 'SPCB Form-I (Orange Category — PI 41-59)',
          statutoryBasis: 'Water Act 1974 & Air Act 1981 — CPCB Orange Category (PI 41-59)',
        };
      }
      if (['electronics', 'datacenter'].includes(ctx.sector)) {
        return {
          name: 'Pollution Consent (CTE — Green Category)',
          slaDays: 15,
          riskTier: 'low',
          needsInspection: false,
          formName: 'SPCB Green Consent Form',
          statutoryBasis: 'CPCB Green Category — Low Pollution Assembly Norms',
        };
      }
      return {
        name: 'CPCB White Category Exemption Intimation',
        slaDays: 3,
        riskTier: 'low',
        needsInspection: false,
        formName: 'SPCB White Undertaking',
        statutoryBasis: 'CPCB White Category Exemption — Non-Polluting Clean Energy',
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
    statutoryBasis: 'The Factories Act, 1948 Sec 2(m)(i) & Sec 6 — Manufacturing with Power (>=10 Workers)',
    docs: ['Factory Layout Blueprint', 'Machinery Horsepower Schedule', 'Stability Certificate'],
    keywords: ['factory', 'licence', 'license', 'industrial', 'dish', 'machinery', 'karkhana', 'ind-03'],
    matches: (ctx) => Number(ctx.employees) >= 10,
  },
  {
    code: 'LAB-04',
    department: 'Labour',
    stage: 'Stage C: Commissioning / Pre-operation Stage',
    needsInspection: false,
    requirementType: 'BASE',
    docs: ['Employee Muster Roll', 'Employer PAN & Address Proof', 'Partnership / Incorporation Deed'],
    keywords: ['labour', 'labor', 'worker', 'workers', 'shramik', 'karmachari', 'log', 'lab-04', 'shop', 'establishment', 'clra', 'epf', 'esic'],
    matches: () => true,
    dynamic: (ctx) => {
      const emp = Number(ctx.employees);
      if (emp < 10) {
        return {
          name: 'Shop & Establishment Registration',
          slaDays: 7,
          riskTier: 'low',
          formName: 'Labour Form-A',
          statutoryBasis: 'State Shops & Commercial Establishments Act — < 10 Workers (Exempt from Factories Act)',
        };
      }
      if (emp >= 20) {
        return {
          name: 'Principal Employer & Contract Labour (CLRA) Registration',
          slaDays: 15,
          riskTier: 'medium',
          formName: 'CLRA Form-I / OSH Code',
          statutoryBasis: 'Contract Labour (R&A) Act, 1970 & OSH Code — >= 20 Workers',
        };
      }
      return {
        name: 'Labour Welfare & EPF/ESIC Registration',
        slaDays: 10,
        riskTier: 'low',
        formName: 'Shram Suvidha Common Form',
        statutoryBasis: 'ESIC Act, 1948 & EPF Act, 1952 — 10 to 19 Employees',
      };
    },
  },
  {
    code: 'UTL-05',
    name: 'HT / LT Industrial Power & DISCOM Sanction',
    department: 'Utilities',
    stage: 'Stage C: Commissioning / Pre-operation Stage',
    formName: 'DISCOM LT/HT Form-1',
    slaDays: 15,
    riskTier: 'low',
    needsInspection: true,
    requirementType: 'BASE',
    statutoryBasis: 'Electricity Act, 2003 Sec 43 — Industrial Connected Load Sanction',
    docs: ['Electrical Load Calculation Sheet', 'Test Report from Licensed Electrical Contractor', 'Premises Ownership / Lease Deed'],
    keywords: ['electricity', 'power', 'bijli', 'connection', 'utility', 'load', 'discom', 'utl-05'],
    matches: () => true,
  },

  // ── SECTOR-SPECIFIC STATUTORY CLEARANCES ──────────────────────────────────
  {
    code: 'BOIL-13',
    name: 'Industrial Boiler & Steam Pipeline Registration',
    department: 'Industrial',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'Boiler Form-B & Steam Line Plan',
    slaDays: 21,
    riskTier: 'medium',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Indian Boilers Act, 1923 Sec 7 — Steam Generation Vessels',
    docs: ['Boiler Maker Certificate', 'Welder Qualification Record', 'Hydraulic Test Certificate'],
    keywords: ['boiler', 'steam', 'steam vessel', 'pressure vessel', 'boil-13'],
    matches: (ctx) => ctx.sector === 'textile' && Number(ctx.investmentLakh) >= 25,
  },
  {
    code: 'FSSAI-09',
    name: 'FSSAI State / Central Food Manufacturing Licence',
    department: 'Safety',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'FoSCoS Form-B',
    slaDays: 21,
    riskTier: 'medium',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Food Safety and Standards Act, 2006 Sec 31 — Food Manufacturing Licence',
    docs: ['Food Safety Management System (FSMS) Plan', 'Water Potability Test Report', 'List of Food Categories & Equipment'],
    keywords: ['fssai', 'food', 'khana', 'edible', 'foscos', 'fssai-09'],
    matches: (ctx) => ctx.sector === 'food',
  },
  {
    code: 'LM-17',
    name: 'Legal Metrology Packaged Commodities (LMPC) Registration',
    department: 'Safety',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'LMPC Rule-27',
    slaDays: 15,
    riskTier: 'low',
    needsInspection: false,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Legal Metrology Act, 2009 Sec 24 & Rules 2011 — Pre-packaged Commodities Norms',
    docs: ['Label Specimen & Mandatory Declarations', 'Weight & Measurement Calibration Certificate', 'Entity Registration Proof'],
    keywords: ['legal metrology', 'lmpc', 'packaging', 'packaged', 'weights', 'measures', 'lm-17'],
    matches: (ctx) => ['food', 'pharma', 'electronics'].includes(ctx.sector),
  },
  {
    code: 'HAZ-11',
    name: 'Hazardous Waste & Chemical Storage Authorization',
    department: 'Environment',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'HOWM Form-1',
    slaDays: 30,
    riskTier: 'high',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'HOWM Rules, 2016 & MSIHC Rules, 1989 — Hazardous Chemical Protocol',
    docs: ['Emergency Response Plan', 'Hazardous Waste Generation & Storage Protocol', 'TSDF Membership Certificate'],
    keywords: ['hazardous', 'chemical', 'toxic', 'waste', 'hazmat', 'msihc', 'howm', 'haz-11'],
    matches: (ctx) => ctx.hazardous === true || ['chemical', 'pharma', 'automotive'].includes(ctx.sector),
  },
  {
    code: 'PESO-18',
    name: 'PESO Petroleum, Solvent & Pressure Vessel Licence',
    department: 'Safety',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'PESO Form-XV',
    slaDays: 30,
    riskTier: 'high',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Petroleum Act, 1934 & SMPV(U) Rules, 2016 — Petroleum & Solvent Storage',
    docs: ['PESO Approved Storage Layout', 'Fabrication & Hydrostatic Test Certificate', 'Site Safety Distance Verification'],
    keywords: ['peso', 'petroleum', 'solvent', 'pressure vessel', 'smpv', 'flammable', 'peso-18'],
    matches: (ctx) => ctx.sector === 'chemical' || (ctx.hazardous === true && Number(ctx.investmentLakh) >= 50),
  },
  {
    code: 'DRUG-12',
    name: 'CDSCO / State FDA Schedule-M Drug Manufacturing Licence',
    department: 'Safety',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'CDSCO Form-25 / Form-28',
    slaDays: 45,
    riskTier: 'high',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Drugs and Cosmetics Act, 1940 Sec 18 & Schedule M — GMP Compliance',
    docs: ['Site Master File (SMF)', 'HVAC Validation & Cleanroom Blueprint', 'Approved Technical Personnel Dossier'],
    keywords: ['cdsco', 'fda', 'drug', 'pharma', 'schedule m', 'gmp', 'medicine', 'drug-12'],
    matches: (ctx) => ctx.sector === 'pharma',
  },
  {
    code: 'EPR-10',
    name: 'CPCB E-Waste / Battery / Plastic EPR Registration & BIS CRS',
    department: 'Environment',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'CPCB EPR Form-1',
    slaDays: 21,
    riskTier: 'medium',
    needsInspection: false,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'E-Waste Management Rules, 2022 & BIS Act, 2016 — Producer Responsibility',
    docs: ['Extended Producer Responsibility (EPR) Plan', 'Recycler Tie-Up Agreement', 'BIS Compulsory Registration Certificate'],
    keywords: ['epr', 'e-waste', 'battery epr', 'plastic epr', 'bis', 'crs', 'cpcb epr', 'epr-10'],
    matches: (ctx) => ['electronics', 'automotive'].includes(ctx.sector),
  },
  {
    code: 'AUTO-14',
    name: 'CMVR / AIS-156 EV & Auto Component Type Homologation',
    department: 'Industrial',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'AIS-156 / CMVR Type Approval',
    slaDays: 30,
    riskTier: 'medium',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Motor Vehicles Act, 1988 & CMVR Rule 126 — ARAI / ICAT Type Approval',
    docs: ['Automotive / EV Component Specification Sheet', 'ARAI / ICAT Type Approval Certificate', 'Quality Management ISO-9001 Certificate'],
    keywords: ['cmvr', 'ais-156', 'ev homologation', 'arai', 'icat', 'automotive type approval', 'auto-14'],
    matches: (ctx) => ctx.sector === 'automotive',
  },
  {
    code: 'REN-15',
    name: 'CEIG Energisation & MNRE ALMM / Grid Connectivity Sanction',
    department: 'Utilities',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'CEIG Reg-43 & Grid Form-G1',
    slaDays: 21,
    riskTier: 'medium',
    needsInspection: true,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'CEA Safety Regulations, 2023 & Electricity Act Sec 7 — Grid Synchronization',
    docs: ['Single Line Diagram (SLD) & Protection Scheme', 'Chief Electrical Inspector (CEIG) Safety Clearance', 'MNRE ALMM Enlistment Proof'],
    keywords: ['ceig', 'energisation', 'mnre', 'almm', 'solar grid', 'grid connectivity', 'ren-15'],
    matches: (ctx) => ctx.sector === 'renewable',
  },
  {
    code: 'DC-19',
    name: 'DoT Infrastructure Provider / OSP & High-Capacity DG Acoustic Approval',
    department: 'Utilities',
    stage: 'Stage D: Industry-Specific Compliance',
    formName: 'Saral Sanchar OSP-I & CEIG DG',
    slaDays: 21,
    riskTier: 'low',
    needsInspection: false,
    requirementType: 'IF APPLICABLE',
    statutoryBasis: 'Indian Telegraph Act / Telecom Act, 2023 & CPCB DG Set Norms',
    docs: ['DoT Saral Sanchar Registration Dossier', 'CPCB DG Acoustic Enclosure Certification', 'Dual-Feed Redundancy Power Architecture'],
    keywords: ['dot', 'osp', 'saral sanchar', 'data center permission', 'hyperscale', 'dg acoustic', 'dc-19'],
    matches: (ctx) => ctx.sector === 'datacenter',
  },
];

// ── 6. Expanded Statutory Government Support & Subsidy Schemes ──────────────
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
    getAgency: (ctx) => `${ctx.state} Directorate of Industries`,
    benefit: '5% to 7% Interest Subsidy for 5 Years + Industrial Electricity Duty Exemption',
    eligibilityBasis: 'Eligible: State Industrial Policy concessions on term loan & industrial power tariff',
    getPortal: (ctx) => STATE_PORTALS[ctx.state]?.portalName || 'State Single Window System',
    matches: (ctx) => Number(ctx.investmentLakh) <= 5000,
  },
  {
    code: 'SCH-04',
    name: 'ZED Certification & Clean Technology Subsidy',
    agency: 'Ministry of MSME',
    benefit: 'Up to 80% Subsidy on Clean Tech, Energy Audits & ZED Certification',
    eligibilityBasis: 'Eligible: Zero Defect Zero Effect (ZED) green process compliance',
    portal: 'MSME ZED Official Portal',
    matches: (ctx) => ctx.hazardous === true || ['textile', 'chemical', 'food', 'automotive', 'electronics', 'pharma'].includes(ctx.sector),
  },
  {
    code: 'SCH-05',
    name: 'PLI Scheme & Sectoral Capital Subsidy (Atmanirbhar Bharat)',
    agency: 'NITI Aayog & Relevant Line Ministries',
    benefit: '4% to 6% Incentive on Incremental Sales / Up to 25% Capex Subsidy',
    eligibilityBasis: 'Eligible: Priority sector with capital investment >= ₹50 Lakh under National PLI / Capital Subsidy Policy',
    portal: 'National PLI Portal (investindia.gov.in)',
    matches: (ctx) => ['automotive', 'electronics', 'pharma', 'renewable', 'textile', 'datacenter'].includes(ctx.sector) && Number(ctx.investmentLakh) >= 50,
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

// ── 7. Statutory GeM & CPPP Government Tenders Catalog (16 Tenders) ─────────
export const TENDERS_CATALOG = [
  // 1. Textiles & Technical Textiles
  {
    code: 'TND-TX-101',
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
    code: 'TND-TX-102',
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

  // 2. Food Processing & Cold Chain
  {
    code: 'TND-FD-201',
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
    code: 'TND-FD-202',
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

  // 3. Specialty Chemicals & Solvents
  {
    code: 'TND-CH-301',
    name: 'Supply of Water Treatment & Effluent Neutralization Chemicals',
    buyer: 'Gujarat Industrial Development Corporation (GIDC Water Supply)',
    tenderValue: '₹1.45 Crore',
    emdExemption: '100% MSE Exempt',
    portalRef: 'GEM/2026/B/6091822',
    bidWindow: '14 Days Open',
    statutoryPreRequisite: 'Requires Red-Category CTE/CTO & HOWM Hazardous Authorization',
    sector: 'chemical',
    matches: (ctx) => ctx.sector === 'chemical',
  },
  {
    code: 'TND-CH-302',
    name: 'Industrial Specialty Solvents & Lab Reagents Rate Contract',
    buyer: 'ONGC Western Onshore Basin, Vadodara',
    tenderValue: '₹2.10 Crore',
    emdExemption: 'MSE Purchase Preference',
    portalRef: 'CPPP/2026/ONGC/7741',
    bidWindow: '28 Days Open',
    statutoryPreRequisite: 'Requires Chief Fire Officer NOC & DISH Factory Licence',
    sector: 'chemical',
    matches: (ctx) => ctx.sector === 'chemical',
  },

  // 4. Automobile, EV & Battery Assembly
  {
    code: 'TND-AU-401',
    name: 'Supply of Electric Utility Vehicles & Battery Swapping Stations',
    buyer: 'Energy Efficiency Services Limited (EESL) — GeM Portal',
    tenderValue: '₹2.40 Crore',
    emdExemption: '100% MSE Exempt',
    portalRef: 'GEM/2026/B/8821901',
    bidWindow: '21 Days Open',
    statutoryPreRequisite: 'Requires CMVR / AIS-156 EV Homologation & Factory Licence',
    sector: 'automotive',
    matches: (ctx) => ctx.sector === 'automotive',
  },
  {
    code: 'TND-AU-402',
    name: 'Precision Machined EV Drivetrain & Suspension Components',
    buyer: 'Integral Coach Factory (ICF Chennai) — Indian Railways IREPS',
    tenderValue: '₹1.80 Crore',
    emdExemption: 'MSE Price Preference (15% Band)',
    portalRef: 'IREPS/2026/ICF/9410',
    bidWindow: '30 Days Open',
    statutoryPreRequisite: 'Requires Factory Licence, DISCOM Sanction & CPCB EPR Compliance',
    sector: 'automotive',
    matches: (ctx) => ctx.sector === 'automotive',
  },

  // 5. Electronics, PCB & Semiconductor Assembly
  {
    code: 'TND-EL-501',
    name: 'Turnkey Assembly of SMT PCBs & Microcontroller Modules',
    buyer: 'Bharat Electronics Limited (BEL Bangalore) — GeM Portal',
    tenderValue: '₹1.65 Crore',
    emdExemption: '100% MSE Exempt',
    portalRef: 'GEM/2026/B/9102482',
    bidWindow: '18 Days Open',
    statutoryPreRequisite: 'Requires Green SPCB Consent, BIS CRS & CPCB E-Waste Registration',
    sector: 'electronics',
    matches: (ctx) => ctx.sector === 'electronics',
  },
  {
    code: 'TND-EL-502',
    name: 'Supply of BIS-Certified IoT Sensor Hubs & Power Controllers',
    buyer: 'Ministry of Electronics & Information Technology (MeitY) — CPPP',
    tenderValue: '₹95.00 Lakh',
    emdExemption: '100% MSE Exempt',
    portalRef: 'CPPP/2026/MEITY/6104',
    bidWindow: '24 Days Open',
    statutoryPreRequisite: 'Requires 100% Statutory Clearances & ISO 9001 Certification',
    sector: 'electronics',
    matches: (ctx) => ctx.sector === 'electronics',
  },

  // 6. Renewable Energy, Solar PV & Green Hydrogen
  {
    code: 'TND-RN-601',
    name: 'Supply of High-Efficiency Bifacial Solar PV Modules',
    buyer: 'Solar Energy Corporation of India (SECI) — GeM Portal',
    tenderValue: '₹3.20 Crore',
    emdExemption: '100% MSE Exempt',
    portalRef: 'GEM/2026/B/7201944',
    bidWindow: '25 Days Open',
    statutoryPreRequisite: 'Requires MNRE ALMM Enlistment & CEIG Energisation Approval',
    sector: 'renewable',
    matches: (ctx) => ctx.sector === 'renewable',
  },
  {
    code: 'TND-RN-602',
    name: 'Balance of Plant (BoP) & Grid Inverter Systems for Green Hydrogen Pilot',
    buyer: 'NTPC Renewable Energy Limited — CPPP Portal',
    tenderValue: '₹4.50 Crore',
    emdExemption: 'MSE Technical Qualification Relaxed',
    portalRef: 'CPPP/2026/NTPC/8842',
    bidWindow: '30 Days Open',
    statutoryPreRequisite: 'Requires SPCB White Undertaking & DISCOM Grid Synchronization',
    sector: 'renewable',
    matches: (ctx) => ctx.sector === 'renewable',
  },

  // 7. Pharmaceuticals, Bulk Drugs & Biotech
  {
    code: 'TND-PH-701',
    name: 'Supply of Essential Generic Tablets & Schedule-M Formulations',
    buyer: 'Pharmaceuticals & Medical Devices Bureau of India (PMBI — Jan Aushadhi)',
    tenderValue: '₹2.85 Crore',
    emdExemption: '100% MSE Exempt',
    portalRef: 'GEM/2026/B/8410291',
    bidWindow: '20 Days Open',
    statutoryPreRequisite: 'Requires CDSCO Schedule-M Drug Licence & Red SPCB Consent',
    sector: 'pharma',
    matches: (ctx) => ctx.sector === 'pharma',
  },
  {
    code: 'TND-PH-702',
    name: 'Rate Contract for Parenteral Infusions & Sterile APIs',
    buyer: 'AIIMS Central Procurement Cell (Ministry of Health) — CPPP',
    tenderValue: '₹3.90 Crore',
    emdExemption: 'MSE Purchase Preference (15% Band)',
    portalRef: 'CPPP/2026/AIIMS/4421',
    bidWindow: '28 Days Open',
    statutoryPreRequisite: 'Requires CDSCO Form-25/28 & WHO-GMP Certification',
    sector: 'pharma',
    matches: (ctx) => ctx.sector === 'pharma',
  },

  // 8. IT Infrastructure, Cloud & Hyperscale Data Centers
  {
    code: 'TND-DC-801',
    name: 'High-Density Server Racks, PDU & Precision Cooling Infrastructure',
    buyer: 'National Informatics Centre (NIC MeghRaj Cloud) — GeM Portal',
    tenderValue: '₹2.10 Crore',
    emdExemption: '100% MSE Exempt',
    portalRef: 'GEM/2026/B/9541029',
    bidWindow: '21 Days Open',
    statutoryPreRequisite: 'Requires DoT Saral Sanchar Registration & Green SPCB Consent',
    sector: 'datacenter',
    matches: (ctx) => ctx.sector === 'datacenter',
  },
  {
    code: 'TND-DC-802',
    name: 'Tier-III Hyperscale Facility Colocation & Disaster Recovery Services',
    buyer: 'Unique Identification Authority of India (UIDAI) — CPPP',
    tenderValue: '₹5.50 Crore',
    emdExemption: 'MSE Price Preference (15% Band)',
    portalRef: 'CPPP/2026/UIDAI/7109',
    bidWindow: '30 Days Open',
    statutoryPreRequisite: 'Requires 100% Approved Factory, Dual DISCOM Feeder & DoT OSP Clearance',
    sector: 'datacenter',
    matches: (ctx) => ctx.sector === 'datacenter',
  },
];

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
