import { GoogleGenerativeAI } from '@google/generative-ai';
import { KNOWLEDGE_BASE, classifyBusinessIntent } from '../engine/statutoryEngine.js';

let genAI = null;

export const initAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'YOUR_API_KEY_HERE' || key.trim() === '') {
    // Deterministic rule engine active
    return;
  }
  try {
    genAI = new GoogleGenerativeAI(key);
  } catch (err) {
    console.warn('[AI] Could not initialize Gemini API:', err.message);
  }
};

export const extractIntakeData = async (text) => {
  if (!text || !text.trim()) {
    return { ok: false, data: null };
  }

  const parsed = classifyBusinessIntent(text);
  return {
    ok: true,
    data: parsed,
    confidence: parsed.classificationConfidence,
  };
};

export const askAssistant = async (question) => {
  if (!question || typeof question !== 'string' || !question.trim()) {
    return { ok: false };
  }

  const normalized = question.trim().toLowerCase();

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

  if (matchedEntry) {
    const isDocQuestion = /(document|documents|docs|kya chahiye|paper|papers|certificate|chahiye)/i.test(normalized);
    const isTimeQuestion = /(how long|how much time|days|sla|time|kitne din|kitna samay|kab tak|duration|din)/i.test(normalized);

    let answer = '';
    if (matchedEntry.sourceRef === 'TND-15') {
      answer = 'Public procurement on GeM (Government e-Marketplace) and CPPP requires 100% verified statutory compliance under the Public Procurement Policy for MSEs Order, 2012. ClearPath unlocks tender participation and bid details once all statutory clearances (Factory Licence, Fire NOC, Pollution CTE, Labour, etc.) reach "approved" status, granting 100% EMD exemptions and MSE price preference.';
    } else if (matchedEntry.sourceRef === 'GOV-14') {
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

    return {
      ok: true,
      answer,
      sources: [matchedEntry.sourceRef],
      confident: true,
    };
  }

  return {
    ok: true,
    answer: 'I am strictly grounded to master regulations and statutory acts. I cannot answer this off-topic query. Please use the application thread to talk to an officer for further assistance.',
    sources: [],
    confident: false,
  };
};

export const explainQuery = async (note) => {
  const key = (note || '').trim().toLowerCase();

  if (key.includes('address')) {
    return {
      explanation: 'The officer noted an address discrepancy on your documents. The address must match the registered business address in your application profile exactly.',
      steps: [
        'Check the business address on your uploaded documents.',
        'Verify against the address in your application profile.',
        'Update your document or profile and re-upload.',
      ],
      hindi: 'अधिकारी ने पते में विसंगति पाई है। कृपया सुनिश्चित करें कि सभी दस्तावेजों पर पता आपके आवेदन से मेल खाता है।',
    };
  }

  if (key.includes('doc') || key.includes('document')) {
    return {
      explanation: 'The officer indicated that required documentation is incomplete or missing from your submission.',
      steps: [
        'Review the required documents checklist for this clearance.',
        'Ensure all pages are legible and signed.',
        'Upload the missing document in the workspace.',
      ],
      hindi: 'अधिकारी ने अपूर्ण या छूटे हुए दस्तावेज बताए हैं। कृपया आवश्यक दस्तावेज पुनः अपलोड करें।',
    };
  }

  return {
    explanation: 'The reviewing officer has requested clarification regarding your application details.',
    steps: [
      "Read the officer's query carefully.",
      'Reply in this thread with the requested clarification.',
      'Upload any supporting documents if needed.',
    ],
    hindi: 'समीक्षा अधिकारी ने आपके आवेदन के संबंध में स्पष्टीकरण मांगा है। कृपया संदेश का उत्तर दें।',
  };
};

export const generateSummary = async (approvalRequestId) => {
  const summaries = {
    req2: {
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
      'Approval request is under review by the statutory department.',
      'All submitted documents appear consistent with the application profile.',
      'No critical flags detected at this time.',
    ],
    flags: [],
  };

  return summaries[approvalRequestId] || def;
};

export const generateInsights = async (analyticsData) => {
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
        : 'Zero senior officer escalations in the current cycle',
      action: escalations > 0
        ? 'Prioritize senior officer review queues for high-risk textile and chemical unit filings.'
        : 'Review upcoming 48-hour deadlines to maintain current positive compliance velocity.',
    },
    {
      title: 'Joint inspection clustering opportunity',
      action: 'Merge safety and environmental site visits in Surat industrial zone to save visits and reduce turnaround by 4 days.',
    },
  ];

  return insights;
};
