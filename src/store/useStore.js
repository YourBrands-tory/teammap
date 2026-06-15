import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  DMOODS, DEFAULT_NAV_ORDER, DEFAULT_NAV_LABELS, uid,
} from '../lib/constants';

/*
  This store is the React equivalent of the old global `S` object.
  - It holds the SAME shape the old render functions expected
    (members, clients, links, tasks, milestones, moods, tags, settings, ...).
  - Components read from it; "render functions" become components that map over the same fields.
  - Every mutation updates local state immediately (optimistic) AND writes the
    changed row(s) to Supabase. This replaces the old localStorage `save()`.

  Heavy/queryable data lives in real tables (members, clients, links, tasks,
  milestones, tags). Config singletons (settings, moods, navOrder/navLabels,
  freqTags, templates, playground, tg2Views, lineUpOrder, lineUpHidden) live in
  one key/value table `app_state` as jsonb — keeps the schema small.
*/

// ── row <-> in-memory mappers ────────────────────────────────────────────────
const taskFromRow = (r) => ({
  id:r.id, name:r.name, clientId:r.client_id, date:r.date, mood:r.mood,
  status:r.status, assignedTo:r.assigned_to||[], tags:r.tags||[],
  estH:r.est_h||0, estM:r.est_m||0, notes:r.notes||'',
  isMilestone:!!r.is_milestone, milestoneId:r.milestone_id||null,
  deleted:!!r.deleted, createdAt:Number(r.created_at)||Date.now(), updatedAt:Number(r.updated_at)||Date.now(),
});
const taskToRow = (t) => ({
  id:t.id, name:t.name, client_id:t.clientId||null, date:t.date, mood:t.mood,
  status:t.status, assigned_to:t.assignedTo||[], tags:t.tags||[],
  est_h:t.estH||0, est_m:t.estM||0, notes:t.notes||'',
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

// keys stored in app_state
const STATE_KEYS = ['settings','moods','navOrder','navLabels','freqTags','templates','playground','tg2Views','lineUpOrder','lineUpHidden'];

const EMPTY_S = {
  members:[], clients:[], links:[], tasks:[], milestones:[], tags:[],
  moods: JSON.parse(JSON.stringify(DMOODS)),
  settings:{ maxCap:6, weekends:false, spMember:null },
  navOrder:[...DEFAULT_NAV_ORDER], navLabels:{...DEFAULT_NAV_LABELS},
  freqTags:[], templates:[], playground:{ tabs:[{ id:'pg1', name:'Sheet 1', data:{} }] },
  tg2Views:[], lineUpOrder:{}, lineUpHidden:{},
};

export const useStore = create((set, get) => ({
  // session / auth
  session: null,
  role: null,        // 'admin' | 'member'
  memberId: null,    // for member views: which member this user maps to
  loading: true,
  saveFlash: 0,      // bump to flash the "saved" badge

  // the S object
  S: JSON.parse(JSON.stringify(EMPTY_S)),

  setSession: (session) => set({ session }),

  // ── boot: pull profile + all data ─────────────────────────────────────────
  loadAll: async () => {
    set({ loading: true });
    const { data: sess } = await supabase.auth.getSession();
    const session = sess?.session || null;
    if (!session) { set({ session:null, loading:false }); return; }

    // profile -> role + member mapping
    let role='admin', memberId=null;
    try {
      const { data: prof } = await supabase.from('profiles')
        .select('role, member_id').eq('id', session.user.id).maybeSingle();
      if (prof) { role = prof.role || 'admin'; memberId = prof.member_id || null; }
    } catch (e) { console.error('profile load', e); }

    const [members, clients, links, tasks, milestones, tags, st] = await Promise.all([
      supabase.from('members').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('links').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('milestones').select('*'),
      supabase.from('tags').select('*'),
      supabase.from('app_state').select('*'),
    ]);

    const S = JSON.parse(JSON.stringify(EMPTY_S));
    S.members    = (members.data||[]).map(memberFromRow);
    S.clients    = (clients.data||[]).map(clientFromRow);
    S.links      = (links.data||[]).map(linkFromRow);
    S.tasks      = (tasks.data||[]).map(taskFromRow);
    S.milestones = (milestones.data||[]).map(msFromRow);
    S.tags       = (tags.data||[]).map(tagFromRow);
    (st.data||[]).forEach(r => { if (STATE_KEYS.includes(r.key)) S[r.key] = r.value; });
    if (!S.moods || !S.moods.length) S.moods = JSON.parse(JSON.stringify(DMOODS));
    if (!S.settings) S.settings = { maxCap:6, weekends:false, spMember:S.members[0]?.id || null };
    if (S.settings.spMember == null) S.settings.spMember = S.members[0]?.id || null;

    set({ S, session, role, memberId, loading:false });
  },

  flashSaved: () => set((s)=>({ saveFlash: s.saveFlash+1 })),

  // ── generic helpers ───────────────────────────────────────────────────────
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
    const t = { estH:0, estM:0, tags:[], assignedTo:[], notes:'', status:'Not Started',
      isMilestone:false, milestoneId:null, deleted:false, ...task };
    if (!t.id) { t.id = uid(); t.createdAt = now; }
    t.updatedAt = now;
    get()._patchS((S) => {
      const i = S.tasks.findIndex(x=>x.id===t.id);
      S.tasks = i>=0 ? S.tasks.map(x=>x.id===t.id?t:x) : [...S.tasks, t];
    });
    const { error } = await supabase.from('tasks').upsert(taskToRow(t));
    if (error) console.error('upsertTask', error);
    return t;
  },
  setTaskStatus: async (taskId, status) => {
    let updated=null;
    get()._patchS((S) => {
      S.tasks = S.tasks.map(t => t.id===taskId ? (updated={...t,status,updatedAt:Date.now()}) : t);
    });
    if (updated) {
      const { error } = await supabase.from('tasks')
        .update({ status, updated_at: updated.updatedAt }).eq('id', taskId);
      if (error) console.error('setTaskStatus', error);
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

  // ── LINKS (roles stored as jsonb on the link) ─────────────────────────────
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

  // ── JSON import / export (your admin onboarding workflow) ─────────────────
  exportJSON: () => {
    const S = get().S;
    const blob = new Blob([JSON.stringify(S, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'teammap-backup.json';
    a.click();
  },
  importJSON: async (raw) => {
    // raw = parsed legacy backup object (same shape as old S)
    const S = JSON.parse(JSON.stringify(EMPTY_S));
    Object.assign(S, raw);
    if (!S.moods || !S.moods.length) S.moods = JSON.parse(JSON.stringify(DMOODS));
    if (!S.tags) S.tags = [];
    if (!S.settings) S.settings = { maxCap:6, weekends:false, spMember:S.members?.[0]?.id||null };

    // Bulk write everything to Supabase. upsert = safe to re-run.
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

// convenience selectors (the old gm/gc/gmood/gtag etc.)
export const sel = {
  gm:  (S,id)=>S.members.find(m=>m.id===id),
  gc:  (S,id)=>S.clients.find(c=>c.id===id),
  gmood:(S,id)=>S.moods.find(m=>m.id===id)||S.moods[0],
  gtag:(S,id)=>S.tags?S.tags.find(t=>t.id===id):null,
  scl: (S)=>[...S.clients].sort((a,b)=>(a.order||0)-(b.order||0)),
  tasksOnDate:(S,d)=>S.tasks.filter(t=>t.date===d&&!t.deleted),
  tasksForMD:(S,mid,d)=>S.tasks.filter(t=>t.date===d&&!t.deleted&&t.assignedTo&&t.assignedTo.includes(mid)),
};
