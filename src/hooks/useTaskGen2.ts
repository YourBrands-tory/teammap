import { useState, useCallback, useMemo, useEffect } from 'react';
import { useStore, sel } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { uid, today } from '../lib/constants';
import { getDefaultStatus } from '../utils/statusUtils';
import type { TG2AllMulti, Template } from '../utils/taskGen2Helpers';
import {
  filterTemplatesAll, toggleMulti, saveView, loadView, deleteView,
  reorderItems, sortTemplatesByFreq,
} from '../utils/taskGen2Helpers';

export default function useTaskGen2() {
  const S = useStore(s => s.S);
  const setStateKey = useStore(s => s.setStateKey);
  const upsertTask = useStore(s => s.upsertTask);
  const upsertMilestone = useStore(s => s.upsertMilestone);
  const upsertClient = useStore(s => s.upsertClient);
  const uiViewState = useUIStore(s => s.viewStates.tg2 || {});
  const setViewState = useUIStore(s => s.setViewState);

  const [tg2Tab, setTg2Tab] = useState(uiViewState.tg2Tab || 'templates');
  const [tg2SelProject, setTg2SelProject] = useState<string | null>(uiViewState.tg2SelProject ?? null);
  const [projSortModes, setProjSortModes] = useState<Record<string, string>>(uiViewState.projSortModes || {});
  const [tg2AllMulti, setTg2AllMulti] = useState<TG2AllMulti>(uiViewState.tg2AllMulti || { freqs: [], clients: [], members: [], moods: [] });
  const [tg2AllSort, setTg2AllSort] = useState(uiViewState.tg2AllSort || 'freq');
  const [tg2ActiveView, setTg2ActiveView] = useState<number | null>(uiViewState.tg2ActiveView ?? null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [taskModal, setTaskModal] = useState<any>(null);
  const [createConfirm, setCreateConfirm] = useState<string | null>(null);

  useEffect(() => {
    setViewState('tg2', { tg2Tab, tg2SelProject, projSortModes, tg2AllMulti, tg2AllSort, tg2ActiveView });
  }, [tg2Tab, tg2SelProject, projSortModes, tg2AllMulti, tg2AllSort, tg2ActiveView, setViewState]);

  const freqTags: any[] = useMemo(() =>
    (S.freqTags || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
    [S.freqTags],
  );

  const sortedClients: any[] = useMemo(() => sel.scl(S), [S.clients]);

  const proj = tg2SelProject ? sortedClients.find((c: any) => c.id === tg2SelProject) : null;

  const projectTemplates: Template[] = useMemo(() =>
    proj ? (S.templates || []).filter((t: Template) => t.clientId === proj.id) : [],
    [S.templates, proj],
  );

  const projectSortMode = proj ? (projSortModes[proj.id] || 'freq') : 'freq';

  const sortedProjectTemplates: Template[] = useMemo(() => {
    if (!proj) return [];
    if (projectSortMode === 'freq') return sortTemplatesByFreq(projectTemplates, freqTags);
    return [...projectTemplates].sort((a, b) => a.name.localeCompare(b.name));
  }, [projectTemplates, projectSortMode, freqTags, proj]);

  const allFilteredTemplates = useMemo(() =>
    filterTemplatesAll(S.templates || [], tg2AllMulti, tg2AllSort, freqTags, S.clients, S.moods),
    [S.templates, tg2AllMulti, tg2AllSort, freqTags, S.clients, S.moods],
  );

  const tasksOnDate = useMemo(() => S.tasks.filter((t: any) => !t.deleted), [S.tasks]);

  const milestones = useMemo(() => S.milestones || [], [S.milestones]);

  // —— Project Templates actions ——
  const setProjectSort = useCallback((mode: string) => {
    if (!proj) return;
    setProjSortModes(prev => ({ ...prev, [proj.id]: mode }));
  }, [proj]);

  const openAddTemplate = useCallback((clientId: string, freqId: string) => {
    setTaskModal({ _mode: 'new', clientId, freqId, name: '', mood: 'rapid', assignedTo: [], estH: 0, estM: 0, notes: '', freqIds: [freqId] });
  }, []);

  const openEditTemplate = useCallback((tmpl: Template) => {
    setTaskModal({ _mode: 'edit', _id: tmpl.id, ...tmpl, freqIds: tmpl.freqIds || (tmpl.freqId ? [tmpl.freqId] : []) });
  }, []);

  const saveTemplate = useCallback(async (formData: any) => {
    const tmpl = {
      name: formData.name,
      clientId: formData.clientId,
      freqIds: formData.freqIds || [],
      freqId: (formData.freqIds || [])[0] || '',
      mood: formData.mood || 'rapid',
      assignedTo: [...(formData.assignedTo || [])],
      estH: formData.estH || 0,
      estM: formData.estM || 0,
      notes: formData.notes || '',
      updatedAt: Date.now(),
    };
    let updated: Template[];
    if (formData._mode === 'edit' && formData._id) {
      updated = (S.templates || []).map((t: Template) => t.id === formData._id ? { ...t, ...tmpl } : t);
    } else {
      updated = [...(S.templates || []), { id: uid(), ...tmpl, createdAt: Date.now() }];
    }
    await setStateKey('templates', updated);
  }, [S.templates, setStateKey]);

  const deleteTemplate = useCallback(async (id: string) => {
    const updated = (S.templates || []).filter((t: Template) => t.id !== id);
    await setStateKey('templates', updated);
  }, [S.templates, setStateKey]);

  const createTaskFromTemplate = useCallback(async (tmplId: string, taskDate: string) => {
    const tmpl = (S.templates || []).find((t: Template) => t.id === tmplId);
    if (!tmpl) return;
    const newTask = {
      name: tmpl.name,
      clientId: tmpl.clientId,
      date: taskDate || today(),
      mood: tmpl.mood || 'rapid',
      status: getDefaultStatus(S.task_statuses) as string,
      assignedTo: [...(tmpl.assignedTo || [])],
      tags: [],
      estH: tmpl.estH || 0,
      estM: tmpl.estM || 0,
      notes: tmpl.notes || '',
      subtasks: [],
      links: [],
      isMilestone: false,
      milestoneId: null,
    };
    await upsertTask(newTask);
    setCreateConfirm(tmplId);
    setTimeout(() => setCreateConfirm(null), 3000);
  }, [S.templates, upsertTask]);

  // —— All Templates actions ——
  const handleToggleMulti = useCallback((key: keyof TG2AllMulti, id: string) => {
    setTg2AllMulti(prev => ({ ...prev, [key]: toggleMulti(prev[key], id) }));
    setTg2ActiveView(null);
  }, []);

  const clearAllMulti = useCallback(() => {
    setTg2AllMulti({ freqs: [], clients: [], members: [], moods: [] });
    setTg2ActiveView(null);
  }, []);

  const handleSaveView = useCallback((name: string) => {
    const updated = saveView(S.tg2Views || [], name, tg2AllMulti, tg2AllSort);
    setStateKey('tg2Views', updated);
    setTg2ActiveView(updated.length - 1);
  }, [S.tg2Views, tg2AllMulti, tg2AllSort, setStateKey]);

  const handleLoadView = useCallback((i: number) => {
    const views = S.tg2Views || [];
    const v = views[i];
    if (!v) return;
    const { filters, sort } = loadView(v);
    setTg2AllMulti(filters);
    setTg2AllSort(sort);
    setTg2ActiveView(i);
  }, [S.tg2Views]);

  const handleDeleteView = useCallback((i: number) => {
    const updated = deleteView(S.tg2Views || [], i);
    setStateKey('tg2Views', updated);
    setTg2ActiveView(prev => prev === i ? null : prev);
  }, [S.tg2Views, setStateKey]);

  const handleSetAllSort = useCallback((s: string) => {
    setTg2AllSort(s);
  }, []);

  // —— Milestone Links actions ——
  const toggleMSLink = useCallback(async (msId: string, projId: string) => {
    const ms = S.milestones.find((m: any) => m.id === msId);
    if (!ms) return;
    const linked = ms.linkedClients ? [...ms.linkedClients] : [];
    const idx = linked.indexOf(projId);
    if (idx >= 0) linked.splice(idx, 1);
    else linked.push(projId);
    await upsertMilestone({ ...ms, linkedClients: linked });
  }, [S.milestones, upsertMilestone]);

  // —— Project reorder ——
  const reorderProjects = useCallback(async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const reordered = reorderItems(sortedClients, dragId, targetId);
    for (let i = 0; i < reordered.length; i++) {
      const c = reordered[i];
      const existing = S.clients.find((x: any) => x.id === c.id);
      if (existing && existing.order !== i) {
        await upsertClient({ ...existing, order: i });
      }
    }
    setDragId(null);
  }, [dragId, sortedClients, S.clients, upsertClient]);

  return {
    S, freqTags, sortedClients, proj, tasksOnDate, milestones,
    tg2Tab, tg2SelProject, projSortModes, projectSortMode,
    tg2AllMulti, tg2AllSort, tg2ActiveView,
    dragId, taskModal, createConfirm,
    sortedProjectTemplates, allFilteredTemplates,
    setTg2Tab, setTg2SelProject, setProjectSort,
    openAddTemplate, openEditTemplate, saveTemplate, deleteTemplate,
    createTaskFromTemplate,
    handleToggleMulti, clearAllMulti,
    handleSaveView, handleLoadView, handleDeleteView, handleSetAllSort,
    toggleMSLink,
    setDragId, reorderProjects, setTaskModal, setCreateConfirm,
  };
}
