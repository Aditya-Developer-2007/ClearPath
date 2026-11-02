import { getOfficerStore } from './officerQueue';
import { myApplicationsCache } from './applicantStore';

const now = Date.now();

const INSPECTIONS_INITIAL = [
  {
    id: 'insp-1',
    applicantName: 'Aarav Mehta',
    unitName: 'Surya Vastra Mills Pvt. Ltd., Surat',
    approvalRequestIds: ['req2', 'req3'],
    approvals: ['Provisional Fire Safety NOC', 'Pollution Consent (Orange)'],
    proposedDate: new Date(now + 8 * 86400000).toISOString().split('T')[0],
    visitsSaved: 1,
    status: 'proposed',
  },
  {
    id: 'insp-2',
    applicantName: 'Harish Bhandari',
    unitName: 'shakti Switchgear & Transformers, Vadodara',
    approvalRequestIds: ['q-5'],
    approvals: ['HT Industrial Power Sanction', 'Electrical Safety Certificate'],
    proposedDate: new Date(now + 12 * 86400000).toISOString().split('T')[0],
    visitsSaved: 1,
    status: 'proposed',
  },
];

export let adminStore = {
  inspections: JSON.parse(JSON.stringify(INSPECTIONS_INITIAL)),
};

export function resetAdminStore() {
  adminStore = {
    inspections: JSON.parse(JSON.stringify(INSPECTIONS_INITIAL)),
  };
}

export function getInspections() {
  return adminStore.inspections.map((i) => ({ ...i }));
}

export function scheduleInspection(id, slotDate) {
  const proposal = adminStore.inspections.find((i) => i.id === id);
  if (proposal) {
    proposal.status = 'scheduled';
    if (slotDate) {
      proposal.proposedDate = slotDate;
    }

    if (
      proposal.applicantName === 'Aarav Mehta' ||
      proposal.approvalRequestIds.includes('req2')
    ) {
      if (myApplicationsCache?.applications?.[0]) {
        myApplicationsCache.applications[0].scheduledInspection = {
          id: proposal.id,
          date: slotDate || proposal.proposedDate,
          unitName: proposal.unitName,
        };
      }
    }
  }
  return proposal ? { ...proposal } : null;
}

export const SENIOR_OFFICERS = {
  'Fire Dept': 'Director, State Fire & Emergency Services',
  Safety: 'Director, State Fire & Emergency Services',
  Environment: 'Member Secretary, State PCB',
  Industrial: 'Chief Inspector of Factories (DISH)',
  Labour: 'Additional Labour Commissioner',
  Utilities: 'Chief Engineer (Commercial), State DISCOM',
};

export function escalateRequest(id, department) {
  const officerStore = getOfficerStore();

  const queueRow = officerStore.queue.find((r) => r.id === id);

  let cacheReq = null;
  if (myApplicationsCache?.applications) {
    for (const app of myApplicationsCache.applications) {
      const found = (app.approvalRequests || []).find((r) => r.id === id);
      if (found) {
        cacheReq = found;
        break;
      }
    }
  }

  if (!queueRow && !cacheReq) return false;

  const isAlreadyEscalated = (queueRow && queueRow.escalated) || (cacheReq && cacheReq.escalated);
  if (isAlreadyEscalated) return false;

  const dept = department || queueRow?.department || cacheReq?.department || 'Safety';
  const officerName = SENIOR_OFFICERS[dept] || 'Senior Officer';
  const assignedOfficerTitle = `${officerName}, Senior Officer, ${dept}`;
  const nowIso = new Date().toISOString();

  if (queueRow) {
    queueRow.escalated = true;
    queueRow.escalatedFrom = 'SLA Breach Auto-Escalation';
    queueRow.assignedOfficerName = assignedOfficerTitle;
  }
  if (cacheReq) {
    cacheReq.escalated = true;
    cacheReq.assignedOfficerName = assignedOfficerTitle;
  }

  if (!officerStore.activityLogs[id]) {
    officerStore.activityLogs[id] = [
      { action: 'Application Created', by: cacheReq ? 'Aarav Mehta' : 'Applicant', timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), note: '' },
      { action: 'Officer Assigned', by: 'System', timestamp: new Date(Date.now() - 9 * 86400000).toISOString(), note: '' },
    ];
  }
  officerStore.activityLogs[id].push({
    action: 'Escalated to Senior Officer (SLA breached)',
    by: 'System',
    timestamp: nowIso,
    note: `SLA deadline breached. Reassigned to ${assignedOfficerTitle}.`,
  });

  if (!officerStore.messages[id]) {
    officerStore.messages[id] = [];
  }
  officerStore.messages[id].push({
    id: `msg-sys-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    senderRole: 'system',
    senderName: 'System',
    text: `SLA deadline breached. Request escalated to ${assignedOfficerTitle}.`,
    timestamp: nowIso,
  });

  return true;
}

export function fastForward(days) {
  const officerStore = getOfficerStore();
  const currentNow = new Date();
  const newlyEscalated = [];
  let shiftedCount = 0;

  officerStore.queue.forEach((row) => {
    if (!['approved', 'rejected'].includes(row.status)) {
      const oldMs = new Date(row.slaDeadline).getTime();
      const newDeadline = new Date(oldMs - days * 86400000).toISOString();
      row.slaDeadline = newDeadline;
      shiftedCount++;

      if (new Date(newDeadline) < currentNow && row.escalated === false) {
        const didEscalate = escalateRequest(row.id, row.department);
        if (didEscalate && !newlyEscalated.includes(row.id)) {
          newlyEscalated.push(row.id);
        }
      }
    }
  });

  if (myApplicationsCache?.applications) {
    myApplicationsCache.applications.forEach((app) => {
      (app.approvalRequests || []).forEach((req) => {
        const queueRow = officerStore.queue.find((q) => q.id === req.id);
        if (queueRow) {
          req.slaDeadline = queueRow.slaDeadline;
          req.escalated = queueRow.escalated;
          if (queueRow.escalated) {
            req.assignedOfficerName = queueRow.assignedOfficerName;
          }
        } else if (!['approved', 'rejected'].includes(req.status)) {
          const oldMs = req.slaDeadline ? new Date(req.slaDeadline).getTime() : (Date.now() + (req.slaDays || 21) * 86400000);
          const newDeadline = new Date(oldMs - days * 86400000).toISOString();
          req.slaDeadline = newDeadline;
          shiftedCount++;

          if (new Date(newDeadline) < currentNow && req.escalated === false) {
            const didEscalate = escalateRequest(req.id, req.department);
            if (didEscalate && !newlyEscalated.includes(req.id)) {
              newlyEscalated.push(req.id);
            }
          }
        }
      });
    });
  }

  return { shifted: shiftedCount, newlyEscalated };
}

export function getAnalytics() {
  const officerStore = getOfficerStore();
  const currentNow = new Date();

  const applicationUnits = new Set();
  officerStore.queue.forEach((r) => {
    const key = r.unitName || r.applicantName || r.id;
    if (key) applicationUnits.add(key);
  });
  if (myApplicationsCache?.applications) {
    myApplicationsCache.applications.forEach((a) => {
      const key = (a.sector && a.city) ? `${a.sector}, ${a.city}` : a.id;
      if (key) applicationUnits.add(key);
    });
  }
  const totalApplications = applicationUnits.size;

  const reqsMap = new Map();
  officerStore.queue.forEach((r) => reqsMap.set(r.id, { ...r }));
  if (myApplicationsCache?.applications) {
    myApplicationsCache.applications.forEach((app) => {
      (app.approvalRequests || []).forEach((r) => {
        if (!reqsMap.has(r.id)) {
          reqsMap.set(r.id, {
            id: r.id,
            name: r.name,
            applicantName: 'Aarav Mehta',
            unitName: `${app.sector}, ${app.city}`,
            department: r.department,
            status: r.status,
            slaDeadline: r.slaDeadline,
            escalated: r.escalated,
            lastActionAt: r.lastActionAt,
          });
        }
      });
    });
  }

  const allReqs = Array.from(reqsMap.values());
  const openReqs = allReqs.filter((r) => !['approved', 'rejected'].includes(r.status));
  const breaches = openReqs.filter((r) => new Date(r.slaDeadline) < currentNow);
  const escalations = allReqs.filter((r) => r.escalated);

  const totals = {
    applications: totalApplications,
    breaches: breaches.length,
    escalations: escalations.length,
  };

  const depts = ['Fire Dept', 'Environment', 'Industrial', 'Utilities', 'Labour'];
  const byDepartment = depts.map((dept) => {
    const deptAll = allReqs.filter((r) => r.department === dept);
    const deptOpen = deptAll.filter((r) => !['approved', 'rejected'].includes(r.status));
    const deptBreaches = deptOpen.filter((r) => new Date(r.slaDeadline) < currentNow).length;

    let avgDays = 14;
    if (dept === 'Fire Dept' || dept === 'Safety') avgDays = 14;
    else if (dept === 'Environment') avgDays = 22;
    else if (dept === 'Industrial') avgDays = 16;
    else if (dept === 'Utilities') avgDays = 11;
    else if (dept === 'Labour') avgDays = 8;

    return {
      dept,
      avgDays,
      breaches: deptBreaches,
      pending: deptOpen.length,
    };
  });

  const slowest = openReqs.map((r) => {
    const overdueDays = Math.max(0, Math.ceil((currentNow - new Date(r.slaDeadline)) / 86400000));
    const daysTaken = r.lastActionAt
      ? Math.max(1, Math.round((currentNow - new Date(r.lastActionAt)) / 86400000))
      : 8;

    return {
      id: r.id,
      name: r.name,
      applicantName: r.applicantName || 'Aarav Mehta',
      dept: r.department || 'General',
      daysTaken,
      overdueDays,
      escalated: r.escalated || false,
    };
  }).sort((a, b) => {
    if (b.overdueDays !== a.overdueDays) return b.overdueDays - a.overdueDays;
    return b.daysTaken - a.daysTaken;
  });

  return {
    totals,
    byDepartment,
    slowest,
    escalationCount: totals.escalations,
  };
}
