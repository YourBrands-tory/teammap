import { STATUS_TEXT_COLORS, STATUS_BG_COLORS } from '../lib/constants';

function fallbackProxy(map, fallback) {
  return new Proxy(map, {
    get(target, prop) {
      return prop in target ? target[prop] : fallback;
    },
  });
}

export function getStatusMaps(taskStatuses) {
  const labels = (taskStatuses || []).sort((a, b) => a.order - b.order).map(s => s.label);
  const STC = {};
  const STB = {};
  labels.forEach((s, i) => {
    const idx = i % STATUS_TEXT_COLORS.length;
    STC[s] = STATUS_TEXT_COLORS[idx];
    STB[s] = STATUS_BG_COLORS[idx];
  });
  return {
    STATS: labels,
    STC: fallbackProxy(STC, STATUS_TEXT_COLORS[0]),
    STB: fallbackProxy(STB, STATUS_BG_COLORS[0]),
  };
}

export function getDefaultStatus(taskStatuses) {
  const sorted = [...(taskStatuses || [])].sort((a, b) => a.order - b.order);
  return sorted[0]?.label || 'Not Started';
}

export function getCompleteStatus(taskStatuses) {
  const found = (taskStatuses || []).find(
    s => s.label.toLowerCase() === 'complete' || s.label.toLowerCase().includes('complete')
  );
  return found?.label || 'Complete';
}

export function getStandUpStatus(taskStatuses) {
  const found = (taskStatuses || []).find(
    s => s.label.toLowerCase() === 'stand up' || s.label.toLowerCase().includes('stand')
  );
  return found?.label || 'Stand Up';
}

export function getPassStatus(taskStatuses) {
  const found = (taskStatuses || []).find(
    s => s.label.toLowerCase() === 'pass'
  );
  return found?.label || 'Pass';
}

export function getReviewStatus(taskStatuses) {
  const found = (taskStatuses || []).find(
    s => s.label.toLowerCase() === 'review' || s.label.toLowerCase().includes('review')
  );
  return found?.label || 'Review';
}

export function getStatusesForRole(taskStatuses, role) {
  const { STATS } = getStatusMaps(taskStatuses);
  if (role === 'admin' || role === 'manager') return STATS;
  const completeStatus = getCompleteStatus(taskStatuses);
  return STATS.filter(s => s !== completeStatus);
}
