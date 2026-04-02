import React from 'react';
import { Database, CheckCircle, BellRing } from 'lucide-react';

const StatsSummary = ({ total, completed, upcoming, filterMode, setFilterMode }) => {
  return (
    <div className="stats-container">
      <div 
        className={`stat-card clickable ${filterMode === 'all' ? 'active' : ''}`}
        onClick={() => setFilterMode('all')}
      >
        <div className="stat-icon blue">
          <Database size={24} />
        </div>
        <div className="stat-info">
          <h3>{total}</h3>
          <p>Mẫu đang quản lý</p>
        </div>
      </div>
      
      <div 
        className={`stat-card clickable ${filterMode === 'completed' ? 'active' : ''}`}
        onClick={() => setFilterMode('completed')}
      >
        <div className="stat-icon green">
          <CheckCircle size={24} />
        </div>
        <div className="stat-info">
          <h3>{completed}</h3>
          <p>Đã hoàn thành</p>
        </div>
      </div>
      
      <div 
        className={`stat-card clickable ${filterMode === 'upcoming' ? 'active' : ''}`}
        onClick={() => setFilterMode('upcoming')}
      >
        <div className="stat-icon orange">
          <BellRing size={24} />
        </div>
        <div className="stat-info">
          <h3>{upcoming}</h3>
          <p>Sắp tới cần kiểm tra</p>
        </div>
      </div>
    </div>
  );
};

export default StatsSummary;
