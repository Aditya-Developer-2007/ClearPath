export const users = [
  { id: '1', name: 'Alice Applicant', email: 'alice@applicant.com', role: 'applicant', department: 'Logistics', deskNo: 'A12' },
  { id: '2', name: 'Bob Officer', email: 'gupta@officer.com', role: 'officer', department: 'Fire Dept', deskNo: '2' },
  { id: '3', name: 'Charlie Admin', email: 'charlie@admin.com', role: 'admin', department: 'IT', deskNo: 'C56' },
  // Officer login
  { id: '4', name: 'Bob Officer', email: 'bob@officer.com', role: 'officer', department: 'Fire Dept', deskNo: '2' },
];

export const approvals = [
  { id: '101', name: 'Factory License Renewal', department: 'Industrial', status: 'not_started', assignedOfficerName: null, deskNo: 'D1', lastActionAt: '2023-10-01T10:00:00Z', slaDeadline: '2023-10-15T10:00:00Z', escalated: false, riskTier: 'low', needsInspection: false },
  { id: '102', name: 'Safety Equipment Clearance', department: 'Safety', status: 'in_review', assignedOfficerName: 'Bob Officer', deskNo: '2', lastActionAt: '2023-10-02T12:00:00Z', slaDeadline: '2023-10-10T12:00:00Z', escalated: false, riskTier: 'medium', needsInspection: true },
  { id: '103', name: 'Environmental Audit', department: 'Environment', status: 'query_raised', assignedOfficerName: 'Bob Officer', deskNo: '2', lastActionAt: '2023-10-03T09:00:00Z', slaDeadline: '2023-10-08T09:00:00Z', escalated: false, riskTier: 'high', needsInspection: true },
  { id: '104', name: 'Building Plan Approval', department: 'Planning', status: 'approved', assignedOfficerName: 'Diana Officer', deskNo: 'B35', lastActionAt: '2023-09-20T14:00:00Z', slaDeadline: '2023-09-25T14:00:00Z', escalated: false, riskTier: 'medium', needsInspection: false },
  { id: '105', name: 'Hazardous Waste Permit', department: 'Environment', status: 'rejected', assignedOfficerName: 'Bob Officer', deskNo: '2', lastActionAt: '2023-10-01T16:00:00Z', slaDeadline: '2023-10-05T16:00:00Z', escalated: false, riskTier: 'high', needsInspection: true },
  { id: '106', name: 'Water Connection Sanction', department: 'Utilities', status: 'in_review', assignedOfficerName: 'Eve Officer', deskNo: 'B36', lastActionAt: '2023-10-02T11:00:00Z', slaDeadline: '2023-10-04T11:00:00Z', escalated: true, riskTier: 'low', needsInspection: false },
  { id: '107', name: 'Fire Safety NOC', department: 'Safety', status: 'overdue', assignedOfficerName: 'Bob Officer', deskNo: '2', lastActionAt: '2023-09-15T10:00:00Z', slaDeadline: '2023-09-30T10:00:00Z', escalated: false, riskTier: 'high', needsInspection: true },
];

export { myApplicationsCache } from './applicantStore';
export { officerStore, resetOfficerStore, DEMO_PROFILE_ADDRESS } from './officerQueue';
export { adminStore, resetAdminStore, getAnalytics, fastForward, getInspections, scheduleInspection } from './adminStore';

