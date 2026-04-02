import React from 'react';
import { calculateTargetDate, formatDateDisplay } from '../utils/dateUtils';

const StatusBadge = ({ sample, months, isCompleted, onOpenLog }) => {
  const targetDateStr = calculateTargetDate(sample.startDate, months);
  
  // Find result for this milestone
  const milestoneLabel = `${months}m`;
  let result = null;
  if (sample.results && sample.results.length > 0) {
    result = sample.results.find(r => r.milestone === milestoneLabel);
  }

  let text = '';
  let variant = '';
  
  if (isCompleted && result) {
    text = result.evaluationStatus === 'pass' ? 'Đạt' : 'Không đạt';
    variant = result.evaluationStatus === 'pass' ? 'completed' : 'urgent';
  } else if (isCompleted && !result) {
    text = 'Đã kiểm tra';
    variant = 'completed';
  } else {
    // Determine target vs today
    const target = new Date(targetDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      variant = 'urgent'; text = 'Trễ hạn';
    } else if (diffDays === 0) {
      variant = 'urgent'; text = 'Hôm nay';
    } else if (diffDays <= 3) {
      variant = 'warning'; text = `${diffDays} ngày nữa`;
    } else {
      variant = 'pending'; text = 'Chưa đến hạn';
    }
  }
  
  return (
    <button 
      className={`status-pill ${variant}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpenLog(milestoneLabel);
      }}
      title="Nhấn để cập nhật kết quả kiểm tra"
    >
      <span className="pill-date">{formatDateDisplay(targetDateStr)}</span>
      <span className="pill-status">{text}</span>
    </button>
  );
};

export default StatusBadge;
