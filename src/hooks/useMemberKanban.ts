import { useState, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { today, MOOD_ORDER } from '../lib/constants';
import { getCompleteStatus } from '../utils/statusUtils';

export default function useMemberKanban() {
  const S = useStore(s => s.S);
  const memberId = useStore(s => s.session?.memberId);
  const upsertTask = useStore(s => s.upsertTask);
  const uiViewState = useUIStore(s => s.viewStates.kb || {});
  const setViewState = useUIStore(s => s.setViewState);

  const [date, setDate] = useState(uiViewState.date || today());
  const [taskModal, setTaskModal] = useState<any>(null);

  // Persist date
  const persistDate = useCallback((d: string) => {
    setDate(d);
    setViewState('kb', { date: d });
  }, [setViewState]);

  const shift = useCallback((days: number) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    persistDate(d.toISOString().slice(0, 10));
  }, [date, persistDate]);

  const goToday = useCallback(() => persistDate(today()), [persistDate]);

  const completeStatus = getCompleteStatus(S.task_statuses);

  // Member's tasks for the selected date, grouped by mood, excluding completed
  const myTasks = useMemo(() => {
    if (!memberId) return [];
    return S.tasks.filter((t: any) =>
      t.date === date && !t.deleted && t.status !== completeStatus &&
      t.assignedTo && t.assignedTo.includes(memberId)
    );
  }, [S.tasks, date, memberId, completeStatus]);

  // Moods in canonical order, each with their tasks
  const moodsWithTasks = useMemo(() => {
    const moodOrder = MOOD_ORDER;
    const moodMap: Record<string, any> = {};
    S.moods.forEach((m: any) => { moodMap[m.id] = m; });

    return moodOrder
      .filter((mid: string) => moodMap[mid] && moodMap[mid].visible)
      .map((mid: string) => {
        const mood = moodMap[mid];
        const tasks = myTasks.filter((t: any) => t.mood === mid);
        return { ...mood, tasks };
      });
  }, [S.moods, myTasks]);

  const setStatus = useCallback(async (taskId: string, status: string) => {
    const t = S.tasks.find((x: any) => x.id === taskId);
    if (t && memberId) {
      await upsertTask({ ...t, status });
    }
  }, [S.tasks, memberId, upsertTask]);

  return {
    S, date, moodsWithTasks, taskModal, memberId,
    shift, goToday, setDate: persistDate,
    setStatus, setTaskModal,
  };
}
