import { formatDistanceToNow } from 'date-fns';
import type { RefreshState } from '../../services/AutoRefreshService';
import styles from './RefreshIndicator.module.css';

export interface RefreshIndicatorProps {
  refreshState: RefreshState;
  onRefresh: () => void;
  timeUntilNextRefresh: number;
  isDataFresh: boolean;
}

export function RefreshIndicator({
  refreshState,
  onRefresh,
  timeUntilNextRefresh,
  isDataFresh,
}: RefreshIndicatorProps) {
  const formatTimeUntilRefresh = (ms: number): string => {
    if (ms <= 0) return 'Now';
    
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getStatusText = (): string => {
    if (refreshState.isRefreshing) {
      return 'Updating...';
    }
    
    if (refreshState.error) {
      return 'Update failed';
    }
    
    if (refreshState.lastRefresh) {
      return `Updated ${formatDistanceToNow(refreshState.lastRefresh, { addSuffix: true })}`;
    }
    
    return 'No data';
  };

  const getStatusClass = (): string => {
    if (refreshState.isRefreshing) {
      return styles.refreshing;
    }
    
    if (refreshState.error) {
      return styles.error;
    }
    
    if (!isDataFresh) {
      return styles.stale;
    }
    
    return styles.fresh;
  };

  return (
    <div className={`${styles.refreshIndicator} ${getStatusClass()}`}>
      <div className={styles.status}>
        <div className={styles.statusIcon}>
          {refreshState.isRefreshing ? (
            <div className={styles.spinner} />
          ) : refreshState.error ? (
            <span className={styles.errorIcon}>⚠️</span>
          ) : (
            <span className={styles.freshIcon}>✓</span>
          )}
        </div>
        
        <div className={styles.statusText}>
          <div className={styles.primaryText}>{getStatusText()}</div>
          
          {refreshState.nextRefresh && !refreshState.isRefreshing && (
            <div className={styles.secondaryText}>
              Next update in {formatTimeUntilRefresh(timeUntilNextRefresh)}
            </div>
          )}
          
          {refreshState.error && (
            <div className={styles.errorText}>
              {refreshState.error}
            </div>
          )}
        </div>
      </div>
      
      <button
        className={styles.refreshButton}
        onClick={onRefresh}
        disabled={refreshState.isRefreshing}
        title="Refresh parking data now"
        aria-label="Refresh parking data"
      >
        <span className={`${styles.refreshIcon} ${refreshState.isRefreshing ? styles.spinning : ''}`}>
          ↻
        </span>
      </button>
    </div>
  );
}