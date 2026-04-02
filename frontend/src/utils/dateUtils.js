export const calculateTargetDate = (startDateStr, monthsToAdd) => {
  const date = new Date(startDateStr);
  const targetDate = new Date(date.setMonth(date.getMonth() + monthsToAdd));
  return targetDate.toISOString().split('T')[0];
};

export const getStatusAnalysis = (targetDateStr, isCompleted) => {
  if (isCompleted) {
    return { variant: 'completed', text: 'Đã kiểm tra' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(targetDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { variant: 'urgent', text: 'Quá hạn' };
  } else if (diffDays === 0) {
    return { variant: 'urgent', text: 'Hôm nay' };
  } else if (diffDays <= 3) {
    return { variant: 'warning', text: `${diffDays} ngày nữa` };
  } else {
    return { variant: 'pending', text: 'Chưa đến hạn' };
  }
};

export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    numeralSystem: 'latn',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export const getActiveAlerts = (samples) => {
  const alerts = [];
  samples.forEach(sample => {
    const milestones = [
      { key: '1m', months: 1, checked: sample.checked1M },
      { key: '3m', months: 3, checked: sample.checked3M },
      { key: '6m', months: 6, checked: sample.checked6M },
    ];

    milestones.forEach(m => {
      if (!m.checked) {
        const targetDate = calculateTargetDate(sample.startDate, m.months);
        const status = getStatusAnalysis(targetDate, false);
        
        if (status.variant === 'urgent' || status.variant === 'warning') {
          alerts.push({
            sampleId: sample.id,
            productName: sample.productName,
            milestoneLabel: `${m.months} Tháng`,
            targetDateStr: targetDate,
            variant: status.variant,
            text: status.text
          });
        }
      }
    });
  });

  return alerts.sort((a, b) => {
    if (a.variant === 'urgent' && b.variant !== 'urgent') return -1;
    if (a.variant !== 'urgent' && b.variant === 'urgent') return 1;
    return new Date(a.targetDateStr) - new Date(b.targetDateStr);
  });
};
