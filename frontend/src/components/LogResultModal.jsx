import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Save, UploadCloud } from 'lucide-react';
import { supabase } from '../supabaseClient';

const LogResultModal = ({ isOpen, onClose, sample, milestone, onResultSaved }) => {
  const [formData, setFormData] = useState({
    sensoryEval: '',
    ph: '',
    evaluationStatus: 'pass'
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [existingImage, setExistingImage] = useState(null);
  const [existingResultId, setExistingResultId] = useState(null);

  useEffect(() => {
    if (isOpen && sample && milestone) {
      // Find existing result directly from memory 
      // (Since Dashboard.jsx already fetches sample + results)
      const existing = sample.results ? sample.results.find(r => r.milestone === milestone.toLowerCase()) : null;
      if (existing) {
        setExistingResultId(existing.id);
        setFormData({
          sensoryEval: existing.sensoryEval || '',
          ph: existing.ph || '',
          evaluationStatus: existing.evaluationStatus || 'pass'
        });
        if (existing.imagePath) {
          const { data } = supabase.storage.from('sample-images').getPublicUrl(existing.imagePath);
          setExistingImage(data.publicUrl);
        } else {
          setExistingImage(null);
        }
      } else {
        setExistingResultId(null);
        setFormData({ sensoryEval: '', ph: '', evaluationStatus: 'pass' });
        setImageFile(null);
        setExistingImage(null);
      }
    } else {
      setFormData({ sensoryEval: '', ph: '', evaluationStatus: 'pass' });
      setImageFile(null);
      setExistingImage(null);
      setExistingResultId(null);
    }
  }, [isOpen, sample, milestone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imagePath = null;

      // 1. Upload new image if standard File is chosen
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${sample.id}/${fileName}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('sample-images')
          .upload(filePath, imageFile);
          
        if (uploadError) throw uploadError;
        imagePath = uploadData.path;
      }

      // 2. Upsert sample_result
      const payload = {
        sampleId: sample.id,
        milestone: milestone.toLowerCase(),
        sensoryEval: formData.sensoryEval,
        ph: parseFloat(formData.ph) || null,
        evaluationStatus: formData.evaluationStatus
      };

      if (imagePath) {
        payload.imagePath = imagePath;
      }
      
      let res;
      if (existingResultId) {
        res = await supabase.from('sample_results').update(payload).eq('id', existingResultId);
      } else {
        res = await supabase.from('sample_results').insert([payload]);
      }
      if (res.error) throw res.error;

      // 3. Update the sample milestone boolean tracker
      const columnMap = { '1m': 'checked1M', '3m': 'checked3M', '6m': 'checked6M' };
      const column = columnMap[milestone.toLowerCase()];
      if (column) {
        await supabase.from('samples').update({ [column]: 1 }).eq('id', sample.id);
      }

      onResultSaved();
      onClose();
    } catch (err) {
      console.error('Failed to log result', err);
      alert('Lỗi cập nhật nhật ký lên Supabase: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!sample) return null;

  return (
    <Modal 
      title={`Cập nhật: [${sample.productName}] - Mốc ${milestone.toUpperCase()}`} 
      isOpen={isOpen} 
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="elegant-label">Đánh giá cảm quan *</label>
          <textarea 
            className="elegant-input" 
            name="sensoryEval"
            value={formData.sensoryEval}
            onChange={handleChange}
            required
            rows="3"
            placeholder="Màu sắc, mùi, hiện tượng tách lớp, v.v..."
          />
        </div>

        <div>
          <label className="elegant-label">Thông số pH *</label>
          <input 
            className="elegant-input" 
            type="number" 
            step="0.01"
            name="ph"
            value={formData.ph}
            onChange={handleChange}
            required
            placeholder="Ví dụ: 5.5"
          />
        </div>

        <div>
          <label className="elegant-label">Trạng thái đánh giá *</label>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="evaluationStatus" 
                value="pass" 
                checked={formData.evaluationStatus === 'pass'} 
                onChange={handleChange} 
              />
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Đạt</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="evaluationStatus" 
                value="fail" 
                checked={formData.evaluationStatus === 'fail'} 
                onChange={handleChange} 
              />
              <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Không Đạt</span>
            </label>
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="elegant-label">Hình ảnh mẫu chụp thực tế (tùy chọn)</label>
          {existingImage && !imageFile && (
            <div style={{ marginBottom: '0.5rem' }}>
              <img src={existingImage} alt="Current" style={{ maxHeight: '100px', borderRadius: '8px' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              id="file-upload" 
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="btn-primary" style={{ background: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
              <UploadCloud size={16} /> Chọn Ảnh
            </label>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {imageFile ? imageFile.name : 'Chưa có file nào'}
            </span>
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn-primary" style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-light)', boxShadow: 'none' }}>
            Hủy
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            <Save size={18} />
            {loading ? 'Đang lưu Cloud...' : 'Lưu Kết Quả'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LogResultModal;
