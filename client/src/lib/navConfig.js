import { Home, Inbox, MessageSquare, AlertCircle, FileText, Activity, CalendarCheck } from 'lucide-react';

export const navConfig = {
  applicant: [
    { name: 'Dashboard', path: '/app/dashboard', icon: Home },
    { name: 'My Approvals', path: '/app/approvals', icon: FileText },
    { name: 'Messages', path: '/app/messages', icon: MessageSquare },
  ],
  officer: [
    { name: 'Queue', path: '/officer/queue', icon: Inbox },
    { name: 'Escalated', path: '/officer/escalated', icon: AlertCircle },
    { name: 'Messages', path: '/officer/messages', icon: MessageSquare },
  ],
  admin: [
    { name: 'Analytics', path: '/admin/analytics', icon: Activity },
    { name: 'Inspections', path: '/admin/inspections', icon: CalendarCheck },
  ],
};
