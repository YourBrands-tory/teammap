import { getCompleteStatus, getPassStatus } from './statusUtils';

export function getDailyActiveCount(S, memberId, date) {
  const completeStatus = getCompleteStatus(S.task_statuses);
  const passStatus = getPassStatus(S.task_statuses);
  return S.tasks.filter(t =>
    t.assignedTo?.includes(memberId) &&
    t.date === date &&
    !t.deleted &&
    t.status !== completeStatus &&
    t.status !== passStatus &&
    !t.hidden
  ).length;
}

export function getMoodTaskCount(S, moodId, date, memberId) {
  const completeStatus = getCompleteStatus(S.task_statuses);
  const passStatus = getPassStatus(S.task_statuses);
  return S.tasks.filter(t =>
    t.assignedTo?.includes(memberId) &&
    t.date === date &&
    !t.deleted &&
    t.status !== completeStatus &&
    t.status !== passStatus &&
    t.mood === moodId &&
    !t.hidden
  ).length;
}

export function getDailyLimit(S, memberId) {
  const member = S.members.find(m => m.id === memberId);
  return member?.capacity ?? 6;
}

export function getMoodLimit(S, moodId) {
  const mood = S.moods.find(m => m.id === moodId);
  return mood?.max ?? null;
}

export function canCreateTask(S, memberId, date) {
  const activeCount = getDailyActiveCount(S, memberId, date);
  const limit = getDailyLimit(S, memberId);
  return activeCount < limit;
}

export function canAddTaskToMood(S, moodId, date, memberId) {
  const moodLimit = getMoodLimit(S, moodId);
  if (moodLimit === null) return true;
  const moodCount = getMoodTaskCount(S, moodId, date, memberId);
  return moodCount < moodLimit;
}

export function validateTaskCreation(S, memberId, moodId, date, excludeTaskId) {
  const completeStatus = getCompleteStatus(S.task_statuses);
  const passStatus = getPassStatus(S.task_statuses);
  const member = S.members.find(m => m.id === memberId);

  const dailyActiveCount = S.tasks.filter(t =>
    t.assignedTo?.includes(memberId) &&
    t.date === date &&
    !t.deleted &&
    t.status !== completeStatus &&
    t.status !== passStatus &&
    t.id !== excludeTaskId &&
    !t.hidden
  ).length;
  const dailyLimit = member?.capacity ?? 6;
  if (dailyActiveCount >= dailyLimit) {
    return { valid: false, error: `Daily task limit reached (${dailyActiveCount}/${dailyLimit})` };
  }

  const mood = S.moods.find(m => m.id === moodId);
  const moodLimit = mood?.max ?? null;
  if (moodLimit !== null) {
    const moodCount = S.tasks.filter(t =>
      t.assignedTo?.includes(memberId) &&
      t.date === date &&
      !t.deleted &&
      t.status !== completeStatus &&
      t.status !== passStatus &&
      t.mood === moodId &&
      t.id !== excludeTaskId &&
      !t.hidden
    ).length;
    if (moodCount >= moodLimit) {
      return { valid: false, error: `${mood.label} limit reached (${moodCount}/${moodLimit})` };
    }
  }

  return { valid: true, error: null };
}
