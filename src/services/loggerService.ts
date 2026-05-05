import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';

interface LogOptions {
  context?: string;
  metadata?: Record<string, any>;
}

class LoggerService {
  private collectionName = 'system_logs';

  private async writeLog(level: 'ERROR' | 'INFO' | 'WARN', message: string, error?: unknown, options?: LogOptions) {
    try {
      const authState = useAuthStore.getState();
      const user = authState.currentUser;
      const branchId = authState.activeBranchId;

      let errorDetails: any = null;
      let stack: string | undefined = undefined;

      if (error instanceof Error) {
        errorDetails = error.message;
        stack = error.stack;
      } else if (typeof error === 'string') {
        errorDetails = error;
      } else if (error) {
        try {
          errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
        } catch {
          errorDetails = 'Unserializable error object';
        }
      }

      await addDoc(collection(db, this.collectionName), {
        level,
        message,
        error: errorDetails,
        stack: stack || null,
        context: options?.context || 'global',
        metadata: options?.metadata || {},
        userId: user?.id || 'anonymous',
        userName: user?.name || 'anonymous',
        userRole: user?.role || 'unknown',
        branchId: branchId || 'unknown',
        timestamp: serverTimestamp(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    } catch (e) {
      // Fallback: If logger fails, log to console
      console.error('Failed to write to system_logs', e);
      console.error('Original error that failed to log:', error);
    }
  }

  error(message: string, error?: unknown, options?: LogOptions) {
    console.error(`[LOGGER - ERROR] ${message}`, error);
    this.writeLog('ERROR', message, error, options);
  }

  info(message: string, options?: LogOptions) {
    console.info(`[LOGGER - INFO] ${message}`);
    this.writeLog('INFO', message, undefined, options);
  }

  warn(message: string, options?: LogOptions) {
    console.warn(`[LOGGER - WARN] ${message}`);
    this.writeLog('WARN', message, undefined, options);
  }
}

export const logger = new LoggerService();
