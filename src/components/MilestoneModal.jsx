import { useState, useMemo } from 'react';
import { useStore, sel } from '../store/useStore';
import { today, uid, getDeadlineClass, getDeadlineLabel } from '../lib/constants';

const migrateSS = (ss) => {
  if (ss.linkedTaskId && !ss.linkedTaskIds) {
    return { ...ss, linkedTaskIds: [ss.linkedTaskId], linkedTaskId: undefined };
  }
  if (!ss.linkedTaskIds) {
    return { ...ss, linkedTaskIds: [] };
  }
  return ss;
};

export default function MilestoneModal({ milestone, onClose, onOpenTask, onCreateTaskForSubstep }) {
  const S = useStore(s => s.S);
  const upsertMilestone = useStore(s => s.upsertMilestone);
  const delMilestone = useStore(s => s.delMilestone);

  const isEdit = !!milestone;
  const [m, setM] = useState(() => milestone ? {
    ...milestone,
    substeps: (milestone.substeps || []).map(migrateSS),
    displayMode: milestone.displayMode || 'daily',
    displayDays: milestone.displayDays || [],
  } : {
    id: null, title: '', mood: '', assignedTo: [], clientId: '', date: today(), deadline: '',
    substeps: [], displayMode: 'daily', displayDays: [],
  });
  const [tab, setTab] = useState(0);
  const [expandedSS, setExpandedSS] = useState({});
  const [taskSearch, setTaskSearch] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [triedSave, setTriedSave] = useState(false);

  const subTotal = m.substeps.length;
  const subDone = m.substeps.filter(s => s.done).length;
  const subPct = subTotal ? Math.round(subDone / subTotal * 100) : 0;

  const allTasks = useMemo(() => S.tasks.filter(t => !t.deleted && t.status !== 'Complete'), [S.tasks]);

  const searchResults = useMemo(() => {
    if (!searchQ.trim()) return allTasks;
    const q = searchQ.toLowerCase();
    return allTasks.filter(t => {
      const nameMatch = t.name.toLowerCase().includes(q);
      const clientMatch = sel.gc(S, t.clientId)?.name?.toLowerCase().includes(q);
      return nameMatch || clientMatch;
    });
  }, [allTasks, searchQ, S]);

  const close = () => { onClose?.(); };

  const updateField = (field, value) => setM(prev => ({ ...prev, [field]: value }));

  const toggleAssign = (mid) => {
    setM(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(mid)
        ? prev.assignedTo.filter(id => id !== mid)
        : [...prev.assignedTo, mid]
    }));
  };

  const setClient = (cid) => {
    setM(prev => ({ ...prev, clientId: prev.clientId === cid ? '' : cid }));
  };

  const toggleSubstep = (ssId) => {
    setM(prev => ({
      ...prev,
      substeps: prev.substeps.map(s => s.id === ssId ? { ...s, done: !s.done } : s)
    }));
  };

  const updateSubstepTitle = (ssId, title) => {
    setM(prev => ({
      ...prev,
      substeps: prev.substeps.map(s => s.id === ssId ? { ...s, title } : s)
    }));
  };

  const addSubstep = () => {
    const newSs = { id: uid(), title: '', done: false, linkedTaskIds: [], showOnDashboard: false };
    setM(prev => ({ ...prev, substeps: [...prev.substeps, newSs] }));
    setExpandedSS(prev => ({ ...prev, [newSs.id]: true }));
  };

  const removeSubstep = (ssId) => {
    setM(prev => ({ ...prev, substeps: prev.substeps.filter(s => s.id !== ssId) }));
  };

  const linkTaskToSubstep = (ssId, taskId) => {
    setM(prev => ({
      ...prev,
      substeps: prev.substeps.map(s => s.id === ssId ? { ...s, linkedTaskIds: [...new Set([...(s.linkedTaskIds||[]), taskId])] } : s)
    }));
    setTaskSearch(null);
    setSearchQ('');
  };

  const unlinkFromSubstep = (ssId, taskId) => {
    setM(prev => ({
      ...prev,
      substeps: prev.substeps.map(s => s.id === ssId ? { ...s, linkedTaskIds: (s.linkedTaskIds||[]).filter(id => id !== taskId) } : s)
    }));
  };

  const toggleSSDashboard = (ssId) => {
    setM(prev => ({
      ...prev,
      substeps: prev.substeps.map(s => s.id === ssId ? { ...s, showOnDashboard: !s.showOnDashboard } : s)
    }));
  };

  const toggleDisplayDays = (day) => {
    setM(prev => ({
      ...prev,
      displayDays: prev.displayDays.includes(day)
        ? prev.displayDays.filter(d => d !== day)
        : [...prev.displayDays, day]
    }));
  };

  const save = async () => {
    if (!m.title.trim()) return;
    if (!m.mood || !m.assignedTo.length) {
      setTriedSave(true);
      return;
    }
    await upsertMilestone(m);
    close();
  };

  const handleDelete = async () => {
    await delMilestone(m.id);
    close();
  };

  const handleOpenTask = (taskId) => {
    const task = S.tasks.find(t => t.id === taskId);
    if (task && onOpenTask) onOpenTask(task);
  };

  const handleCreateAndLink = (ssId) => {
    const taskData = {
      date: m.date,
      mood: m.mood,
      assignedTo: m.assignedTo.slice(),
      clientId: m.clientId,
    };
    if (onCreateTaskForSubstep) {
      onCreateTaskForSubstep(ssId, taskData, (taskId) => {
        linkTaskToSubstep(ssId, taskId);
      });
    }
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dlClass = getDeadlineClass(m.deadline);
  const dlLabel = getDeadlineLabel(m.deadline);

  const tabs = [
    { idx: 0, label: 'Essentials' },
    { idx: 1, label: 'Substeps' + (subTotal > 0 ? ` (${subTotal})` : '') },
    { idx: 2, label: 'Settings' },
  ];

  return (
    <div className="mbg" style={{zIndex:300}} onClick={close}>
      <div className="modal modal-lg ms-modal" style={{display:'flex',flexDirection:'column',overflow:'hidden',padding:26,background:'var(--surface)',borderRadius:24}} onClick={e => e.stopPropagation()}>

        <h2 style={{marginBottom:4}}>{isEdit ? 'Edit Milestone' : 'New Milestone'}</h2>
        <div style={{fontSize:11,color:'var(--warn)',marginBottom:10}}>* Title is required</div>

        {isEdit && (milestone.createdAt || milestone.updatedAt) && (
          <div style={{fontSize:11,color:'var(--t2)',marginBottom:10,lineHeight:1.6}}>
            {milestone.createdAt && <span>Created by: {S.members.find(m=>m.id===milestone.createdBy)?.name || 'Unknown'} &bull; {fmtDT(milestone.createdAt)}</span>}
          </div>
        )}

        <label className="fl" style={{marginTop:0}}>TITLE *</label>
        <input type="text" placeholder="What's the milestone?" value={m.title}
          onChange={e=>updateField('title',e.target.value)}
          style={{width:'100%',fontSize:14,padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:'var(--r)',outline:'none',fontFamily:'inherit',background:'var(--surface)',color:'var(--text)'}}
          onFocus={e=>e.target.style.borderColor='var(--accent)'}
          onBlur={e=>e.target.style.borderColor='var(--border)'} />

        <div className="modal-section-tabs" style={{marginTop:14}}>
          {tabs.map(t => (
            <button key={t.idx} className={`modal-section-tab${tab===t.idx?' active':''}`} onClick={()=>setTab(t.idx)}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'16px 0',minHeight:220}}>

          {/* ── SLIDE 0: Essentials ── */}
          <div className={`modal-section${tab===0?' active':''}`}>
            <label className="fl">Mood *</label>
            <div className="mood-pick-row" style={triedSave&&!m.mood?{outline:'2px solid var(--warn)',borderRadius:8,padding:4}:{}}>
              {S.moods.map(mood => {
                const on = m.mood === mood.id;
                return (
                  <div key={mood.id} className={`mood-opt-btn${on?' on':''}`}
                    style={on?{background:mood.bg,color:mood.color,borderColor:mood.color,borderWidth:2}:{}}
                    onClick={() => { updateField('mood',mood.id); setTriedSave(false); }}>
                    {mood.icon} {mood.label}
                  </div>
                );
              })}
            </div>
            {triedSave && !m.mood && <div style={{fontSize:11,color:'var(--warn)',marginTop:4}}>Select a mood</div>}

            <label className="fl">Assign to *</label>
            <div className="ttag-row horizontal-scroll" style={triedSave&&!m.assignedTo.length?{outline:'2px solid var(--warn)',borderRadius:8,padding:4}:{}}>
              {S.members.map(mem => (
                <div key={mem.id} className={`ttagopt${m.assignedTo.includes(mem.id)?' on':''}`}
                  onClick={()=>{ toggleAssign(mem.id); setTriedSave(false); }}
                  style={m.assignedTo.includes(mem.id)?{borderColor:mem.color,background:mem.color+'22',color:mem.color}:{}}>
                  <span className="av" style={{width:16,height:16,borderRadius:'50%',fontSize:8,background:mem.color,color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {mem.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                  </span>
                  {mem.name}
                </div>
              ))}
            </div>
            {triedSave && !m.assignedTo.length && <div style={{fontSize:11,color:'var(--warn)',marginTop:4}}>Select at least one member</div>}

            <label className="fl">Client / Project</label>
            <div className="ttag-row horizontal-scroll">
              {sel.scl(S).map(c => {
                const on = m.clientId === c.id;
                const col = c.color || 'var(--accent)';
                return (
                  <div key={c.id} onClick={()=>setClient(c.id)}
                    className={`ms-client-chip${on?' on':''}`}
                    style={on?{borderColor:col,background:col+'18',color:col}:{}}>
                    {c.name}
                  </div>
                );
              })}
            </div>

            <label className="fl">Date</label>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6,flexWrap:'wrap'}}>
              <input type="date" value={m.date} onChange={e=>updateField('date',e.target.value)} style={{width:150}} />
              <button className="btn btn-xs" onClick={()=>updateField('date',today())}>Today</button>
              <button className="btn btn-xs" onClick={() => {
                const d = new Date(); d.setDate(d.getDate()+1);
                updateField('date',d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));
              }}>Tomorrow</button>
              <button className="btn btn-xs" onClick={() => {
                const d = new Date(); d.setDate(d.getDate()-1);
                updateField('date',d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));
              }}>Yesterday</button>
            </div>

            <label className="fl">Deadline</label>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
              <input type="date" value={m.deadline} onChange={e=>updateField('deadline',e.target.value)} style={{width:150}} />
              {m.deadline && (
                <span className={`ms-deadline-info ${dlClass}`} style={{marginTop:0,padding:'6px 10px',fontSize:11}}>
                  {dlLabel || 'Deadline set'}
                </span>
              )}
            </div>
          </div>

          {/* ── SLIDE 1: Substeps ── */}
          <div className={`modal-section${tab===1?' active':''}`} style={{position:'relative'}}>
            {subTotal > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{flex:1,height:5,background:'var(--s3)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'var(--accent)',borderRadius:3,transition:'.3s',width:`${subPct}%`}} />
                </div>
                <span style={{fontSize:11,color:'var(--t2)',fontWeight:700,whiteSpace:'nowrap'}}>{subDone}/{subTotal} done</span>
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              {m.substeps.map(ss => {
                return (
                  <div key={ss.id} className="ms-ss-card">
                    <div className="ms-ss-card-head" onClick={()=>setExpandedSS(prev=>({...prev,[ss.id]:!prev[ss.id]}))}>
                      <div className={`ms-ss-chk${ss.done?' checked':''}`} onClick={e=>{e.stopPropagation();toggleSubstep(ss.id);}}>
                        {ss.done ? '✓' : ''}
                      </div>
                      <span className={`ms-ss-title${ss.done?' done':''}`}>{ss.title || 'Untitled'}</span>
                      {ss.linkedTaskIds?.length > 0 && <span className="ms-ss-linked">🔗 {ss.linkedTaskIds.length} task{ss.linkedTaskIds.length > 1 ? 's' : ''}</span>}
                      <span className="ms-ss-expand">{expandedSS[ss.id] ? '▲' : '▼'}</span>
                    </div>
                    {expandedSS[ss.id] && (
                      <div className="ms-ss-card-body">
                        <input type="text" placeholder="Substep title" value={ss.title} onChange={e=>updateSubstepTitle(ss.id,e.target.value)} />

                        <div className="ms-ss-link-section">
                          <label className="ms-ss-link-label">LINKED TASKS</label>

                          {(ss.linkedTaskIds||[]).length > 0 && (
                            <div style={{display:'flex',flexDirection:'column',gap:4}}>
                              {(ss.linkedTaskIds||[]).map(taskId => {
                                const lt = S.tasks.find(t => t.id === taskId);
                                const tm = lt ? sel.gmood(S, lt.mood) : null;
                                const tc = lt ? sel.gc(S, lt.clientId) : null;
                                return lt ? (
                                  <div key={taskId} style={{
                                    display:'flex',alignItems:'center',gap:8,
                                    border:'1px solid var(--border)',
                                    borderLeft:`3px solid ${tm?.color||'var(--accent)'}`,
                                    borderRadius:'var(--r)',padding:'10px 12px',
                                    background:'var(--surface)',fontSize:12,
                                  }}>
                                    <span style={{fontSize:16,flexShrink:0}}>{tm?.icon||''}</span>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lt.name}</div>
                                      <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2,flexWrap:'wrap'}}>
                                        {tc && <span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:(tc.color||'var(--s2)')+'22',color:tc.color||'var(--t2)',fontWeight:600}}>{tc.name}</span>}
                                        {tm && <span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:tm.bg,color:tm.color,fontWeight:600}}>{tm.icon} {tm.label}</span>}
                                        <span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:'var(--s2)',fontWeight:600,color:'var(--t2)'}}>{lt.status}</span>
                                        <span style={{fontSize:9,color:'var(--t3)',whiteSpace:'nowrap'}}>{lt.date||''}</span>
                                      </div>
                                    </div>
                                    <div style={{display:'flex',gap:4,flexShrink:0}}>
                                      <button className="ms-ss-lp-action" title="Open task" onClick={()=>handleOpenTask(lt.id)}>✎</button>
                                      <button className="ms-ss-lp-action" title="Unlink" onClick={()=>unlinkFromSubstep(ss.id, taskId)}>⊗</button>
                                    </div>
                                  </div>
                                ) : (
                                  <span key={taskId} style={{color:'var(--warn)',fontSize:12}}>Task not found (id: {taskId})</span>
                                );
                              })}
                            </div>
                          )}

                          <div className="ms-ss-link-btns">
                            <button onClick={()=>{setTaskSearch(ss.id);setSearchQ('');}}>🔍 Link existing task</button>
                            <button onClick={()=>handleCreateAndLink(ss.id)}>+ Create new task</button>
                          </div>
                        </div>

                        {(ss.linkedTaskIds||[]).length > 0 && (
                          <div className="ms-ss-ck-row">
                            <input type="checkbox" checked={ss.showOnDashboard} onChange={()=>toggleSSDashboard(ss.id)} />
                            <span>Show on Task Dashboard</span>
                          </div>
                        )}

                        <button className="ms-ss-remove" onClick={()=>removeSubstep(ss.id)}>🗑 Remove substep</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {subTotal === 0 && (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',gap:16}}>
                <span style={{fontSize:13,color:'var(--t3)',textAlign:'center',lineHeight:1.5}}>
                  No substeps yet — break this milestone into smaller steps
                </span>
                <button className="btn btn-p" onClick={addSubstep} style={{fontSize:13,padding:'8px 16px'}}>+ Add substep</button>
              </div>
            )}
            {subTotal > 0 && (
              <button className="ms-add-ss-btn" onClick={addSubstep}>+ Add substep</button>
            )}

            {taskSearch && (
              <div className="ms-task-overlay">
                <div className="ms-to-head">
                  <input type="text" placeholder="Search tasks by name or client…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} autoFocus />
                  <button className="btn btn-sm btn-g" onClick={()=>{setTaskSearch(null);setSearchQ('');}}>Close</button>
                </div>
                <div className="ms-to-list">
                  {searchResults.map(t => {
                    const tm = sel.gmood(S, t.mood);
                    const tc = sel.gc(S, t.clientId);
                    return (
                      <div key={t.id} className="ms-task-opt" onClick={()=>linkTaskToSubstep(taskSearch, t.id)}>
                        <span className="ms-to-mood">{tm?.icon||''}</span>
                        <span className="ms-to-name">{t.name}</span>
                        {tc && <span className="ms-to-client">{tc.name}</span>}
                        <span className="ms-to-date">{t.date||''}</span>
                      </div>
                    );
                  })}
                  {searchResults.length === 0 && <span className="ms-to-empty">No tasks found</span>}
                </div>
              </div>
            )}
          </div>

          {/* ── SLIDE 2: Settings ── */}
          <div className={`modal-section${tab===2?' active':''}`}>
            <label className="fl">Show on Task Dashboard</label>
            <div className="ttag-row horizontal-scroll">
              {[
                { value: 'daily', label: '📅 Daily' },
                { value: 'specific_days', label: '📅 Specific days' },
                { value: 'hidden', label: '👁 Hidden' },
              ].map(opt => (
                <div key={opt.value}
                  className={`ttagopt${m.displayMode===opt.value?' on':''}`}
                  onClick={()=>updateField('displayMode',opt.value)}>
                  {opt.label}
                </div>
              ))}
            </div>

            {m.displayMode === 'specific_days' && (
              <>
                <label className="fl">Show on these days</label>
                <div className="ms-day-row">
                  {dayNames.map(d => (
                    <button key={d}
                      className={`ms-day-chip${m.displayDays.includes(d)?' on':''}`}
                      onClick={()=>toggleDisplayDays(d)}>
                      {d}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="fl">Deadline</label>
            <div style={{background:'var(--s2)',borderRadius:'var(--r)',padding:'12px 14px',marginTop:6}}>
              {m.deadline ? (
                <span className={`ms-deadline-info ${dlClass}`} style={{marginTop:0,padding:0,background:'transparent'}}>
                  {dlLabel || 'Deadline set'}
                </span>
              ) : (
                <span style={{fontSize:12,color:'var(--t3)',fontWeight:600}}>No deadline set</span>
              )}
            </div>

            {isEdit && (
              <div className="ms-del-section">
                {confirmDel ? (
                  <div className="ms-del-confirm">
                    <span>Delete this milestone?</span>
                    <button className="btn btn-sm btn-d" onClick={handleDelete}>Yes, delete</button>
                    <button className="btn btn-sm btn-g" onClick={()=>setConfirmDel(false)}>Cancel</button>
                  </div>
                ) : (
                  <button className="ms-del-btn" onClick={()=>setConfirmDel(true)}>🗑 Delete milestone</button>
                )}
              </div>
            )}
          </div>

        </div>

        <div className="modal-footer" style={{flexShrink:0,marginTop:0}}>
          <div className="modal-footer-left">
            {isEdit && <button className="btn btn-d" onClick={()=>setConfirmDel(true)}>🗑 Delete</button>}
            <button className="modal-close-text" onClick={close}>Close</button>
          </div>
          <div className="modal-footer-right">
            <button className="btn btn-p" onClick={save} disabled={!m.title.trim()}
              style={{opacity:m.title.trim()?1:.5}}>Save milestone</button>
          </div>
        </div>

      </div>
    </div>
  );
}

function fmtDT(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
