import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useUIStore } from './useUIStore';
import {
  DMOODS, DEFAULT_NAV_ORDER, DEFAULT_NAV_LABELS, uid,
} from '../lib/constants';

const taskFromRow = (r) => {
  const t = {
    id:r.id, name:r.name, clientId:r.client_id, date:r.date, mood:r.mood,
    status:r.status, assignedTo:r.assigned_to||[], tags:r.tags||[],
    estH:r.est_h||0, estM:r.est_m||0, notes:r.notes||'',
    subtasks:r.subtasks||[], links:r.links||[],
    createdBy:r.created_by||null,
    isMilestone:!!r.is_milestone, milestoneId:r.milestone_id||null,
    deleted:!!r.deleted, createdAt:Number(r.created_at)||Date.now(), updatedAt:Number(r.updated_at)||Date.now(),
  };
  if (t.subtasks?.length || t.links?.length) {
    console.log('[taskFromRow] loaded', t.id, { subtasks: t.subtasks.length, links: t.links.length });
  }
  return t;
};
const taskToRow = (t) => ({
  id:t.id, name:t.name, client_id:t.clientId||null, date:t.date, mood:t.mood,
  status:t.status, assigned_to:t.assignedTo||[], tags:t.tags||[],
  est_h:t.estH||0, est_m:t.estM||0, notes:t.notes||'',
  subtasks:t.subtasks||[], links:t.links||[],
  created_by:t.createdBy||null,
  is_milestone:!!t.isMilestone, milestone_id:t.milestoneId||null,
  deleted:!!t.deleted, created_at:t.createdAt||Date.now(), updated_at:t.updatedAt||Date.now(),
});
const memberFromRow = (r) => ({ id:r.id, name:r.name, role:r.role, color:r.color, capacity:r.capacity ?? 6 });
const memberToRow   = (m) => ({ id:m.id, name:m.name, role:m.role, color:m.color, capacity:m.capacity ?? 6 });
const clientFromRow = (r) => ({ id:r.id, name:r.name, industry:r.industry||'', color:r.color, order:r.ord ?? 0 });
const clientToRow   = (c) => ({ id:c.id, name:c.name, industry:c.industry||'', color:c.color, ord:c.order ?? 0 });
const linkFromRow   = (r) => ({ id:r.id, memberId:r.member_id, clientId:r.client_id, roles:r.roles||[] });
const linkToRow     = (l) => ({ id:l.id, member_id:l.memberId, client_id:l.clientId, roles:l.roles||[] });
const msFromRow     = (r) => ({ id:r.id, name:r.name, description:r.description||'', assignedTo:r.assigned_to||[], color:r.color, createdAt:Number(r.created_at)||Date.now() });
const msToRow       = (m) => ({ id:m.id, name:m.name, description:m.description||'', assigned_to:m.assignedTo||[], color:m.color, created_at:m.createdAt||Date.now() });
const tagFromRow    = (r) => ({ id:r.id, label:r.label, color:r.color });
const tagToRow      = (t) => ({ id:t.id, label:t.label, color:t.color });

const STATE_KEYS = ['settings','moods','navOrder','navLabels','freqTags','templates','playground','tg2Views','lineUpOrder','lineUpHidden'];

const EMPTY_S = {
  members:[], clients:[], links:[], tasks:[], milestones:[], tags:[],
  moods: JSON.parse(JSON.stringify(DMOODS)),
  settings:{ maxCap:6, weekends:false, spMember:null },
  navOrder:[...DEFAULT_NAV_ORDER], navLabels:{...DEFAULT_NAV_LABELS},
  freqTags:[], templates:[], playground:{ tabs:[{ id:'pg1', name:'Sheet 1', data:{} }] },
  tg2Views:[], lineUpOrder:{}, lineUpHidden:{},
};

const SESSION_KEY = 'teammap_session';

export const useStore = create((set, get) => ({
  session: null,
  role: null,
  loading: true,
  saveFlash: 0,
  _rtChannel: null,

  S: JSON.parse(JSON.stringify(EMPTY_S)),

  // ── Custom login: query members table directly — NO Supabase Auth ─────────
  login: async (selectedRole, email, password) => {
    const normalizedEmail = email?.trim()?.toLowerCase() || '';
    const normalizedPassword = password?.trim() || '';
    const roleFilter = selectedRole === 'manager' ? ['admin','manager'] : ['member'];
    const { data, error } = await supabase
      .from('members')
      .select('id, name, role, color')
      .filter('email', 'ilike', normalizedEmail)
      .eq('password', normalizedPassword)
      .in('role', roleFilter)
      .maybeSingle();

    if (error) return { error: 'Database error. Please try again.' };
    if (!data) return { error: selectedRole === 'manager'
      ? 'No manager found with that email and password.'
      : 'No member found with that email and password.' };

    const session = { memberId: data.id, role: data.role, name: data.name, color: data.color };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) { /* sessionStorage may be full or unavailable */ }

    set({ session, role: data.role, loading: true });
    await get().loadAll();
    return {};
  },

  // ── Restore session from sessionStorage on page load ──────────────────────
  restoreSession: async () => {
    let session = null;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) session = JSON.parse(raw);
    } catch (e) { /* ignore */ }

    if (session?.memberId) {
      set({ session, role: session.role, loading: true });
      await get().loadAll();
    } else {
      set({ loading: false });
    }
  },

  setSession: (session) => set({ session }),

  signOut: () => {
    useUIStore.getState().clearUIState();
    const ch = get()._rtChannel;
    if (ch) { supabase.removeChannel(ch); }
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    set({
      session: null, role: null,
      S: JSON.parse(JSON.stringify(EMPTY_S)),
      loading: false, _rtChannel: null,
    });
  },

  // ── boot: pull all data (no Supabase Auth dependency) ──────────────────────
  loadAll: async (force) => {
    const cur = get().S;
    if (!force && cur?.tasks?.length) return;
    set({ loading: true });

    if (!get().session) { set({ loading:false }); return; }

    console.log('[loadAll] fetching data…');
    const [members, clients] = await Promise.all([
      supabase.from('members').select('*'),
      supabase.from('clients').select('*'),
    ]);
    const [links, tags] = await Promise.all([
      supabase.from('links').select('*'),
      supabase.from('tags').select('*'),
    ]);
    const [tasks, milestones] = await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('milestones').select('*'),
    ]);
    const [st] = await Promise.all([
      supabase.from('app_state').select('*'),
    ]);

    console.log('[loadAll] tasks raw from DB:', tasks.data?.length, 'rows');
    if (tasks.data?.length) {
      const sample = tasks.data[0];
      console.log('[loadAll] sample task columns:', Object.keys(sample));
      console.log('[loadAll] sample subtasks:', sample.subtasks);
      console.log('[loadAll] sample links:', sample.links);
    }

    const S = JSON.parse(JSON.stringify(EMPTY_S));
    S.members    = (members.data||[]).map(memberFromRow);
    S.clients    = (clients.data||[]).map(clientFromRow);
    S.links      = (links.data||[]).map(linkFromRow);
    S.tasks      = (tasks.data||[]).map(taskFromRow);
    S.milestones = (milestones.data||[]).map(msFromRow);
    S.tags       = (tags.data||[]).map(tagFromRow);
    (st.data||[]).forEach(r => { if (STATE_KEYS.includes(r.key)) S[r.key] = r.value; });

    const subtaskCount = S.tasks.reduce((a, t) => a + (t.subtasks?.length || 0), 0);
    const linkCount = S.tasks.reduce((a, t) => a + (t.links?.length || 0), 0);
    const tasksWithSubtasks = S.tasks.filter(t => t.subtasks?.length > 0).length;
    const tasksWithLinks = S.tasks.filter(t => t.links?.length > 0).length;
    console.log('[loadAll] done', { tasks: S.tasks.length, tasksWithSubtasks, tasksWithLinks, subtasks: subtaskCount, links: linkCount });
    if (!S.moods || !S.moods.length) S.moods = JSON.parse(JSON.stringify(DMOODS));
    if (!S.settings) S.settings = { maxCap:6, weekends:false, spMember:S.members[0]?.id || null };
    if (S.settings.spMember == null) S.settings.spMember = S.members[0]?.id || null;

    set({ S, loading:false });
    get()._subscribeRealtime();
  },

  _subscribeRealtime: () => {
    const existing = get()._rtChannel;
    if (existing) { supabase.removeChannel(existing); }
    const channel = supabase.channel('tasks-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          const { new: row, eventType } = payload;
          get()._patchS((S) => {
            if (eventType === 'DELETE') {
              S.tasks = S.tasks.filter(t => t.id !== row.id);
            } else if (row) {
              const task = taskFromRow(row);
              const i = S.tasks.findIndex(t => t.id === task.id);
              if (i >= 0) { S.tasks[i] = task; }
              else { S.tasks.push(task); }
            }
          });
        }
      )
      .subscribe();
    set({ _rtChannel: channel });
  },

  flashSaved: () => set((s)=>({ saveFlash: s.saveFlash+1 })),

  _patchS: (mutator) => {
    const S = get().S;
    const next = { ...S };
    mutator(next);
    set({ S: next });
    get().flashSaved();
  },
  _persistState: async (key) => {
    const value = get().S[key];
    const { error } = await supabase.from('app_state').upsert({ key, value });
    if (error) console.error('persist', key, error);
  },

  // ── TASKS ─────────────────────────────────────────────────────────────────
  upsertTask: async (task) => {
    const now = Date.now();
    const session = get().session;
    const existing = get().S.tasks.find(x => x.id === task.id);
    const t = { estH:0, estM:0, tags:[], assignedTo:[], notes:'', status:'Not Started',
      subtasks:[], links:[], isMilestone:false, milestoneId:null, deleted:false,
      ...(existing || {}), ...task };
    const isNew = !t.id;
    if (isNew) { t.id = uid(); t.createdAt = now; t.createdBy = session?.memberId || null; }
    t.updatedAt = now;
    get()._patchS((S) => {
      const i = S.tasks.findIndex(x => x.id === t.id);
      S.tasks = i >= 0 ? S.tasks.map(x => x.id === t.id ? t : x) : [...S.tasks, t];
    });
    const row = taskToRow(t);
    console.log('[upsertTask] task.subtasks:', JSON.stringify(task.subtasks));
    console.log('[upsertTask] task.links:', JSON.stringify(task.links));
    console.log('[upsertTask] t.subtasks:', JSON.stringify(t.subtasks));
    console.log('[upsertTask] row.subtasks:', JSON.stringify(row.subtasks));
    console.log('[upsertTask] row keys:', Object.keys(row));
    let error = null, result = null;
    try {
      if (isNew) {
        console.log('[upsertTask] INSERT row:', JSON.stringify(row));
        result = await supabase.from('tasks').insert(row);
      } else {
        const { id: rowId, created_at, created_by, ...data } = row;
        console.log('[upsertTask] UPDATE data keys:', Object.keys(data));
        console.log('[upsertTask] UPDATE data.subtasks:', JSON.stringify(data.subtasks));
        console.log('[upsertTask] UPDATE data.links:', JSON.stringify(data.links));
        result = await supabase.from('tasks').update(data).eq('id', rowId);
      }
    } catch (e) {
      console.error('[upsertTask] exception:', e);
      error = e;
    }
    if (result && result.error) error = result.error;
    console.log('[upsertTask] Supabase response:', result);
    if (error) {
      console.error('[upsertTask] error:', error);
      throw error;
    }
    console.log('[upsertTask] saved OK', row.id);
    return t;
  },
  setTaskStatus: async (taskId, status) => {
    let updated=null;
    get()._patchS((S) => {
      S.tasks = S.tasks.map(t => t.id===taskId ? (updated={...t,status,updatedAt:Date.now()}) : t);
    });
    if (updated) {
      console.log('[setTaskStatus] updating', { id: taskId, status, hadSubtasks: (updated.subtasks?.length||0) > 0, hadLinks: (updated.links?.length||0) > 0 });
      const { error } = await supabase.from('tasks')
        .update({ status, updated_at: updated.updatedAt }).eq('id', taskId);
      if (error) console.error('[setTaskStatus] error', error);
    }
  },
  softDeleteTask: async (taskId) => {
    get()._patchS((S)=>{ S.tasks = S.tasks.map(t=>t.id===taskId?{...t,deleted:true,updatedAt:Date.now()}:t); });
    await supabase.from('tasks').update({ deleted:true, updated_at:Date.now() }).eq('id', taskId);
  },
  recoverTask: async (taskId) => {
    get()._patchS((S)=>{ S.tasks = S.tasks.map(t=>t.id===taskId?{...t,deleted:false,updatedAt:Date.now()}:t); });
    await supabase.from('tasks').update({ deleted:false, updated_at:Date.now() }).eq('id', taskId);
  },
  purgeTask: async (taskId) => {
    get()._patchS((S)=>{ S.tasks = S.tasks.filter(t=>t.id!==taskId); });
    await supabase.from('tasks').delete().eq('id', taskId);
  },

  // ── MEMBERS ───────────────────────────────────────────────────────────────
  upsertMember: async (m) => {
    if (!m.id) m={ ...m, id:uid() };
    get()._patchS((S)=>{ const i=S.members.findIndex(x=>x.id===m.id);
      S.members = i>=0 ? S.members.map(x=>x.id===m.id?m:x) : [...S.members,m]; });
    await supabase.from('members').upsert(memberToRow(m));
    return m;
  },
  delMember: async (id) => {
    get()._patchS((S)=>{ S.members=S.members.filter(x=>x.id!==id); S.links=S.links.filter(l=>l.memberId!==id); });
    await supabase.from('links').delete().eq('member_id', id);
    await supabase.from('members').delete().eq('id', id);
  },

  // ── CLIENTS ───────────────────────────────────────────────────────────────
  upsertClient: async (c) => {
    if (!c.id) c={ order:0, ...c, id:uid() };
    get()._patchS((S)=>{ const i=S.clients.findIndex(x=>x.id===c.id);
      S.clients = i>=0 ? S.clients.map(x=>x.id===c.id?c:x) : [...S.clients,c]; });
    await supabase.from('clients').upsert(clientToRow(c));
    return c;
  },
  delClient: async (id) => {
    get()._patchS((S)=>{ S.clients=S.clients.filter(x=>x.id!==id); S.links=S.links.filter(l=>l.clientId!==id); });
    await supabase.from('links').delete().eq('client_id', id);
    await supabase.from('clients').delete().eq('id', id);
  },

  // ── LINKS ─────────────────────────────────────────────────────────────────
  upsertLink: async (l) => {
    if (!l.id) l={ roles:[], ...l, id:uid() };
    get()._patchS((S)=>{ const i=S.links.findIndex(x=>x.id===l.id);
      S.links = i>=0 ? S.links.map(x=>x.id===l.id?l:x) : [...S.links,l]; });
    await supabase.from('links').upsert(linkToRow(l));
    return l;
  },
  delLink: async (id) => {
    get()._patchS((S)=>{ S.links=S.links.filter(x=>x.id!==id); });
    await supabase.from('links').delete().eq('id', id);
  },

  // ── MILESTONES ────────────────────────────────────────────────────────────
  upsertMilestone: async (m) => {
    if (!m.id) m={ assignedTo:[], description:'', ...m, id:uid(), createdAt:Date.now() };
    get()._patchS((S)=>{ const i=S.milestones.findIndex(x=>x.id===m.id);
      S.milestones = i>=0 ? S.milestones.map(x=>x.id===m.id?m:x) : [...S.milestones,m]; });
    await supabase.from('milestones').upsert(msToRow(m));
    return m;
  },
  delMilestone: async (id) => {
    get()._patchS((S)=>{ S.milestones=S.milestones.filter(x=>x.id!==id); });
    await supabase.from('milestones').delete().eq('id', id);
  },

  // ── TAGS ──────────────────────────────────────────────────────────────────
  upsertTag: async (t) => {
    if (!t.id) t={ ...t, id:uid() };
    get()._patchS((S)=>{ const i=S.tags.findIndex(x=>x.id===t.id);
      S.tags = i>=0 ? S.tags.map(x=>x.id===t.id?t:x) : [...S.tags,t]; });
    await supabase.from('tags').upsert(tagToRow(t));
    return t;
  },
  delTag: async (id) => {
    get()._patchS((S)=>{ S.tags=S.tags.filter(x=>x.id!==id); });
    await supabase.from('tags').delete().eq('id', id);
  },

  // ── CONFIG SINGLETONS (app_state) ─────────────────────────────────────────
  updateSettings: async (patch) => {
    get()._patchS((S)=>{ S.settings = { ...S.settings, ...patch }; });
    await get()._persistState('settings');
  },
  setMoods: async (moods) => { get()._patchS((S)=>{ S.moods=moods; }); await get()._persistState('moods'); },
  setNavOrder: async (order) => { get()._patchS((S)=>{ S.navOrder=order; }); await get()._persistState('navOrder'); },
  setNavLabels: async (labels) => { get()._patchS((S)=>{ S.navLabels=labels; }); await get()._persistState('navLabels'); },
  resetNav: async () => {
    get()._patchS((S)=>{ S.navOrder=[...DEFAULT_NAV_ORDER]; S.navLabels={...DEFAULT_NAV_LABELS}; });
    await get()._persistState('navOrder'); await get()._persistState('navLabels');
  },
  setStateKey: async (key, value) => { get()._patchS((S)=>{ S[key]=value; }); await get()._persistState(key); },

  // ── JSON import / export ──────────────────────────────────────────────────
  exportJSON: () => {
    const S = get().S;
    const blob = new Blob([JSON.stringify(S, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'teammap-backup.json';
    a.click();
  },
  importJSON: async (raw) => {
    const S = JSON.parse(JSON.stringify(EMPTY_S));
    Object.assign(S, raw);
    if (!S.moods || !S.moods.length) S.moods = JSON.parse(JSON.stringify(DMOODS));
    if (!S.tags) S.tags = [];
    if (!S.settings) S.settings = { maxCap:6, weekends:false, spMember:S.members?.[0]?.id||null };

    const chunks = [
      supabase.from('members').upsert((S.members||[]).map(memberToRow)),
      supabase.from('clients').upsert((S.clients||[]).map(clientToRow)),
      supabase.from('links').upsert((S.links||[]).map(linkToRow)),
      supabase.from('milestones').upsert((S.milestones||[]).map(msToRow)),
      supabase.from('tags').upsert((S.tags||[]).map(tagToRow)),
      ...(S.tasks?.length ? [supabase.from('tasks').upsert(S.tasks.map(taskToRow))] : []),
      ...STATE_KEYS.map(k => supabase.from('app_state').upsert({ key:k, value:S[k] })),
    ];
    const results = await Promise.all(chunks);
    const errs = results.map(r=>r.error).filter(Boolean);
    if (errs.length) { console.error('importJSON errors', errs); throw errs[0]; }

    set({ S });
    return true;
  },
}));

export const sel = {
  gm:  (S,id)=>S.members.find(m=>m.id===id),
  gc:  (S,id)=>S.clients.find(c=>c.id===id),
  gmood:(S,id)=>S.moods.find(m=>m.id===id)||S.moods[0],
  gtag:(S,id)=>S.tags?S.tags.find(t=>t.id===id):null,
  scl: (S)=>[...S.clients].sort((a,b)=>(a.order||0)-(b.order||0)),
  tasksOnDate:(S,d)=>S.tasks.filter(t=>t.date===d&&!t.deleted),
  tasksForMD:(S,mid,d)=>S.tasks.filter(t=>t.date===d&&!t.deleted&&t.assignedTo&&t.assignedTo.includes(mid)),
};
