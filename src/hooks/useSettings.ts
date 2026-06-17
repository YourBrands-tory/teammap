import { useState, useCallback } from 'react';
import { useStore, sel } from '../store/useStore';
import { uid, COLORS, DEFAULT_TASK_STATUSES } from '../lib/constants';
import { reorderArray, reorderClients } from '../utils/settingsHelpers';

export default function useSettings() {
  const S = useStore(s => s.S);
  const upsertMember = useStore(s => s.upsertMember);
  const delMemberStore = useStore(s => s.delMember);
  const upsertClient = useStore(s => s.upsertClient);
  const delClientStore = useStore(s => s.delClient);
  const setMoods = useStore(s => s.setMoods);
  const upsertTag = useStore(s => s.upsertTag);
  const delTagStore = useStore(s => s.delTag);
  const setStateKey = useStore(s => s.setStateKey);
  const setNavOrder = useStore(s => s.setNavOrder);
  const setNavLabels = useStore(s => s.setNavLabels);
  const resetNav = useStore(s => s.resetNav);
  const updateSettings = useStore(s => s.updateSettings);
  const exportJSON = useStore(s => s.exportJSON);
  const importJSON = useStore(s => s.importJSON);

  const [stDrag, setStDrag] = useState<{ id: string | null; type: string | null }>({ id: null, type: null });
  const [navDragId, setNavDragId] = useState<string | null>(null);
  const [ftDragId, setFtDragId] = useState<string | null>(null);

  // Members
  const saveMember = useCallback(async (id: string | null, name: string, role: string, capacity: number, color: string) => {
    await upsertMember({ ...(id ? { id } : {}), name, role, color, capacity });
  }, [upsertMember]);

  const delMember = useCallback(async (id: string) => {
    if (!confirm('Remove member and all their assignments?')) return;
    await delMemberStore(id);
  }, [delMemberStore]);

  // Clients
  const saveClient = useCallback(async (id: string | null, name: string, industry: string, color: string) => {
    if (!id) {
      await upsertClient({ name, industry, color, order: S.clients.length });
    } else {
      await upsertClient({ id, name, industry });
    }
  }, [upsertClient, S.clients.length]);

  const delClient = useCallback(async (id: string) => {
    if (!confirm('Remove client and all assignments?')) return;
    await delClientStore(id);
  }, [delClientStore]);

  // Moods
  const saveMood = useCallback(async (index: number, data: any) => {
    const moods = [...S.moods];
    if (index >= 0 && index < moods.length) {
      moods[index] = { ...moods[index], ...data };
    } else {
      const newMood = {
        id: uid(), label: data.label, icon: data.icon || '📌', desc: data.desc || '',
        max: data.max ?? null, cardSize: data.cardSize || 'narrow',
        hidden: data.hidden ?? false, color: COLORS[Math.floor(Math.random() * COLORS.length)], bg: '#f2f0ec',
      };
      moods.push(newMood);
    }
    await setMoods(moods);
  }, [S.moods, setMoods]);

  const toggleMoodHidden = useCallback(async (moodId: string) => {
    const moods = S.moods.map(m => m.id === moodId ? { ...m, hidden: !m.hidden } : m);
    await setMoods(moods);
  }, [S.moods, setMoods]);

  // Tags
  const addTag = useCallback(async (label: string) => {
    if (!label.trim()) return;
    if (S.tags.find(t => t.label.toLowerCase() === label.toLowerCase())) return;
    await upsertTag({ label: label.trim(), color: COLORS[S.tags.length % COLORS.length] });
  }, [S.tags, upsertTag]);

  const saveTag = useCallback(async (id: string, label: string) => {
    const existing = S.tags.find(t => t.id === id);
    if (existing) {
      await upsertTag({ id, label: label.trim() || existing.label, color: existing.color });
    }
  }, [S.tags, upsertTag]);

  const delTag = useCallback(async (id: string) => {
    if (!confirm('Remove this tag?')) return;
    await delTagStore(id);
  }, [delTagStore]);

  // Frequency tags
  const addFreqTag = useCallback(async (label: string) => {
    if (!label.trim()) return;
    const freqTags = S.freqTags || [];
    if (freqTags.find((f: any) => f.label.toLowerCase() === label.toLowerCase())) return;
    const updated = [...freqTags, { id: uid(), label: label.trim(), order: freqTags.length }];
    await setStateKey('freqTags', updated);
  }, [S.freqTags, setStateKey]);

  const saveFreqTag = useCallback(async (id: string, label: string) => {
    const freqTags = (S.freqTags || []).map((f: any) =>
      f.id === id ? { ...f, label: label.trim() || f.label } : f
    );
    await setStateKey('freqTags', freqTags);
  }, [S.freqTags, setStateKey]);

  const delFreqTag = useCallback(async (id: string) => {
    if (!confirm('Remove this frequency tag? Templates using it will keep their reference.')) return;
    const updated = (S.freqTags || []).filter((f: any) => f.id !== id);
    await setStateKey('freqTags', updated);
  }, [S.freqTags, setStateKey]);

  // Task statuses
  const addStatus = useCallback(async (label: string) => {
    if (!label.trim()) return;
    const st = S.task_statuses || [];
    if (st.find((s: any) => s.label.toLowerCase() === label.toLowerCase())) return;
    const updated = [...st, { id: uid(), label: label.trim(), order: st.length }];
    await setStateKey('task_statuses', updated);
  }, [S.task_statuses, setStateKey]);

  const saveStatus = useCallback(async (id: string, label: string) => {
    const updated = (S.task_statuses || []).map((s: any) =>
      s.id === id ? { ...s, label: label.trim() || s.label } : s
    );
    await setStateKey('task_statuses', updated);
  }, [S.task_statuses, setStateKey]);

  const delStatus = useCallback(async (id: string) => {
    if (!confirm('Remove this status? Tasks using it will fall back to "Not Started".')) return;
    const deleted = (S.task_statuses || []).find((s: any) => s.id === id);
    let updated = (S.task_statuses || []).filter((s: any) => s.id !== id);
    if (!updated.length) {
      updated = DEFAULT_TASK_STATUSES.map((label, i) => ({ id: uid(), label, order: i }));
    }
    await setStateKey('task_statuses', updated);
    // Reset tasks that had the deleted status to the default status
    if (deleted) {
      const store = useStore.getState();
      const remaining = updated.sort((a: any, b: any) => a.order - b.order);
      const defaultLabel = remaining[0]?.label || 'Not Started';
      for (const task of S.tasks) {
        if (task.status === deleted.label) {
          await store.upsertTask({ ...task, status: defaultLabel });
        }
      }
    }
  }, [S.task_statuses, S.tasks, setStateKey]);

  const reorderStatuses = useCallback(async (targetId: string) => {
    if (!stDrag.id || stDrag.id === targetId || stDrag.type !== 'status') return;
    const fl = [...(S.task_statuses || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const fi = fl.findIndex((s: any) => s.id === stDrag.id);
    const ti = fl.findIndex((s: any) => s.id === targetId);
    if (fi === -1 || ti === -1) return;
    const copy = [...fl];
    const [dr] = copy.splice(fi, 1);
    copy.splice(ti, 0, dr);
    const updated = copy.map((s: any, i: number) => ({ ...s, order: i }));
    await setStateKey('task_statuses', updated);
    setStDrag({ id: null, type: null });
  }, [stDrag, S.task_statuses, setStateKey]);

  // Reorder
  const reorderMembers = useCallback(async (targetId: string) => {
    if (!stDrag.id || stDrag.id === targetId || stDrag.type !== 'member') return;
    const arr = reorderArray(S.members, stDrag.id, targetId);
    // Since members don't have an order field, we need to save the entire array order.
    // The store doesn't support bulk reorder, so we update each member's position
    // by saving them sequentially. In the legacy code, it directly mutates S.members order.
    // We'll just update the store state directly via sequential upserts.
    for (const m of arr) {
      await upsertMember(m);
    }
    setStDrag({ id: null, type: null });
  }, [stDrag, S.members, upsertMember]);

  const reorderClientsFn = useCallback(async (targetId: string) => {
    if (!stDrag.id || stDrag.id === targetId || stDrag.type !== 'client') return;
    const reordered = reorderClients(S.clients, stDrag.id, targetId);
    for (const c of reordered) {
      await upsertClient(c);
    }
    setStDrag({ id: null, type: null });
  }, [stDrag, S.clients, upsertClient]);

  const reorderMoods = useCallback(async (targetId: string) => {
    if (!stDrag.id || stDrag.id === targetId || stDrag.type !== 'mood') return;
    const arr = reorderArray(S.moods, stDrag.id, targetId);
    await setMoods(arr);
    setStDrag({ id: null, type: null });
  }, [stDrag, S.moods, setMoods]);

  const reorderTags = useCallback(async (targetId: string) => {
    if (!stDrag.id || stDrag.id === targetId || stDrag.type !== 'tag') return;
    const arr = reorderArray(S.tags, stDrag.id, targetId);
    // Tags don't have order either. Re-order via sequential upserts.
    for (const t of arr) {
      await upsertTag(t);
    }
    setStDrag({ id: null, type: null });
  }, [stDrag, S.tags, upsertTag]);

  const reorderFreqTags = useCallback(async (targetId: string) => {
    if (!ftDragId || ftDragId === targetId) return;
    const fl = [...(S.freqTags || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const fi = fl.findIndex((f: any) => f.id === ftDragId);
    const ti = fl.findIndex((f: any) => f.id === targetId);
    if (fi === -1 || ti === -1) return;
    const copy = [...fl];
    const [dr] = copy.splice(fi, 1);
    copy.splice(ti, 0, dr);
    const updated = copy.map((f: any, i: number) => ({ ...f, order: i }));
    await setStateKey('freqTags', updated);
    setFtDragId(null);
  }, [ftDragId, S.freqTags, setStateKey]);

  const reorderNav = useCallback(async (targetId: string) => {
    if (!navDragId || navDragId === targetId) return;
    const order = [...(S.navOrder || [])];
    const fi = order.indexOf(navDragId);
    const ti = order.indexOf(targetId);
    if (fi < 0 || ti < 0) return;
    const [dr] = order.splice(fi, 1);
    order.splice(ti, 0, dr);
    await setNavOrder(order);
    setNavDragId(null);
  }, [navDragId, S.navOrder, setNavOrder]);

  const renameNav = useCallback(async (id: string, label: string) => {
    const labels = { ...(S.navLabels || {}), [id]: label.trim() || id };
    await setNavLabels(labels);
  }, [S.navLabels, setNavLabels]);

  return {
    S, stDrag, navDragId, ftDragId,
    setStDrag, setNavDragId, setFtDragId,
    saveMember, delMember,
    saveClient, delClient,
    saveMood, toggleMoodHidden,
    addTag, saveTag, delTag,
    addFreqTag, saveFreqTag, delFreqTag,
    addStatus, saveStatus, delStatus, reorderStatuses,
    reorderMembers, reorderClientsFn, reorderMoods, reorderTags, reorderFreqTags, reorderNav, renameNav,
    resetNav, updateSettings, exportJSON, importJSON,
  };
}
