import { useState, useCallback, useEffect } from 'react';
import { useStore, sel } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { today, uid, COLORS } from '../lib/constants';

export default function useTasksMilestones() {
  const S = useStore(s => s.S);
  const upsertTask = useStore(s => s.upsertTask);
  const upsertClient = useStore(s => s.upsertClient);
  const upsertMilestone = useStore(s => s.upsertMilestone);
  const softDeleteTask = useStore(s => s.softDeleteTask);
  const recoverTaskStore = useStore(s => s.recoverTask);
  const purgeTaskStore = useStore(s => s.purgeTask);
  const delMilestoneStore = useStore(s => s.delMilestone);
  const uiViewState = useUIStore(s => s.viewStates.tk || {});
  const setViewState = useUIStore(s => s.setViewState);

  const [ctab, setCtab] = useState<'tg' | 'ms' | 'trash'>((uiViewState.ctab as 'tg' | 'ms' | 'trash') || 'tg');
  const [dashDate, setDashDate] = useState(uiViewState.dashDate || today());
  const [taskModal, setTaskModal] = useState<any>(null);
  const [msModal, setMsModal] = useState<any>(null);
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

  const openTaskForMS = useCallback((msId: string) => {
    setTaskModal({ milestoneId: msId, date: dashDate, isMilestone: true });
  }, [dashDate]);

  const openTaskDetail = useCallback((task: any) => {
    setTaskModal(task);
  }, []);

  const delTask = useCallback(async (id: string) => {
    await softDeleteTask(id);
  }, [softDeleteTask]);

  const openAddMS = useCallback(() => {
    setMsModal({ _mode: 'new', name: '', description: '', assignedTo: [] });
  }, []);

  const openEditMS = useCallback((id: string) => {
    const ms = S.milestones.find((m: any) => m.id === id);
    if (!ms) return;
    setMsModal({ _mode: 'edit', _id: id, name: ms.name, description: ms.description || '', assignedTo: [...(ms.assignedTo || [])] });
  }, [S.milestones]);

  const saveMS = useCallback(async (formData: any) => {
    if (!formData.name.trim()) return;
    if (formData._id) {
      await upsertMilestone({
        id: formData._id,
        name: formData.name.trim(),
        description: formData.description || '',
        assignedTo: formData.assignedTo || [],
      });
    } else {
      const created = await upsertMilestone({
        name: formData.name.trim(),
        description: formData.description || '',
        assignedTo: formData.assignedTo || [],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
      return created;
    }
  }, [upsertMilestone]);

  const delMS = useCallback(async (id: string) => {
    const ms = S.milestones.find((m: any) => m.id === id);
    if (!ms) return;
    const lt = S.tasks.filter((t: any) => t.milestoneId === id && !t.deleted);
    for (const t of lt) {
      await upsertTask({ ...t, milestoneId: null });
    }
    await delMilestoneStore(id);
  }, [S.milestones, S.tasks, upsertTask, delMilestoneStore]);

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
  const milestones = S.milestones.filter((m: any) => !m.deleted);

  return {
    S, ctab, dashDate, taskModal, msModal, dragCid,
    sortedClients, tasksOnDate, deletedTasks, milestones,
    setCtab, setDashDate, shiftGenDate,
    openTaskForClient, openTaskForMS, openTaskDetail, delTask,
    openAddMS, openEditMS, saveMS, delMS,
    recoverTask, purgeTask, purgeAll,
    setDragCid, reorderC,
    setTaskModal, setMsModal,
    upsertTask, upsertMilestone,
  };
}
