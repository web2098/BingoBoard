import React, { useState, useRef, useEffect } from 'react';
import styles from './ClientLog.module.css';
import { LogEntry } from '../hooks/useConsoleLog';

interface ClientLogProps {
  className?: string;
  logs: LogEntry[];
  onClearLogs: () => void;
}

const ClientLog: React.FC<ClientLogProps> = ({ className, logs, onClearLogs }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'log' | 'info' | 'warn' | 'error'>('all');

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, collapsed]);

  // Filter logs based on selected level
  const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter);

  // Get CSS class for log level
  const getLogLevelClass = (level: LogEntry['level']): string => {
    switch (level) {
      case 'error': return styles.logError;
      case 'warn': return styles.logWarn;
      case 'info': return styles.logInfo;
      default: return styles.logDefault;
    }
  };

  // Handle scroll to detect if user is at bottom
  const handleScroll = () => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
      setAutoScroll(isAtBottom);
    }
  };

  return (
    <div className={`${styles.clientLog} ${className || ''}`}>
      <div className={styles.logHeader} onClick={() => setCollapsed(!collapsed)}>
        <div className={styles.logHeaderContent}>
          <h3>Log</h3>
          <span className={styles.logCount}>
            {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <button
          className={`${styles.toggleButton} ${collapsed ? styles.collapsed : ''}`}
          aria-label={collapsed ? 'Expand log' : 'Collapse log'}
        >
          ▼
        </button>
      </div>

      {!collapsed && (
        <div className={styles.logContent}>
          {/* Log Controls */}
          <div className={styles.logControls}>
            <div className={styles.filterControls}>
              <label htmlFor="logFilter">Filter:</label>
              <select
                id="logFilter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className={styles.filterSelect}
              >
                <option value="all">All ({logs.length})</option>
                <option value="log">Log ({logs.filter(l => l.level === 'log').length})</option>
                <option value="info">Info ({logs.filter(l => l.level === 'info').length})</option>
                <option value="warn">Warn ({logs.filter(l => l.level === 'warn').length})</option>
                <option value="error">Error ({logs.filter(l => l.level === 'error').length})</option>
              </select>
            </div>

            <div className={styles.actionControls}>
              <label className={styles.autoScrollLabel}>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
                Auto-scroll
              </label>
              <button
                onClick={onClearLogs}
                className={styles.clearButton}
                disabled={logs.length === 0}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Log Display */}
          <div
            ref={logContainerRef}
            className={styles.logContainer}
            onScroll={handleScroll}
          >
            {filteredLogs.length === 0 ? (
              <div className={styles.emptyLog}>
                {filter === 'all' ? 'No log entries yet.' : `No ${filter} entries.`}
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`${styles.logEntry} ${getLogLevelClass(log.level)}`}
                >
                  <span className={styles.logTimestamp}>
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={styles.logLevel}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className={styles.logMessage}>
                    {log.message}
                    {log.args && log.args.length > 0 && (
                      <span className={styles.logArgs}>
                        {' '}
                        {log.args.map(arg =>
                          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                        ).join(' ')}
                      </span>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientLog;
