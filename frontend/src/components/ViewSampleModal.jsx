import React from 'react';
import Modal from './Modal';
import { formatDateDisplay } from '../utils/dateUtils';
import { Package, Activity } from 'lucide-react';
import { supabase } from '../supabaseClient';

const ViewSampleModal = ({ isOpen, onClose, sample }) => {
  if (!sample) return null;

  const results = sample.results ? [...sample.results].reverse() : [];

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // backwards compat
    const { data } = supabase.storage.from('sample-images').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <Modal title={`Hồ sơ Mẫu #${sample.id}`} isOpen={isOpen} onClose={onClose}>
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem', fontWeight: 600 }}>
          <Package size={18} /> Thông tin lưu mẫu
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
          <div><strong style={{ color: 'var(--text-muted)' }}>Sản phẩm:</strong> <br/> {sample.productName}</div>
          <div><strong style={{ color: 'var(--text-muted)' }}>Ngày đưa vào:</strong> <br/> {formatDateDisplay(sample.startDate)}</div>
          <div><strong style={{ color: 'var(--text-muted)' }}>Điều kiện:</strong> <br/> {sample.storageCondition}</div>
          {sample.initialNotes && <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: 'var(--text-muted)' }}>Ghi chú:</strong> <br/> {sample.initialNotes}</div>}
        </div>
      </div>

      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>
        <Activity size={18} color="var(--color-primary)" /> Lịch sử kết quả kiểm tra
      </h4>
      
      {results.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Chưa có kết quả nào được ghi nhận cho mẫu này.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map(r => (
            <div key={r.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <strong style={{ textTransform: 'uppercase', color: 'var(--color-primary-dark)', fontSize: '1rem' }}>
                  Mốc {r.milestone}
                </strong>
                <span className={`status-pill ${r.evaluationStatus === 'pass' ? 'completed' : 'urgent'}`} style={{ minWidth: 'auto', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>
                  <span className="pill-status">{r.evaluationStatus === 'pass' ? 'Đạt' : 'Không Đạt'}</span>
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p><strong style={{ color: 'var(--text-muted)' }}>Mức pH:</strong> {r.ph || 'N/A'}</p>
                <p><strong style={{ color: 'var(--text-muted)' }}>Cảm quan:</strong> {r.sensoryEval || 'Trống'}</p>
              </div>
              {r.imagePath && (
                <div style={{ marginTop: '1rem' }}>
                  <img src={getImageUrl(r.imagePath)} alt={`Kết quả ${r.milestone}`} style={{ maxHeight: '160px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ViewSampleModal;
