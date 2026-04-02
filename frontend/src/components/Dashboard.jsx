import React, { useState, useEffect, useMemo } from 'react';
import { FlaskConical, Plus, Search, Trash2, Eye, Edit3, Download, ArrowUp, ArrowDown } from 'lucide-react';
import Alerts from './Alerts';
import StatusBadge from './StatusBadge';
import StatsSummary from './StatsSummary';
import NewSampleModal from './NewSampleModal';
import EditSampleModal from './EditSampleModal';
import LogResultModal from './LogResultModal';
import ViewSampleModal from './ViewSampleModal';
import ConfirmModal from './ConfirmModal';
import { formatDateDisplay, getActiveAlerts } from '../utils/dateUtils';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [filterMode, setFilterMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [progressFilter, setProgressFilter] = useState('all');

  // Sort & Pagination
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Expanding Rows
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Modal States
  const [isNewSampleOpen, setIsNewSampleOpen] = useState(false);
  const [logResultModal, setLogResultModal] = useState({ isOpen: false, sample: null, milestone: null });
  const [viewSampleModal, setViewSampleModal] = useState({ isOpen: false, sample: null });
  const [editSampleModal, setEditSampleModal] = useState({ isOpen: false, sample: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, sampleId: null, sampleName: '' });

  const fetchSamples = async () => {
    try {
      const { data, error } = await supabase
        .from('samples')
        .select(`
          *,
          results:sample_results(*)
        `)
        .order('id', { ascending: false });
        
      if (error) throw error;
      setSamples(data || []);
    } catch (err) {
      console.error('Failed to fetch samples', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();

    // Setup Supabase Realtime Subscription
    const channels = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'samples' }, (payload) => {
        fetchSamples();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sample_results' }, (payload) => {
        fetchSamples();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  // Reset page when filter/search/progress changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, searchQuery, progressFilter]);

  // Actions
  const handleAddSample = async (formData) => {
    try {
      const { error } = await supabase.from('samples').insert([{
        productName: formData.productName,
        startDate: formData.startDate,
        storageCondition: formData.storageCondition,
        initialNotes: formData.initialNotes || ''
      }]);
      if (error) throw error;
      // fetchSamples is handled by Realtime automatically, but we can call it manually to be safe
      fetchSamples();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi lưu mẫu thử: ' + err.message);
    }
  };

  const handleEditSample = async (formData, id) => {
    try {
      const { error } = await supabase.from('samples').update({
        productName: formData.productName,
        startDate: formData.startDate,
        storageCondition: formData.storageCondition,
        initialNotes: formData.initialNotes || ''
      }).eq('id', id);
      
      if (error) throw error;
      fetchSamples();
    } catch (err) {
      alert('Có lỗi xảy ra khi sửa mẫu thử.');
    }
  };

  const executeDelete = async () => {
    const id = confirmModal.sampleId;
    try {
      const { error } = await supabase.from('samples').delete().eq('id', id);
      if (error) throw error;
      // Realtime subscription will remove UI
      setSamples(prevSamples => prevSamples.filter(s => s.id !== id));
      alert(`Đã xoá mẫu #${id} thành công!`);
      setConfirmModal({ isOpen: false, sampleId: null, sampleName: '' });
    } catch (err) {
      alert('Xóa mẫu thất bại, thử kiểm tra kết nối.');
    }
  };

  const handleResultSaved = () => {
    // Re-fetch handled natively by realtime or we can trigger it directly
    fetchSamples();
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleExportCSV = () => {
    const exportData = filteredSamples.map(s => ({
      "Mã số": s.id,
      "Tên sản phẩm / Công thức": s.productName || '',
      "Ngày đưa vào": s.startDate,
      "Điều kiện bảo quản": s.storageCondition,
      "Ghi chú ban đầu": s.initialNotes || '',
      "Mốc 1 Tháng": s.checked1M ? 'Đã kiểm tra' : 'Đang chờ',
      "Mốc 3 Tháng": s.checked3M ? 'Đã kiểm tra' : 'Đang chờ',
      "Mốc 6 Tháng": s.checked6M ? 'Đã kiểm tra' : 'Đang chờ'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh Sach Mau");

    const cols = [
      { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 40 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    worksheet['!cols'] = cols;

    XLSX.writeFile(workbook, "Danh_Sach_Mau_Tracker.xlsx");
  };

  // Compute Stats
  const activeAlerts = useMemo(() => getActiveAlerts(samples), [samples]);

  const filteredSamples = useMemo(() => {
    let result = [...samples];

    if (filterMode === 'completed') {
      result = result.filter(s => s.checked6M === 1);
    } else if (filterMode === 'upcoming') {
      const alertSampleIds = new Set(activeAlerts.map(a => a.sampleId));
      result = result.filter(s => alertSampleIds.has(s.id));
    }

    if (progressFilter === 'done1m') {
      result = result.filter(s => s.checked1M === 1);
    } else if (progressFilter === 'done3m') {
      result = result.filter(s => s.checked3M === 1);
    } else if (progressFilter === 'done6m') {
      result = result.filter(s => s.checked6M === 1);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        (s.productName && s.productName.toLowerCase().includes(q)) || 
        String(s.id).includes(q)
      );
    }

    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

    return result;
  }, [samples, filterMode, searchQuery, progressFilter, activeAlerts, sortConfig]);

  const totalItems = filteredSamples.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSamples = filteredSamples.slice(startIndex, startIndex + itemsPerPage);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp size={14} style={{ display: 'inline', marginLeft: '4px' }} /> : <ArrowDown size={14} style={{ display: 'inline', marginLeft: '4px' }} />;
  };

  const handleRowClick = (id, event) => {
    if (event.target.closest('.action-btn') || event.target.closest('.status-pill')) {
      return;
    }
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('sample-images').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <FlaskConical size={36} color="var(--color-primary)" />
        <h1 className="outfit-font">Stability Samples</h1>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>Kết nối Cloud Database...</p>
        </div>
      ) : (
        <>
          <StatsSummary 
            total={samples.length} 
            completed={samples.filter(s => s.checked6M === 1).length} 
            upcoming={activeAlerts.length}
            filterMode={filterMode}
            setFilterMode={setFilterMode}
          />
          
          <div style={{ marginBottom: '1.5rem' }}>
            <Alerts samples={samples} onOpenLogResult={(id, m) => setLogResultModal({ isOpen: true, sample: samples.find(s=>s.id===id), milestone: m })} />
          </div>
            
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 className="card-header" style={{ marginBottom: 0 }}>Danh Sách Mẫu Đang Theo Dõi</h2>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-wrapper" style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: 'var(--radius-md)', padding: '0 0.5rem 0 0', border: '1px solid var(--border-light)' }}>
                  <select 
                    style={{ border: 'none', background: 'transparent', padding: '0.6rem', fontSize: '0.9rem', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', borderRight: '1px solid var(--border-light)' }}
                    value={progressFilter}
                    onChange={(e) => setProgressFilter(e.target.value)}
                  >
                    <option value="all">Tất cả mốc...</option>
                    <option value="done1m">Đã test 1 Tháng</option>
                    <option value="done3m">Đã test 3 Tháng</option>
                    <option value="done6m">Đã test 6 Tháng</option>
                  </select>
                  
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Tìm SP hoặc Mã số..." 
                      style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0.6rem 0.6rem 0.6rem 2.2rem', fontSize: '0.9rem', minWidth: '220px' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <button className="btn-primary" onClick={handleExportCSV} style={{ background: '#fff', color: 'var(--text-main)', border: '1px solid var(--border-light)', boxShadow: 'none' }}>
                  <Download size={18} /> Xuất Excel
                </button>

                <button className="btn-primary" onClick={() => setIsNewSampleOpen(true)}>
                  <Plus size={18} /> Tạo mới
                </button>
              </div>
            </div>
            
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="elegant-table">
                <thead>
                  <tr>
                    <th className="sortable-th" onClick={() => handleSort('id')}>
                      Mã số <SortIcon columnKey="id" />
                    </th>
                    <th className="sortable-th" onClick={() => handleSort('productName')}>
                      Công thức / Ghi chú <SortIcon columnKey="productName" />
                    </th>
                    <th className="sortable-th" onClick={() => handleSort('startDate')}>
                      Ngày đưa vào <SortIcon columnKey="startDate" />
                    </th>
                    <th>Điều kiện</th>
                    <th>Mốc 1 Tháng</th>
                    <th>Mốc 3 Tháng</th>
                    <th>Mốc 6 Tháng</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSamples.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        Không có kết quả nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    paginatedSamples.map(sample => (
                      <React.Fragment key={sample.id}>
                        <tr onClick={(e) => handleRowClick(sample.id, e)} style={{ backgroundColor: expandedRowId === sample.id ? 'var(--color-primary-light)' : 'transparent' }}>
                          <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{sample.id}</td>
                          <td>
                            <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '1rem' }}>
                              {sample.productName}
                            </strong>
                            {sample.initialNotes && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {sample.initialNotes}
                              </span>
                            )}
                          </td>
                          <td>{formatDateDisplay(sample.startDate)}</td>
                          <td>
                            <span style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                              {sample.storageCondition}
                            </span>
                          </td>
                          <td>
                            <StatusBadge 
                              sample={sample} months={1} 
                              isCompleted={Boolean(sample.checked1M)} 
                              onOpenLog={() => setLogResultModal({ isOpen: true, sample, milestone: '1m' })} 
                            />
                          </td>
                          <td>
                            <StatusBadge 
                              sample={sample} months={3} 
                              isCompleted={Boolean(sample.checked3M)} 
                              onOpenLog={() => setLogResultModal({ isOpen: true, sample, milestone: '3m' })} 
                            />
                          </td>
                          <td>
                            <StatusBadge 
                              sample={sample} months={6} 
                              isCompleted={Boolean(sample.checked6M)} 
                              onOpenLog={() => setLogResultModal({ isOpen: true, sample, milestone: '6m' })} 
                            />
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button className="action-btn view" title="Xem hồ sơ" onClick={() => setViewSampleModal({ isOpen: true, sample })}>
                              <Eye size={18} />
                            </button>
                            <button className="action-btn edit" title="Sửa thông tin" onClick={() => setEditSampleModal({ isOpen: true, sample })}>
                              <Edit3 size={18} />
                            </button>
                            <button className="action-btn delete" title="Xóa mẫu này" onClick={() => setConfirmModal({ isOpen: true, sampleId: sample.id, sampleName: sample.productName })}>
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                        {/* Expandable Area */}
                        {expandedRowId === sample.id && (
                          <tr className="expandable-row">
                            <td colSpan="8">
                              <div className="expandable-container">
                                {sample.results && sample.results.length > 0 ? (
                                  sample.results.reverse().map(r => (
                                    <div className="result-card" key={r.id}>
                                      {r.imagePath ? (
                                        <img src={getImageUrl(r.imagePath)} alt="Sample" />
                                      ) : (
                                        <div style={{width: 90, height: 90, background: '#e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#64748b', border: '1px dashed #cbd5e1'}}>No Image</div>
                                      )}
                                      <div style={{ flex: 1 }}>
                                        <strong style={{ display: 'block', marginBottom: '4px', textTransform: 'uppercase', color: 'var(--color-primary)' }}>Mốc {r.milestone}</strong>
                                        <span style={{ fontSize: '0.85rem', display: 'inline-block', marginBottom: '8px', padding: '2px 8px', borderRadius: '4px', background: r.evaluationStatus === 'pass' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: r.evaluationStatus === 'pass' ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 'bold' }}>
                                          {r.evaluationStatus === 'pass' ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                                        </span>
                                        <p style={{ fontSize: '0.8rem', margin: '0 0 4px 0', color: 'var(--text-muted)' }}><strong>pH:</strong> {r.ph || 'N/A'}</p>
                                        <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)', whiteSpace: 'normal', lineHeight: 1.4 }}><strong>Cảm quan:</strong> {r.sensoryEval || 'Trống'}</p>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '1rem' }}>Chưa có nhật ký kiểm tra cảm quan nào được nhập cho mẫu này.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#fff', borderTop: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Đang xem <strong style={{color: 'var(--text-main)'}}>{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</strong> trong tổng số <strong style={{color: 'var(--text-main)'}}>{totalItems}</strong> mẫu
              </span>
              
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.4rem', border: 'none' }}>
                  <button 
                    className="page-btn" 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    Trước
                  </button>
                  
                  {pageNumbers.map(num => (
                    <button 
                      key={num} 
                      className={`page-btn ${currentPage === num ? 'active-page' : ''}`}
                      onClick={() => setCurrentPage(num)}
                    >
                      {num}
                    </button>
                  ))}

                  <button 
                    className="page-btn" 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Tiếp
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <NewSampleModal isOpen={isNewSampleOpen} onClose={() => setIsNewSampleOpen(false)} onAddSample={handleAddSample} />
      <EditSampleModal isOpen={editSampleModal.isOpen} sample={editSampleModal.sample} onClose={() => setEditSampleModal({ isOpen: false, sample: null })} onEditSample={handleEditSample} />
      <LogResultModal isOpen={logResultModal.isOpen} sample={logResultModal.sample} milestone={logResultModal.milestone} onClose={() => setLogResultModal({ isOpen: false, sample: null, milestone: null })} onResultSaved={handleResultSaved} />
      <ViewSampleModal isOpen={viewSampleModal.isOpen} sample={viewSampleModal.sample} onClose={() => setViewSampleModal({ isOpen: false, sample: null })} />
      <ConfirmModal title="Xác nhận Xóa Mẫu" message={`Bạn có chắc chắn muốn xóa mẫu [${confirmModal.sampleName}] này không? Hành động này không thể hoàn tác.`} isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, sampleId: null, sampleName: '' })} onConfirm={executeDelete} />
    </div>
  );
};

export default Dashboard;
