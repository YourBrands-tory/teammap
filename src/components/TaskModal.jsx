import { useEffect, useState, useRef, useCallback } from 'react';
import { COLORS, today, uid } from '../lib/constants';
import { useStore, sel } from '../store/useStore';
import { getStatusMaps, getDefaultStatus, getCompleteStatus, getPassStatus, canDeleteTask } from '../utils/statusUtils';
import Avatar from './Avatar';

const DRAFT_KEY = 'tm_task_draft';

function loadDraft(taskId) {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d._taskId === taskId ? d : null;
  } catch { return null; }
}

function saveDraft(data) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch {}
}

function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
}

export default function TaskModal({ task = {}, onClose, onSave, fromCellText = '', onSaveAsTemplate, readonlyAssignee = false }) {
  const S = useStore(s => s.S);
  const session = useStore(s => s.session);
  const { STATS } = getStatusMaps(S.task_statuses);
  const upsertTask = useStore(s => s.upsertTask);
  const upsertTag = useStore(s => s.upsertTag);
  const upsertMilestone = useStore(s => s.upsertMilestone);
  const softDeleteTask = useStore(s => s.softDeleteTask);

  const isEdit = !!task.id;
  const draftId = task.id || '__new__';
  const draft = useRef(loadDraft(draftId));

  const initVal = (field, fallback) => draft.current?.[field] ?? fallback;

  const [name, setName] = useState(initVal('name', task.name || ''));
  const [mood, setMood] = useState(initVal('mood', task.mood || ''));
  const [assigned, setAssigned] = useState(initVal('assigned', task.assignedTo ? [...task.assignedTo] : []));
  const [clientId, setClientId] = useState(initVal('clientId', task.clientId || ''));
  const [date, setDate] = useState(initVal('date', task.date || today()));
  const [status, setStatus] = useState(initVal('status', task.status || getDefaultStatus(S.task_statuses)));
  const [estH, setEstH] = useState(initVal('estH', task.estH || ''));
  const [estM, setEstM] = useState(initVal('estM', task.estM || ''));
  const [notes, setNotes] = useState(initVal('notes', task.notes || ''));
  const [tags, setTags] = useState(initVal('tags', task.tags ? [...task.tags] : []));
  const [newTag, setNewTag] = useState('');
  const [isMs, setIsMs] = useState(initVal('isMs', !!task.isMilestone));
  const [msId, setMsId] = useState(initVal('msId', task.milestoneId || ''));
  const [err, setErr] = useState({});
  const [subtasks, setSubtasks] = useState(initVal('subtasks', task.subtasks ? task.subtasks.map(s => ({ ...s })) : []));
  const [links, setLinks] = useState(initVal('links', task.links ? task.links.map(l => ({ ...l })) : []));
  const [newSubtask, setNewSubtask] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const loadTaskActivity = useStore(s => s.loadTaskActivity);
  const [tDetailTab, setTDetailTab] = useState('sub');
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState([]);
  const notesRef = useRef(null);
  const taskNameRef = useRef(null);

  const [tab, setTab] = useState('essentials');
  const hasDetailContent = isEdit && (task.notes || (task.tags?.length > 0) || (task.subtasks?.length > 0) || (task.links?.length > 0));

  const resizeNotes = () => {
    const el = notesRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };

  const handleClose = useCallback(() => {
    clearDraft();
    onClose();
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => {
      const target = e.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;
      if (isTyping) return;
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEsc);
    };
  }, [handleClose]);

  useEffect(() => { resizeNotes(); }, [notes]);

  useEffect(() => { taskNameRef.current?.focus(); }, []);

  useEffect(() => {
    if (task.id) loadTaskActivity(task.id).then(setActivity);
  }, [task.id, loadTaskActivity]);

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    const d = Math.floor(h / 24);
    return d + 'd ago';
  }

  function fmtDT(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  function actDesc(a) {
    const n = a.userName;
    switch (a.action) {
      case 'created': return n + ' created this task';
      case 'updated': return n + ' changed title';
      case 'status_changed': return n + ' changed status' + (a.newValue ? ' to ' + a.newValue : '');
      case 'marked_for_review': return n + ' marked this task for review';
      case 'mood_changed': return n + ' changed mood';
      case 'date_changed': return n + ' changed date' + (a.newValue ? ' to ' + a.newValue : '');
      case 'notes_updated': return n + ' updated notes';
      case 'client_changed': return n + ' changed client';
      case 'assigned_changed': return n + ' updated assignees';
      case 'hidden': return n + ' hid this task';
      case 'unhidden': return n + ' unhid this task';
      case 'deleted': return n + ' moved this task to deleted';
      case 'recovered': return n + ' recovered this task';
      case 'subtask_added': return n + ' added subtask' + (a.newValue ? ' "' + a.newValue + '"' : '');
      case 'subtask_completed': return n + ' completed subtask' + (a.newValue ? ' "' + a.newValue + '"' : '');
      case 'subtask_deleted': return n + ' removed subtask' + (a.oldValue ? ' "' + a.oldValue + '"' : '');
      case 'link_added': return n + ' added link' + (a.newValue ? ' ' + a.newValue : '');
      case 'link_removed': return n + ' removed link' + (a.oldValue ? ' ' + a.oldValue : '');
      case 'tag_added': return n + ' added a tag';
      case 'tag_removed': return n + ' removed a tag';
      default: return n + ' performed ' + a.action;
    }
  }

  // auto-save draft on every meaningful change
  useEffect(() => {
    saveDraft({
      _taskId: draftId,
      name, mood, assigned, clientId, date, status,
      estH, estM, notes, tags, isMs, msId, subtasks, links,
      newTag, newSubtask, newLinkLabel, newLinkUrl, tDetailTab,
    });
  }, [name, mood, assigned, clientId, date, status, estH, estM, notes, tags, isMs, msId, subtasks, links, newTag, newSubtask, newLinkLabel, newLinkUrl, tDetailTab, draftId]);

  const toggle = (arr, set, id) =>
    set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  const dateOffset = (days) => {
    const d = new Date((date || today()) + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  const addTagInline = async () => {
    const label = newTag.trim();
    if (!label) return;
    let existing = S.tags.find(t => t.label.toLowerCase() === label.toLowerCase());
    if (!existing) {
      existing = { id: uid(), label, color: COLORS[S.tags.length % COLORS.length] };
      await upsertTag(existing);
    }
    if (!tags.includes(existing.id)) setTags([...tags, existing.id]);
    setNewTag('');
  };

  const addSubtaskInline = () => {
    const text = newSubtask.trim();
    if (!text) return;
    setSubtasks([...subtasks, { text, done: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (i) => {
    const next = subtasks.map((s, idx) => idx === i ? { ...s, done: !s.done } : s);
    setSubtasks(next);
    const newStatus = next.length && next.every(s => s.done) ? (S.task_statuses?.find(s => s.label === 'Complete' || s.label.toLowerCase().includes('complete'))?.label || 'Complete') : status;
    if (task.id) {
      upsertTask({
        id: task.id, createdAt: task.createdAt,
        name: name.trim(), clientId: clientId || null, date: date || today(),
        mood, assignedTo: [...assigned], tags: [...tags],
        estH: parseInt(estH) || 0, estM: parseInt(estM) || 0, notes: notes.trim(),
        subtasks: next,
        links: links.map(l => ({ ...l })),
        status: newStatus,
        isMilestone: isMs, milestoneId,
      }).catch(err => console.error('[TaskModal.toggleSubtask] upsertTask failed:', err));
    }
    if (newStatus !== status) setStatus(newStatus);
  };

  const editSubtaskText = (i, text) => {
    text = text.trim();
    if (text) {
      setSubtasks(subtasks.map((s, idx) => idx === i ? { ...s, text } : s));
    }
  };

  const delSubtask = (i) => {
    setSubtasks(subtasks.filter((_, idx) => idx !== i));
  };

  const addLinkInline = () => {
    const url = newLinkUrl.trim();
    if (!url) return;
    const label = newLinkLabel.trim();
    setLinks([...links, { label, url }]);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const delLink = (i) => {
    setLinks(links.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    setSaveError(null);
    const e = {};
    if (!name.trim()) e.name = true;
    if (!mood) e.mood = true;
    if (!assigned.length) e.assigned = true;
    setErr(e);
    if (Object.keys(e).length) return;

    // Daily task limit check
    const cStatus = getCompleteStatus(S.task_statuses);
    const pStatus = getPassStatus(S.task_statuses);
    const taskDate = date || today();
    for (const mid of assigned) {
      const member = S.members.find(m => m.id === mid);
      if (!member) continue;
      const limit = member.capacity ?? 6;
      const dailyCount = S.tasks.filter(t =>
        t.assignedTo?.includes(mid) &&
        t.date === taskDate &&
        !t.deleted &&
        t.status !== cStatus &&
        t.status !== pStatus &&
        t.id !== task.id
      ).length;
      if (dailyCount >= limit) {
        setSaveError(`${member.name} already has ${dailyCount}/${limit} tasks for ${new Date(taskDate + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.\n\nComplete, move, or unassign another task before adding a new one.`);
        return;
      }
    }

    let milestoneId = msId || null;
    if (isMs && !milestoneId) {
      const nm = await upsertMilestone({
        name, description: '', color: sel.gmood(S, mood).color || COLORS[0], assignedTo: [...assigned],
      });
      milestoneId = nm.id;
    }

    const payload = {
      ...(isEdit ? { id: task.id, createdAt: task.createdAt } : {}),
      name: name.trim(), clientId: clientId || null, date: date || today(),
      mood, status, assignedTo: [...assigned], tags: [...tags],
      estH: parseInt(estH) || 0, estM: parseInt(estM) || 0, notes: notes.trim(),
      subtasks: subtasks.map(s => ({ ...s })),
      links: links.map(l => ({ ...l })),
      isMilestone: isMs, milestoneId,
    };
    console.log('[TaskModal.save] saving', { id: payload.id, subtasks: payload.subtasks?.length, links: payload.links?.length });
    setSaving(true);
    try {
      const saved = await upsertTask(payload);
      clearDraft();
      if (onSave) onSave(saved);
      onClose();
    } catch (err) {
      const msg = err?.message || err?.error?.message || String(err);
      console.error('[TaskModal.save] FAILED:', msg);
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!confirm('Delete this task? It moves to Deleted Tasks where you can recover it.')) return;
    await softDeleteTask(task.id);
    clearDraft();
    onClose();
  };

  return (
    <div className="mbg" onMouseDown={(e)=>e.target.classList.contains('mbg')&&handleClose()}>
      <div className="modal modal-lg" onMouseDown={e=>e.stopPropagation()}>
        <h2 style={{marginBottom:4}}>{isEdit ? 'Edit task' : 'New task'}</h2>
        {fromCellText && (
          <div style={{fontSize:12,color:'var(--t2)',marginBottom:10,fontStyle:'italic'}}>
            From cell: &ldquo;{fromCellText}&rdquo;
          </div>
        )}
        <div style={{fontSize:11,color:'var(--warn)',marginBottom:10}}>* Task name, assigned to &amp; mood are required</div>

        {isEdit && (task.createdBy || task.updatedBy) && (
          <div style={{fontSize:11,color:'var(--t2)',marginBottom:10,lineHeight:1.6}}>
            {task.createdBy && <span>Created by: {S.members.find(m=>m.id===task.createdBy)?.name || 'Unknown'} &bull; {fmtDT(task.createdAt)}</span>}
            {task.createdBy && task.updatedBy && <br />}
            {task.updatedBy && task.updatedAt !== task.createdAt && <span>Last updated by: {S.members.find(m=>m.id===task.updatedBy)?.name || 'Unknown'} &bull; {fmtDT(task.updatedAt)}</span>}
          </div>
        )}

        <label className="fl" style={{marginTop:0}}>Task name *</label>
        <input ref={taskNameRef} type="text" placeholder="What needs to be done?" value={name}
          className={err.name?'req':''} onChange={e=>setName(e.target.value)} />

        {/* ── Section tabs ── */}
        <div className="modal-section-tabs">
          <button className={`modal-section-tab${tab==='essentials'?' active':''}`} onClick={()=>setTab('essentials')}>Section 1 &mdash; Essentials</button>
          <button className={`modal-section-tab${tab==='details'?' active':''}`} onClick={()=>setTab('details')}>
            Section 2 &mdash; Details
            {hasDetailContent && <span className="badge-dot" />}
          </button>
        </div>

        {/* ── Section 1 — Essentials ── */}
        <div className={`modal-section${tab==='essentials'?' active':''}`}>
          <label className="fl">Mood *</label>
          <div className="mood-pick-row" style={err.mood?{outline:'2px solid var(--warn)',borderRadius:8,padding:4}:{}}>
            {S.moods.filter(m => !m.hidden || m.id === mood).map(m => {
              const on = mood === m.id;
              return (
                <div key={m.id} className={`mood-opt-btn${on?' on':''}`}
                  style={on?{background:m.bg,color:m.color,borderColor:m.color,borderWidth:2}:{}}
                  onClick={()=>setMood(m.id)}>
                  {m.icon} {m.label}{m.max?<span style={{fontSize:9,opacity:.6}}> max{m.max}</span>:null}
                </div>
              );
            })}
          </div>

          <label className="fl">Assign to *</label>
          {readonlyAssignee ? (
            <div className="ttag-row">
              {assigned.map(id => {
                const m = S.members.find(m => m.id === id);
                return m ? (
                  <div key={id} className="ttagopt on" style={{cursor:'default',opacity:0.8}}>
                    <Avatar name={m.name} color={m.color} size={16} /> {m.name}
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <div className="ttag-row" style={err.assigned?{outline:'2px solid var(--warn)',borderRadius:8,padding:4}:{}}>
              {S.members.map(m => (
                <div key={m.id} className={`ttagopt${assigned.includes(m.id)?' on':''}`}
                  onClick={()=>toggle(assigned,setAssigned,m.id)}>
                  <Avatar name={m.name} color={m.color} size={16} /> {m.name}
                </div>
              ))}
            </div>
          )}

          <label className="fl">Client / Project</label>
          <div className="ttag-row">
            {sel.scl(S).map(c => {
              const on = clientId === c.id;
              return (
                <div key={c.id} onClick={()=>setClientId(on?'':c.id)}
                  className={`ttagopt${on?' on':''}`}
                  style={on?{borderColor:c.color,background:c.color+'18',color:c.color}:{}}>
                  {c.name}
                </div>
              );
            })}
          </div>

          <label className="fl">Date</label>
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6,flexWrap:'wrap'}}>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:150}} />
            <button className="btn btn-xs" onClick={()=>setDate(today())}>Today</button>
            <button className="btn btn-xs" onClick={()=>dateOffset(1)}>Tomorrow</button>
            <button className="btn btn-xs" onClick={()=>dateOffset(-1)}>Yesterday</button>
          </div>

          <div style={{display:'flex',gap:16,alignItems:'flex-start',marginTop:6}}>
            <div style={{flex:1,minWidth:0}}>
              <label className="fl" style={{marginTop:0}}>Status</label>
              <select value={status} onChange={e=>{
                setStatus(e.target.value);
                if (task.id) upsertTask({ ...task, status: e.target.value }).catch(err => console.error('[TaskModal] status upsertTask failed:', err));
              }} style={{width:'100%',maxWidth:200}}>
                {STATS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{flexShrink:0}}>
              <label className="fl" style={{marginTop:0}}>Est. time</label>
              <div style={{display:'flex',gap:6,alignItems:'center',marginTop:6}}>
                <input type="number" min="0" max="99" placeholder="0" value={estH}
                  onChange={e=>setEstH(e.target.value)} style={{width:58}} /> <span style={{fontSize:12,color:'var(--t2)'}}>h</span>
                <input type="number" min="0" max="59" placeholder="0" value={estM}
                  onChange={e=>setEstM(e.target.value)} style={{width:58}} /> <span style={{fontSize:12,color:'var(--t2)'}}>m</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2 — Details ── */}
        <div className={`modal-section${tab==='details'?' active':''}`}>
          <label className="fl">Notes</label>
          <textarea ref={notesRef} placeholder="Notes…" value={notes}
            onChange={e=>setNotes(e.target.value)} onInput={resizeNotes}
            style={{minHeight:60,marginTop:6,overflow:'hidden',resize:'none'}} />

          <label className="fl">Tags</label>
          <div className="tag-chip-pick">
            {(S.tags||[]).map(tg => (
              <div key={tg.id} className={`tcp${tags.includes(tg.id)?' on':''}`}
                onClick={()=>toggle(tags,setTags,tg.id)}>{tg.label}</div>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
            <input type="text" placeholder="Type new tag + Enter" value={newTag}
              onChange={e=>setNewTag(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addTagInline(); } }}
              style={{flex:1,padding:'5px 9px'}} />
            <button className="btn btn-sm" onClick={addTagInline}>+ Tag</button>
          </div>

          {/* ── Subtasks, Links & Activity tabs ── */}
          <div className="tdetail-tabs">
            <div className={`tdetail-tab${tDetailTab==='sub'?' active':''}`} onClick={()=>setTDetailTab('sub')}>
              ☑ Subtasks {subtasks.length ? `(${subtasks.filter(s=>s.done).length}/${subtasks.length})` : ''}
            </div>
            <div className={`tdetail-tab${tDetailTab==='links'?' active':''}`} onClick={()=>setTDetailTab('links')}>
              🔗 Links {links.length ? `(${links.length})` : ''}
            </div>
            <div className={`tdetail-tab${tDetailTab==='act'?' active':''}`} onClick={()=>setTDetailTab('act')}>
              📋 Activity {activity.length ? `(${activity.length})` : ''}
            </div>
          </div>

          {/* ── Subtasks tab content ── */}
          <div className={`tdetail-tab-content${tDetailTab==='sub'?' active':''}`}>
            {subtasks.length > 0 && (
              <div className="subtask-progress-mini">
                <div className="subtask-bar-track">
                  <div className="subtask-bar-fill" style={{width:`${Math.round(subtasks.filter(s=>s.done).length/subtasks.length*100)}%`}} />
                </div>
                <span style={{fontSize:11,color:'var(--t2)',fontWeight:700,whiteSpace:'nowrap'}}>
                  {subtasks.filter(s=>s.done).length}/{subtasks.length}
                </span>
              </div>
            )}
            <div>
              {subtasks.map((s, i) => (
                <div key={i} className={`subtask-row${s.done?' done':''}`}>
                  <div className={`subtask-check${s.done?' checked':''}`} onClick={()=>toggleSubtask(i)}>
                    {s.done ? '✓' : ''}
                  </div>
                  <span className="subtask-text"
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => editSubtaskText(i, e.currentTarget.textContent)}
                    onKeyDown={(e) => { if(e.key==='Enter'){ e.preventDefault(); e.currentTarget.blur(); } }}>
                    {s.text}
                  </span>
                  <button className="subtask-del" onClick={()=>delSubtask(i)}>✕</button>
                </div>
              ))}
            </div>
            <div className="subtask-add-row">
              <input type="text" placeholder="Add a subtask + Enter" value={newSubtask}
                onChange={e=>setNewSubtask(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addSubtaskInline();}}}
                style={{flex:1,fontSize:13}} />
              <button className="btn btn-sm" onClick={addSubtaskInline}>+ Add</button>
            </div>
          </div>

          {/* ── Links tab content ── */}
          <div className={`tdetail-tab-content${tDetailTab==='links'?' active':''}`}>
            <div>
              {links.map((l, i) => {
                let safeUrl = l.url;
                if (!/^https?:\/\//i.test(safeUrl)) safeUrl = 'https://' + safeUrl;
                return (
                  <div key={i} className="link-row">
                    <span style={{flexShrink:0}}>🔗</span>
                    <a href={safeUrl} target="_blank" rel="noopener noreferrer">{l.label || l.url}</a>
                    <button className="link-del" onClick={()=>delLink(i)}>✕</button>
                  </div>
                );
              })}
            </div>
            <div className="link-add-row">
              <input type="text" placeholder="Label (optional)" value={newLinkLabel}
                onChange={e=>setNewLinkLabel(e.target.value)} style={{width:140,fontSize:12}} />
              <input type="text" placeholder="https://…" value={newLinkUrl}
                onChange={e=>setNewLinkUrl(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addLinkInline();}}}
                style={{flex:1,fontSize:12}} />
              <button className="btn btn-sm" onClick={addLinkInline}>+ Add</button>
            </div>
          </div>

          {/* ── Activity tab content ── */}
          <div className={`tdetail-tab-content${tDetailTab==='act'?' active':''}`}>
            {activity.length === 0 && (
              <div style={{fontSize:12,color:'var(--t3)',padding:'12px 0'}}>No activity yet.</div>
            )}
            {activity.map(a => (
              <div key={a.id} style={{display:'flex',alignItems:'baseline',gap:8,padding:'5px 0',fontSize:12,borderBottom:'1px solid var(--b3)'}}>
                <span style={{color:'var(--t3)',whiteSpace:'nowrap',flexShrink:0}}>{timeAgo(a.createdAt)}</span>
                <span style={{color:'var(--t1)'}}>{actDesc(a)}</span>
              </div>
            ))}
          </div>

          <div style={{marginTop:12,display:'flex',alignItems:'center',gap:8}}>
            <input type="checkbox" id="tms" checked={isMs} onChange={e=>setIsMs(e.target.checked)} />
            <label htmlFor="tms" style={{fontSize:13,fontWeight:600,cursor:'pointer'}}>Milestone task</label>
          </div>
          {(isMs || msId) && (
            <div>
              <label className="fl">Link to milestone</label>
              <select value={msId} onChange={e=>setMsId(e.target.value)}>
                <option value="">— None —</option>
                {S.milestones.filter(m=>!m.deleted).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {saveError && <div style={{marginTop:10,padding:'8px 12px',background:'#d32f2f22',border:'1px solid #d32f2f',borderRadius:6,color:'#d32f2f',fontSize:13,fontWeight:600}}>
          Save failed: {saveError}
        </div>}
        <div className="modal-footer">
          <div className="modal-footer-left">
            {isEdit && canDeleteTask(session, task) && <button className="btn btn-d" onClick={del}>🗑 Delete</button>}
            <button className="modal-close-text" onClick={handleClose}>Close</button>
          </div>
          <div className="modal-footer-right">
            {onSaveAsTemplate && (
              <button className="btn btn-outline" onClick={() => onSaveAsTemplate({
                name, clientId, mood, assignedTo: [...assigned],
                estH: parseInt(estH) || 0, estM: parseInt(estM) || 0,
                notes, tags: [...tags],
                subtasks: subtasks.map(s => ({ ...s })),
                links: links.map(l => ({ ...l })),
              })}>Save as Template</button>
            )}
            <button className="btn btn-p" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save task'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
