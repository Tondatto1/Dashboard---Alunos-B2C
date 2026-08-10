import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SecurityAuditLog } from '../types';

const AUDIT_COL = 'security_audit_logs';

export async function logSecurityEvent(
  action: SecurityAuditLog['action'],
  actorEmail: string,
  details: string,
  severity: SecurityAuditLog['severity'] = 'info',
  actorName?: string
) {
  try {
    const timestamp = new Date().toISOString();
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

    const logEntry: SecurityAuditLog = {
      id,
      timestamp,
      actorEmail: actorEmail || 'system/anonymous',
      actorName: actorName || 'Sistema',
      action,
      details,
      severity,
      ipOrAgent: userAgent.substring(0, 100),
    };

    await setDoc(doc(db, AUDIT_COL, id), logEntry);
  } catch (err) {
    console.warn('Security Audit Log error:', err);
  }
}

export function subscribeSecurityAuditLogs(
  onData: (logs: SecurityAuditLog[]) => void,
  maxLogs = 50
) {
  try {
    const q = query(
      collection(db, AUDIT_COL),
      orderBy('timestamp', 'desc'),
      limit(maxLogs)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as SecurityAuditLog[];
        onData(logs);
      },
      (err) => {
        console.warn('Audit logs subscription error:', err);
        // Fallback for missing composite index or permission
        onSnapshot(collection(db, AUDIT_COL), (snap) => {
          const fallbackLogs = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as SecurityAuditLog))
            .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          onData(fallbackLogs.slice(0, maxLogs));
        });
      }
    );
  } catch (err) {
    console.warn('Audit log query setup failed:', err);
    return () => {};
  }
}
