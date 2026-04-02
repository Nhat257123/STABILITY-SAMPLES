import React, { useState, useEffect } from 'react';
import { Plus, Edit3 } from 'lucide-react';

const STORAGE_CONDITIONS = [
  '40°C / 75% RH',
  'Nhiệt độ thường',
  'Phơi sáng'
];

const SampleForm = ({ onSubmit, isModal = false, initialData = null }) => {
  const [formData, setFormData] = useState({
    productName: '',
    startDate: new Date().toISOString().split('T')[0],
    storageCondition: '40°C / 75% RH',
    initialNotes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        productName: initialData.productName || '',
        startDate: initialData.startDate || new Date().toISOString().split('T')[0],
        storageCondition: initialData.storageCondition || '40°C / 75% RH',
        initialNotes: initialData.initialNotes || ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName.trim()) return;

    setLoading(true);
    await onSubmit(formData, initialData?.id);
    setLoading(false);
    
    if (!initialData) {
      // Only reset if creating new
      setFormData({
        ...formData,
        productName: '',
        initialNotes: ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={isModal ? "" : "glass-card"}>
      {!isModal && <h2 className="card-header">{initialData ? "Chỉnh sửa mẫu thử" : "Thêm mẫu thử mới"}</h2>}
      <form onSubmit={handleSubmit} className="form-grid">
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="elegant-label" htmlFor="productName">Mã công thức / Tên SP *</label>
          <input 
            className="elegant-input"
            type="text" 
            id="productName" 
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            required
            placeholder="Ví dụ: SR-001 Serum..."
          />
        </div>
        
        <div>
          <label className="elegant-label" htmlFor="startDate">Ngày đưa vào tủ *</label>
          <input 
            className="elegant-input"
            type="date" 
            id="startDate" 
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label className="elegant-label" htmlFor="storageCondition">Điều kiện *</label>
          <select 
            className="elegant-input"
            id="storageCondition" 
            name="storageCondition"
            value={formData.storageCondition}
            onChange={handleChange}
          >
            {STORAGE_CONDITIONS.map(cond => (
              <option key={cond} value={cond}>{cond}</option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="elegant-label" htmlFor="initialNotes">Ghi chú</label>
          <textarea 
            className="elegant-input"
            id="initialNotes" 
            name="initialNotes"
            value={formData.initialNotes}
            onChange={handleChange}
            rows="2"
            placeholder="Mô tả màu sắc, hiện trạng ban đầu..."
          />
        </div>

        <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: isModal ? '100%' : 'auto', justifyContent: 'center' }}>
            {initialData ? <Edit3 size={20} /> : <Plus size={20} />}
            {loading ? 'Đang lưu...' : (initialData ? 'Lưu thay đổi' : 'Thêm vào hệ thống')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SampleForm;
