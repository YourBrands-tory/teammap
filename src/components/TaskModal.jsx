import { useEffect, useState } from 'react';
import { STATS, COLORS, today, uid } from '../lib/constants';
import { useStore, sel } from '../store/useStore';
import Avatar from './Avatar';

/*
  Port of openTaskModal + saveTask.
  Pass `task` (a partial task, e.g. { mood, assignedTo, date }) for "new", or a
  full task with `id` for "edit". `onClose` closes the modal.
*/
export default function TaskModal({ task = {}, onClose, onSave }) {
  const S = useStore(s => s.S);
  const upsertTask = useStore(s => s.upsertTask);
  const upsertTag = useStore(s => s.upsertTag);
  const upsertMilestone = useStore(s => s.upsertMilestone);
  const softDeleteTask = useStore(s => s.softDeleteTask);

  const isEdit = !!task.id;
  const [name, setName] = useState(task.name || '');
  const [mood, setMood] = useState(task.mood || '');
  const [assigned, setAssigned] = useState(task.assignedTo ? [...task.assignedTo] : []);
  const [clientId, setClientId] = useState(task.clientId || '');
  const [date, setDate] = useState(task.date || today());
  const [status, setStatus] = useState(task.status || 'Not Started');
  const [estH, setEstH] = useState(task.estH || '');
  const [estM, setEstM] = useState(task.estM || '');
  const [notes, setNotes] = useState(task.notes || '');
  const [tags, setTags] = useState(task.tags ? [...task.tags] : []);
  const [newTag, setNewTag] = useState('');
  const [isMs, setIsMs] = useState(!!task.isMilestone);
  const [msId, setMsId] = useState(task.milestoneId || '');
  const [err, setErr] = useState({});

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

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

  const save = async () => {
    const e = {};
    if (!name.trim()) e.name = true;
    if (!mood) e.mood = true;
    if (!assigned.length) e.assigned = true;
    setErr(e);
    if (Object.keys(e).length) return;

    let milestoneId = msId || null;
    if (isMs && !milestoneId) {
      const nm = await upsertMilestone({
        name, description: '', color: sel.gmood(S, mood).color || COLORS[0], assignedTo: [...assigned],
      });
      milestoneId = nm.id;
    }

    const saved = await upsertTask({
      ...(isEdit ? { id: task.id, createdAt: task.createdAt } : {}),
      name: name.trim(), clientId: clientId || null, date: date || today(),
      mood, status, assignedTo: [...assigned], tags: [...tags],
      estH: parseInt(estH) || 0, estM: parseInt(estM) || 0, notes: notes.trim(),
      isMilestone: isMs, milestoneId,
    });
    if (onSave) onSave(saved);
    onClose();
  };

  const del = async () => {
    if (!confirm('Delete this task? It moves to Deleted Tasks where you can recover it.')) return;
    await softDeleteTask(task.id);
    onClose();
  };

  return (
    <div className="mbg" onMouseDown={(e)=>e.target.classList.contains('mbg')&&onClose()}>
      <div className="modal modal-lg" onMouseDown={e=>e.stopPropagation()}>
        <h2 style={{marginBottom:12}}>{isEdit ? 'Edit task' : 'New task'}</h2>
        <div style={{fontSize:11,color:'var(--warn)',marginBottom:10}}>* Task name, assigned to &amp; mood are required</div>

        <label className="fl" style={{marginTop:0}}>Task name *</label>
        <input type="text" placeholder="What needs to be done?" value={name}
          className={err.name?'req':''} onChange={e=>setName(e.target.value)} autoFocus />

        <label className="fl">Mood *</label>
        <div className="mood-pick-row" style={err.mood?{outline:'2px solid var(--warn)',borderRadius:8,padding:4}:{}}>
          {S.moods.map(m => {
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
        <div className="ttag-row" style={err.assigned?{outline:'2px solid var(--warn)',borderRadius:8,padding:4}:{}}>
          {S.members.map(m => (
            <div key={m.id} className={`ttagopt${assigned.includes(m.id)?' on':''}`}
              onClick={()=>toggle(assigned,setAssigned,m.id)}>
              <Avatar name={m.name} color={m.color} size={16} /> {m.name}
            </div>
          ))}
        </div>

        <label className="fl">Client / Project</label>
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginTop:6}}>
          {sel.scl(S).map(c => {
            const on = clientId === c.id;
            return (
              <div key={c.id} onClick={()=>setClientId(on?'':c.id)}
                style={{flexShrink:0,padding:'4px 11px',borderRadius:20,
                  border:`1.5px solid ${on?c.color:'var(--border)'}`,
                  background:on?c.color+'18':'var(--s2)', color:on?c.color:'var(--t2)',
                  fontSize:12,fontWeight:on?700:500,cursor:'pointer',whiteSpace:'nowrap'}}>
                {c.name}
              </div>
            );
          })}
        </div>

        <label className="fl">Date</label>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6,flexWrap:'wrap'}}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:150,fontSize:13}} />
          <button className="btn btn-xs" onClick={()=>setDate(today())}>Today</button>
          <button className="btn btn-xs" onClick={()=>dateOffset(1)}>Tomorrow</button>
          <button className="btn btn-xs" onClick={()=>dateOffset(-1)}>Yesterday</button>
        </div>

        <label className="fl">Status</label>
        <select value={status} onChange={e=>setStatus(e.target.value)} style={{width:180,marginTop:6}}>
          {STATS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div style={{display:'flex',gap:12,marginTop:14,alignItems:'flex-start'}}>
          <div style={{flex:'0 0 160px'}}>
            <label className="fl" style={{marginTop:0}}>Est. time</label>
            <div style={{display:'flex',gap:6,alignItems:'center',marginTop:6}}>
              <input type="number" min="0" max="99" placeholder="0" value={estH}
                onChange={e=>setEstH(e.target.value)} style={{width:58}} /> <span style={{fontSize:12,color:'var(--t2)'}}>h</span>
              <input type="number" min="0" max="59" placeholder="0" value={estM}
                onChange={e=>setEstM(e.target.value)} style={{width:58}} /> <span style={{fontSize:12,color:'var(--t2)'}}>m</span>
            </div>
          </div>
          <div style={{flex:1}}>
            <label className="fl" style={{marginTop:0}}>Notes</label>
            <textarea placeholder="Notes…" value={notes} onChange={e=>setNotes(e.target.value)}
              style={{minHeight:52,marginTop:6}} />
          </div>
        </div>

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
            style={{flex:1,fontSize:12,padding:'5px 9px'}} />
          <button className="btn btn-sm" onClick={addTagInline}>+ Tag</button>
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

        <div className="ma">
          {isEdit && <button className="btn btn-d" onClick={del}>🗑 Delete</button>}
          <button className="btn btn-g" onClick={onClose}>Cancel</button>
          <button className="btn btn-p" onClick={save}>Save task</button>
        </div>
      </div>
    </div>
  );
}
