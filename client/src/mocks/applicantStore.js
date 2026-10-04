// Shared applicant mock store — exported so officerQueue.js can mutate it
// for the cross-role demo.

const now = Date.now();
const D = (deltaDays) => new Date(now + deltaDays * 86400000).toISOString();

export const myApplicationsCache = {
  applications: [
    {
      id: 'APP-001',
      sector: 'Textile unit',
      city: 'Surat',
      approvalRequests: [
        { id: 'req1', name: 'Factory Licence', department: 'Industrial', status: 'approved', assignedOfficerName: 'R. Sharma', deskNo: '4', lastActionAt: D(-5), slaDeadline: D(5), escalated: false, riskTier: 'medium', needsInspection: false },
        { id: 'req2', name: 'Fire NOC', department: 'Fire Dept', status: 'query_raised', assignedOfficerName: 'Bob Officer', deskNo: '2', lastActionAt: D(-2), slaDeadline: D(6), escalated: false, riskTier: 'high', needsInspection: true },
        { id: 'req3', name: 'Pollution Consent', department: 'Environment', status: 'not_started', assignedOfficerName: null, deskNo: null, lastActionAt: null, slaDeadline: D(15), escalated: false, riskTier: 'high', needsInspection: true },
        { id: 'req4', name: 'Labour Registration', department: 'Labour', status: 'query_raised', assignedOfficerName: 'M. Patel', deskNo: '1', lastActionAt: D(-1), slaDeadline: D(12), escalated: false, riskTier: 'low', needsInspection: false },
        { id: 'req5', name: 'Electricity Connection', department: 'Utilities', status: 'submitted', assignedOfficerName: 'K. Desai', deskNo: '5', lastActionAt: D(-1), slaDeadline: D(14), escalated: false, riskTier: 'medium', needsInspection: false },
        { id: 'req6', name: 'Udyam Registration', department: 'MSME', status: 'rejected', assignedOfficerName: 'S. Singh', deskNo: '3', lastActionAt: D(-10), slaDeadline: D(-1), escalated: false, riskTier: 'low', needsInspection: false },
        { id: 'req7', name: 'Professional Tax', department: 'Finance', status: 'approved', assignedOfficerName: 'V. Kumar', deskNo: '8', lastActionAt: D(-15), slaDeadline: D(10), escalated: false, riskTier: 'low', needsInspection: false },
      ],
    },
  ],
};

const INITIAL_APPLICATIONS_CACHE = JSON.parse(JSON.stringify(myApplicationsCache));

export function resetApplicantStore() {
  for (const key of Object.keys(myApplicationsCache)) {
    delete myApplicationsCache[key];
  }
  Object.assign(myApplicationsCache, JSON.parse(JSON.stringify(INITIAL_APPLICATIONS_CACHE)));
}


