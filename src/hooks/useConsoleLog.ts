import { useState, useEffect, useRef, useCallback } from 'react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  args?: any[];
}

interface UseConsoleLogOptions {
  maxEntries?: number;
  includeTimestamp?: boolean;
}

export const useConsoleLog = (options: UseConsoleLogOptions = {}) => {
  const { maxEntries = 100, includeTimestamp = true } = options;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const originalConsoleRef = useRef<{
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
  }>();

  // Function to add a log entry
  const addLogEntry = useCallback((level: LogEntry['level'], message: string, ...args: any[]) => {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      args: args.length > 0 ? args : undefined
    };

    setLogs(prevLogs => {
      const newLogs = [...prevLogs, logEntry];
      // Keep only the last maxEntries
      if (newLogs.length > maxEntries) {
        return newLogs.slice(-maxEntries);
      }
      return newLogs;
    });
  }, [maxEntries]);

  // Function to clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Function to format log entry for display
  const formatLogEntry = useCallback((entry: LogEntry): string => {
    const timestamp = includeTimestamp
      ? `[${entry.timestamp.toLocaleTimeString()}] `
      : '';

    const level = entry.level.toUpperCase();
    const args = entry.args ? ` ${entry.args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')}` : '';

    return `${timestamp}${level}: ${entry.message}${args}`;
  }, [includeTimestamp]);

  // Set up console interception
  useEffect(() => {
    // Store original console methods
    originalConsoleRef.current = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };

    // Override console methods
    console.log = (...args: any[]) => {
      originalConsoleRef.current!.log(...args);
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      addLogEntry('log', message);
    };

    console.info = (...args: any[]) => {
      originalConsoleRef.current!.info(...args);
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      addLogEntry('info', message);
    };

    console.warn = (...args: any[]) => {
      originalConsoleRef.current!.warn(...args);
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      addLogEntry('warn', message);
    };

    console.error = (...args: any[]) => {
      originalConsoleRef.current!.error(...args);
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      addLogEntry('error', message);
    };

    // Cleanup function to restore original console methods
    return () => {
      if (originalConsoleRef.current) {
        console.log = originalConsoleRef.current.log;
        console.info = originalConsoleRef.current.info;
        console.warn = originalConsoleRef.current.warn;
        console.error = originalConsoleRef.current.error;
      }
    };
  }, [addLogEntry]);

  return {
    logs,
    clearLogs,
    formatLogEntry,
    addLogEntry
  };
};

export type { LogEntry };
