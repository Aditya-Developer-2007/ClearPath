import axios from 'axios';
import { users, approvals } from '../mocks';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginAPI = async (email) => {
  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find(u => u.email === email);
        if (user) {
          console.log(`Resolved role: ${user.role}`);
          resolve({ data: { token: `mock-token-${user.id}`, user } });
        } else {
          reject(new Error('User not found'));
        }
      }, 300);
    });
  }
  return api.post('/login', { email });
};

export const getApprovalsAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ data: approvals }), 300);
    });
  }
  return api.get('/approvals');
};

export const publicStatsAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: [
          { dept: 'Pollution Control', days: 14 },
          { dept: 'Fire Department', days: 21 },
          { dept: 'Labour Dept', days: 8 },
          { dept: 'Electricity Board', days: 12 },
        ] });
      }, 500);
    });
  }
  return api.get('/public/stats');
};

export const intakeAPI = async (text) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lower = text.toLowerCase();
        let stage = null;
        if (/(starting|start|new|open|setting up|shuru|kholna)/i.test(lower)) {
          stage = 'New';
        } else if (/(expand|expansion|badhana)/i.test(lower)) {
          stage = 'Expansion';
        } else if (/(renew)/i.test(lower)) {
          stage = 'Renewal';
        }
        
        if (lower.includes('textile') || lower.includes('surat') || lower.includes('lakh')) {
          resolve({ data: { ok: true, data: { sector: 'Textile', state: 'Gujarat', city: 'Surat', investmentLakh: 30, employees: 12, hazardous: null, stage } } });
        } else if (stage) {
          resolve({ data: { ok: true, data: { stage } } });
        } else {
          resolve({ data: { ok: false } });
        }
      }, 800);
    });
  }
  return api.post('/ai/intake', { text });
};

export const submitApplicationAPI = async (data) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            application: { id: 'APP-999' },
            approvals: [
              { id: 'a1', name: 'Factory Licence', department: 'Industrial', docs: ['ID Proof', 'Site Plan'], slaDays: 15, riskTier: 'medium', status: 'not_started', needsInspection: false },
              { id: 'a2', name: 'Fire NOC', department: 'Safety', docs: ['Building Plan'], slaDays: 21, riskTier: 'high', status: 'not_started', needsInspection: true },
              { id: 'a3', name: 'Pollution Consent', department: 'Environment', docs: ['Waste Plan'], slaDays: 30, riskTier: 'high', status: 'not_started', needsInspection: true },
              { id: 'a4', name: 'Labour Registration', department: 'Labour', docs: ['Employee List'], slaDays: 7, riskTier: 'low', status: 'not_started', needsInspection: false },
              { id: 'a5', name: 'Electricity Connection', department: 'Utilities', docs: ['Load Estimate'], slaDays: 14, riskTier: 'medium', status: 'not_started', needsInspection: false },
              { id: 'a6', name: 'Udyam Registration', department: 'MSME', docs: ['Aadhar'], slaDays: 3, riskTier: 'low', status: 'not_started', needsInspection: false },
              { id: 'a7', name: 'Professional Tax', department: 'Finance', docs: ['PAN'], slaDays: 7, riskTier: 'low', status: 'not_started', needsInspection: false },
            ],
            estimatedDays: 24
          }
        });
      }, 1000);
    });
  }
  return api.post('/applications', data);
};

export const getMyApplicationsAPI = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            applications: [
              {
                id: 'APP-001',
                sector: 'Textile unit',
                city: 'Surat',
                approvalRequests: [
                  { id: 'req1', name: 'Factory Licence', department: 'Industrial', status: 'approved', assignedOfficerName: 'R. Sharma', deskNo: '4', lastActionAt: new Date(Date.now() - 5*86400000).toISOString(), slaDeadline: new Date(Date.now() + 5*86400000).toISOString(), escalated: false, riskTier: 'medium', needsInspection: false },
                  { id: 'req2', name: 'Fire NOC', department: 'Safety', status: 'under_review', assignedOfficerName: 'A. Gupta', deskNo: '2', lastActionAt: new Date(Date.now() - 2*86400000).toISOString(), slaDeadline: new Date(Date.now() - 2*86400000).toISOString(), escalated: true, riskTier: 'high', needsInspection: true },
                  { id: 'req3', name: 'Pollution Consent', department: 'Environment', status: 'not_started', assignedOfficerName: null, deskNo: null, lastActionAt: null, slaDeadline: new Date(Date.now() + 15*86400000).toISOString(), escalated: false, riskTier: 'high', needsInspection: true },
                  { id: 'req4', name: 'Labour Registration', department: 'Labour', status: 'query_raised', assignedOfficerName: 'M. Patel', deskNo: '1', lastActionAt: new Date(Date.now() - 1*86400000).toISOString(), slaDeadline: new Date(Date.now() + 3*86400000).toISOString(), escalated: false, riskTier: 'low', needsInspection: false },
                  { id: 'req5', name: 'Electricity Connection', department: 'Utilities', status: 'submitted', assignedOfficerName: 'K. Desai', deskNo: '5', lastActionAt: new Date(Date.now() - 1*86400000).toISOString(), slaDeadline: new Date(Date.now() + 7*86400000).toISOString(), escalated: false, riskTier: 'medium', needsInspection: false },
                  { id: 'req6', name: 'Udyam Registration', department: 'MSME', status: 'rejected', assignedOfficerName: 'S. Singh', deskNo: '3', lastActionAt: new Date(Date.now() - 10*86400000).toISOString(), slaDeadline: new Date(Date.now() - 1*86400000).toISOString(), escalated: false, riskTier: 'low', needsInspection: false },
                  { id: 'req7', name: 'Professional Tax', department: 'Finance', status: 'approved', assignedOfficerName: 'V. Kumar', deskNo: '8', lastActionAt: new Date(Date.now() - 15*86400000).toISOString(), slaDeadline: new Date(Date.now() + 10*86400000).toISOString(), escalated: false, riskTier: 'low', needsInspection: false },
                ]
              }
            ]
          }
        });
      }, 800);
    });
  }
  return api.get('/applications/mine');
};

export default api;
