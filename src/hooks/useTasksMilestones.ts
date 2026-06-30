import { useState, useCallback, useEffect } from 'react';
import { useStore, sel } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { today } from '../lib/constants';

export default function useTasksMilestones() {
  const S = useStore(s => s.S);
  const upsertClient = useStore(s => s.upsertClient);
  const softDeleteTask = useStore(s => s.softDeleteTask);
  const recoverTaskStore = useStore(s => s.recoverTask);
  const purgeTaskStore = useStore(s => s.purgeTask);
  const uiViewState = useUIStore(s => s.viewStates.tk || {});
  const setViewState = useUIStore(s => s.setViewState);

  const [ctab, setCtab] = useState<'tg' | 'trash'>((uiViewState.ctab as 'tg' | 'trash') || 'tg');
  const [dashDate, setDashDate] = useState(uiViewState.dashDate || today());
  const [taskModal, setTaskModal] = useState<any>(null);
  const [dragCid, setDragCid] = useState<string | null>(null);

  useEffect(() => {
    setViewState('tk', { ctab, dashDate });
  }, [ctab, dashDate, setViewState]);

  const shiftGenDate = useCallback((days: number) => {
    const d = new Date(dashDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setDashDate(d.toISOString().slice(0, 10));
  }, [dashDate]);

  const openTaskForClient = useCallback((clientId: string) => {
    setTaskModal({ clientId, date: dashDate });
  }, [dashDate]);

  const openTaskDetail = useCallback((task: any) => {
    setTaskModal(task);
  }, []);

  const delTask = useCallback(async (id: string) => {
    await softDeleteTask(id);
  }, [softDeleteTask]);

  const recoverTask = useCallback(async (id: string) => {
    await recoverTaskStore(id);
  }, [recoverTaskStore]);

  const purgeTask = useCallback(async (id: string) => {
    await purgeTaskStore(id);
  }, [purgeTaskStore]);

  const purgeAll = useCallback(async () => {
    const deleted = S.tasks.filter((t: any) => t.deleted);
    for (const t of deleted) {
      await purgeTaskStore(t.id);
    }
  }, [S.tasks, purgeTaskStore]);

  const reorderC = useCallback(async (targetId: string) => {
    if (!dragCid || dragCid === targetId) return;
    const sorted = sel.scl(S);
    const di = sorted.findIndex((c: any) => c.id === dragCid);
    const ti = sorted.findIndex((c: any) => c.id === targetId);
    if (di === -1 || ti === -1) return;
    const copy = [...sorted];
    const [dr] = copy.splice(di, 1);
    copy.splice(ti, 0, dr);
    for (let i = 0; i < copy.length; i++) {
      const c = copy[i];
      const existing = S.clients.find((x: any) => x.id === c.id);
      if (existing && existing.order !== i) {
        await upsertClient({ ...existing, order: i });
      }
    }
    setDragCid(null);
  }, [dragCid, S, upsertClient]);

  const sortedClients = sel.scl(S);
  const tasksOnDate = S.tasks.filter((t: any) => t.date === dashDate && !t.deleted);
  const deletedTasks = S.tasks.filter((t: any) => t.deleted);
  return {
    S, ctab, dashDate, taskModal, dragCid,
    sortedClients, tasksOnDate, deletedTasks,
    setCtab, setDashDate, shiftGenDate,
    openTaskForClient, openTaskDetail, delTask,
    recoverTask, purgeTask, purgeAll,
    setDragCid, reorderC,
    setTaskModal,
  };
}
