import React, { useMemo } from 'react';
import { getActiveAlerts, formatDateDisplay } from '../utils/dateUtils';
import { AlertTriangle, Clock, Edit } from 'lucide-react';

const Alerts = ({ samples, onOpenLogResult }) => {
  const activeAlerts = useMemo(() => getActiveAlerts(samples), [samples]);

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="glass-card">
      <h2 className="card-header">
        <AlertTriangle size={24} color="var(--color-danger)" />
        Cảnh báo hệ thống ({activeAlerts.length})
      </h2>
      <div className="alert-list">
        {activeAlerts.map((alert, idx) => {
          const rawMilestone = alert.milestoneLabel.split(' ')[0] + 'm'; // "1m", "3m", "6m"
          return (
            <div key={`${alert.sampleId}-${alert.milestoneLabel}`} className={`alert-item ${alert.variant}`}>
              <div className="alert-details">
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>
                  [{alert.productName}] - Mốc {alert.milestoneLabel}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Phải lấy mẫu: <strong>{formatDateDisplay(alert.targetDateStr)}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: alert.variant === 'urgent' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                  {alert.variant === 'urgent' ? <AlertTriangle size={18} /> : <Clock size={18} />}
                  {alert.text}
                </div>
                <button 
                  className="btn-primary" 
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}
                  onClick={() => onOpenLogResult(alert.sampleId, rawMilestone)}
                >
                  <Edit size={14} /> Cập nhật
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Alerts;
