import { useState } from 'react';
import { useStore, sel } from '../store/useStore';
import { today, fmtD, taskTimeStr, STC, STB } from '../lib/constants';
import Avatar from '../components/Avatar';
import TaskModal from '../components/TaskModal';
import StatusPopup from '../components/StatusPopup';

const PRIMARY = ['top','hero','imp','creative'];
const minsOf = (t) => (t.estH||0)*60 + (t.estM||0);
const hm = (m) => m ? `${Math.floor(m/60)}h${m%60?' '+m%60+'m':''}` : null;

export default function TaskDashboard() {
  const S = useStore(s => s.S);
  const updateSettings = useStore(s => s.updateSettings);
  const [dashDate, setDashDate] = useState(today());
  const [modal, setModal] = useState(null);      // task partial/full to edit, or null
  const [stPop, setStPop] = useState(null);       // { taskId, rect }
  const [drawers, setDrawers] = useState({});      // memberId -> open?

  const shift = (days) => {
    const d = new Date(dashDate+'T12:00:00'); d.setDate(d.getDate()+days);
    setDashDate(d.toISOString().slice(0,10));
  };

  const allTasks = sel.tasksOnDate(S, dashDate);
  const total = allTasks.length;
  const done = allTasks.filter(t=>t.status==='Complete').length;
  const dayPct = total ? Math.round(done/total*100) : 0;
  const spM = sel.gm(S, S.settings.spMember) || S.members[0];

  return (
    <div className="view active" style={{display:'flex'}}>
      {/* header */}
      <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'var(--surface)',
        display:'flex',alignItems:'center',gap:10,flexShrink:0,flexWrap:'wrap'}}>
        <span className="stl" style={{whiteSpace:'nowrap'}}>Task Dashboard</span>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <button className="btn btn-sm" style={{padding:'4px 10px',fontSize:15,fontWeight:700}} onClick={()=>shift(-1)}>←</button>
          <input type="date" value={dashDate} onChange={e=>setDashDate(e.target.value)} style={{width:140,fontSize:12}} />
          <button className="btn btn-sm" style={{padding:'4px 10px',fontSize:15,fontWeight:700}} onClick={()=>shift(1)}>→</button>
        </div>
        <button className="btn btn-sm" style={{fontWeight:700}} onClick={()=>setDashDate(today())}>Today</button>
        <span style={{fontSize:12,color:'var(--t2)'}}>{fmtD(dashDate)}</span>
        <div style={{flex:1,display:'flex',alignItems:'center',gap:8,minWidth:0}}>
          <div style={{flex:1,minWidth:60,maxWidth:200}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--t3)',marginBottom:2}}>
              <span>Day progress</span>
              <span style={{fontWeight:700,color:dayPct===100?'var(--accent)':'var(--t2)'}}>{done}/{total} · {dayPct}%</span>
            </div>
            <div style={{height:6,background:'var(--s3)',borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:3,width:`${dayPct}%`,transition:'.4s',
                background:dayPct===100?'var(--accent)':dayPct>60?'var(--a2)':'var(--info)'}} />
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <span style={{fontSize:11,color:'var(--t3)'}}>Side panel:</span>
          <select style={{width:110,fontSize:12,padding:'4px 8px'}} value={S.settings.spMember||''}
            onChange={e=>updateSettings({ spMember:e.target.value })}>
            {S.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button className="btn btn-sm btn-p" onClick={()=>setModal({ date:dashDate })}>+ Quick add</button>
        </div>
      </div>

      {/* body: columns + side panel */}
      <div className="task-dash" style={{flex:1,overflow:'hidden'}}>
        <div className="task-dash-main">
          <div className="tcols">
            {S.members.map(m => (
              <TeamCol key={m.id} member={m} date={dashDate} S={S}
                drawerOpen={!!drawers[m.id]} toggleDrawer={()=>setDrawers(d=>({...d,[m.id]:!d[m.id]}))}
                onOpenTask={setModal} onStatus={setStPop} />
            ))}
          </div>
        </div>
        <div className="sp">
          <div className="sph">
            <h4>{spM ? spM.name : 'Quick View'}</h4>
            <div style={{fontSize:10,color:'var(--t3)'}}>{fmtD(dashDate)}</div>
          </div>
          <div className="spb"><SidePanel member={spM} date={dashDate} S={S} onOpenTask={setModal} /></div>
        </div>
      </div>

      {modal && <TaskModal task={modal} onClose={()=>setModal(null)} />}
      {stPop && <StatusPopup taskId={stPop.taskId} anchorRect={stPop.rect} onClose={()=>setStPop(null)} />}
    </div>
  );
}

function TeamCol({ member, date, S, drawerOpen, toggleDrawer, onOpenTask, onStatus }) {
  const allTasks = sel.tasksForMD(S, member.id, date);
  const visible = allTasks.filter(t=>t.status!=='Complete');
  const doneCount = allTasks.filter(t=>t.status==='Complete').length;
  const pct = allTasks.length ? Math.round(doneCount/allTasks.length*100) : 0;
  const barColor = pct===100?'#2d6a4f':pct>60?'#52b788':'#2196c4';
  const totalDisp = hm(allTasks.reduce((a,t)=>a+minsOf(t),0));

  const SECONDARY = S.moods.filter(m=>!PRIMARY.includes(m.id)).map(m=>m.id);
  const secTasks = visible.filter(t=>SECONDARY.includes(t.mood) && t.status!=='Stand Up');
  const suTasks = visible.filter(t=>t.status==='Stand Up');

  return (
    <div className="tcol">
      <div className="tcolh" style={{borderTop:`3px solid ${member.color}`}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
          <Avatar name={member.name} color={member.color} size={22} />
          <span style={{fontSize:12,fontWeight:800,flex:1}}>{member.name}</span>
          <span style={{fontSize:10,color:'var(--t3)'}}>{totalDisp||''}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:3}}>
          <span style={{color:'var(--t3)'}}>{visible.length} active{doneCount?` · ${doneCount}✓`:''}</span>
          <span style={{fontWeight:700,color:pct===100?'var(--accent)':'var(--t2)'}}>{pct}%</span>
        </div>
        <div style={{height:5,background:'var(--s3)',borderRadius:3,overflow:'hidden',marginBottom:4}}>
          <div style={{height:'100%',borderRadius:3,background:barColor,width:`${pct}%`,transition:'.5s'}} />
        </div>
        {secTasks.length>0 && (
          <button onClick={toggleDrawer} style={{width:'100%',padding:'2px 0',background:'var(--s3)',border:'none',
            borderRadius:4,fontSize:10,fontWeight:700,color:'var(--t2)',cursor:'pointer',fontFamily:'inherit'}}>
            {drawerOpen ? '▲ Hide rapids & others' : `+ ${secTasks.length} more (Rapids & others)`}
          </button>
        )}
      </div>

      <div className="tcolb">
        {/* Stand Up */}
        {suTasks.length>0 && (
          <div className="msec su-sec">
            <div className="su-head">🗣 Stand Up <span style={{fontSize:9,background:'var(--warn)',color:'#fff',padding:'1px 5px',borderRadius:8,marginLeft:2}}>{suTasks.length}</span></div>
            <div className="msec-tasks">{suTasks.map(t => <TCard key={t.id} task={t} member={member} S={S} onOpenTask={onOpenTask} onStatus={onStatus} />)}</div>
          </div>
        )}

        {/* Primary moods */}
        {PRIMARY.map(mid => {
          const mood = sel.gmood(S, mid); if (!mood) return null;
          const mt = visible.filter(t=>t.mood===mid && t.status!=='Stand Up');
          if ((mid==='top'||mid==='creative') && !mt.length) return null;
          const isHero=mid==='hero', isImp=mid==='imp', isTop=mid==='top';
          const secClass = isHero?'hero-sec':isImp?'imp-sec':isTop?'top-sec':'other-sec';
          const moodMins = allTasks.filter(t=>t.mood===mid).reduce((a,t)=>a+minsOf(t),0);
          const totalMoodCount = allTasks.filter(t=>t.mood===mid).length;
          const doneInMood = totalMoodCount - allTasks.filter(t=>t.mood===mid && t.status!=='Complete').length;
          const secStyle = isHero?{background:mood.bg,border:`2px solid ${mood.color}55`}
            : isImp?{background:mood.bg+'88',border:`1.5px solid ${mood.color}44`} : {};
          const headBg = isHero?mood.color+'15':isImp?mood.color+'10':'transparent';
          return (
            <div key={mid} className={`msec ${secClass}`} style={secStyle}>
              <div className="msec-head" style={{background:headBg}}>
                <span style={{fontSize:isHero?13:isImp?12:11}}>{mood.icon}</span>
                <span className="msec-label" style={{color:mood.color,fontSize:isHero?11:isImp?10.5:10}}>{mood.label}</span>
                <span className="msec-cnt" style={{background:mood.color+'22',color:mood.color}}>
                  {mt.length}{mood.max?`/${mood.max}`:''}{doneInMood?<span style={{opacity:.55,fontSize:8}}> {doneInMood}✓</span>:null}
                </span>
                {hm(moodMins) && <span style={{fontSize:9,color:mood.color,marginLeft:'auto',fontWeight:700,opacity:.7}}>{hm(moodMins)}</span>}
                <button onClick={(e)=>{e.stopPropagation();onOpenTask({ date, mood:mid, assignedTo:[member.id] });}}
                  style={{width:16,height:16,borderRadius:'50%',background:mood.color+'22',border:`1px solid ${mood.color}44`,
                    color:mood.color,fontSize:11,lineHeight:1,cursor:'pointer',display:'flex',alignItems:'center',
                    justifyContent:'center',flexShrink:0,padding:0,fontFamily:'inherit',marginLeft:hm(moodMins)?2:'auto'}}>+</button>
              </div>
              <div className="msec-tasks">
                {mt.length ? mt.map(t => <TCard key={t.id} task={t} member={member} S={S} onOpenTask={onOpenTask} onStatus={onStatus} />)
                  : <div style={{fontSize:10,color:'var(--t3)',padding:'5px 4px',fontStyle:'italic'}}>No active {mood.label}</div>}
              </div>
            </div>
          );
        })}

        {/* Secondary drawer */}
        {drawerOpen && secTasks.length>0 && (
          <div style={{display:'flex',flexDirection:'column',gap:3}}>
            {SECONDARY.filter(mid=>visible.some(t=>t.mood===mid && t.status!=='Stand Up')).map(mid => {
              const mood = sel.gmood(S, mid); if (!mood) return null;
              const mt = visible.filter(t=>t.mood===mid && t.status!=='Stand Up');
              return (
                <div key={mid} className="msec other-sec">
                  <div className="msec-head">
                    <span style={{fontSize:11}}>{mood.icon}</span>
                    <span className="msec-label" style={{color:mood.color,fontSize:10}}>{mood.label}</span>
                    <span className="msec-cnt" style={{background:mood.color+'22',color:mood.color}}>{mt.length}</span>
                    <button onClick={(e)=>{e.stopPropagation();onOpenTask({ date, mood:mid, assignedTo:[member.id] });}}
                      style={{width:16,height:16,borderRadius:'50%',background:mood.color+'22',border:`1px solid ${mood.color}44`,
                        color:mood.color,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
                        flexShrink:0,padding:0,fontFamily:'inherit',marginLeft:'auto'}}>+</button>
                  </div>
                  <div className="msec-tasks">{mt.map(t => <TCard key={t.id} task={t} member={member} S={S} onOpenTask={onOpenTask} onStatus={onStatus} />)}</div>
                </div>
              );
            })}
          </div>
        )}

        <button className="addbtn" style={{fontSize:11,flexShrink:0}}
          onClick={()=>onOpenTask({ date, assignedTo:[member.id] })}>+ Task</button>
      </div>
    </div>
  );
}

function TCard({ task, member, S, onOpenTask, onStatus }) {
  const mood = sel.gmood(S, task.mood);
  const isHero=task.mood==='hero', isTop=task.mood==='top', isImp=task.mood==='imp';
  const isLight=!isHero&&!isImp&&!isTop;
  const client = sel.gc(S, task.clientId);
  const timeStr = taskTimeStr(task);
  const extra = isHero?' hero':isImp?' imp-card':isTop?' top':isLight?' light':'';

  return (
    <div className={`tcard${extra}`} onClick={()=>onOpenTask(task)}>
      <div style={{display:'flex',alignItems:'flex-start',gap:4,marginBottom:2}}>
        <div className="tcn" style={{flex:1}}>{task.isMilestone?'🏁 ':''}{task.name}</div>
      </div>
      {client && <div className="tcc" style={{color:mood.color,fontWeight:600}}>{client.name}</div>}
      <div className="tcs-row">
        <span className="tcs" style={{background:STB[task.status],color:STC[task.status]}}
          onClick={(e)=>{e.stopPropagation();onStatus({ taskId:task.id, rect:e.target.getBoundingClientRect() });}}>
          {task.status} ▼
        </span>
        {timeStr && <span className="ttime">{timeStr}</span>}
      </div>
      {task.tags?.length>0 && (
        <div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:3}}>
          {task.tags.map(tid => { const tg = sel.gtag(S, tid); return tg ? <span key={tid} className="ttag-chip">{tg.label}</span> : null; })}
        </div>
      )}
      {task.assignedTo?.length>1 && (
        <div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:3}}>
          {task.assignedTo.filter(id=>id!==member.id).map(id => { const m = sel.gm(S, id); return m ? (
            <span key={id} style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:'var(--s2)',
              border:'1px solid var(--border)',fontWeight:600,color:'var(--t2)'}}>{m.name}</span>) : null; })}
        </div>
      )}
    </div>
  );
}

function SidePanel({ member, date, S, onOpenTask }) {
  if (!member) return <div style={{fontSize:12,color:'var(--t3)'}}>No member selected</div>;
  const tasks = sel.tasksForMD(S, member.id, date);
  const groups = [
    { ids:tasks.filter(t=>t.mood==='top'),   label:'🔴 Top — Urgent',         color:'#dc2626', style:{borderLeft:'3px solid #dc2626',background:'#fff8f7'}, showClientStrong:true },
    { ids:tasks.filter(t=>t.mood==='hero'),  label:'⚡ Hero',                  color:'#d97706', style:{borderLeft:'3px solid #d97706',background:'#fffbf0'} },
    { ids:tasks.filter(t=>t.mood==='rapid'), label:'💨 Rapids',               color:'#0f7c6c', style:{} },
    { ids:tasks.filter(t=>t.mood==='share'), label:'🔗 Follow-ups / Share',   color:'#2196c4', style:{borderLeft:'3px solid #2196c4'} },
  ];
  if (groups.every(g=>!g.ids.length)) {
    return <div style={{fontSize:12,color:'var(--t3)',padding:'8px 0'}}>No Top, Hero, Rapid or Follow-up tasks for this date.</div>;
  }
  return groups.filter(g=>g.ids.length).map(g => (
    <div key={g.label} className="spsec">
      <div className="spst" style={{color:g.color}}>{g.label}</div>
      {g.ids.map(t => { const c = sel.gc(S, t.clientId); return (
        <div key={t.id} className="spt" style={g.style} onClick={()=>onOpenTask(t)}>
          <div className="sptn">{t.name}</div>
          <div className="sptm">
            {c ? (g.showClientStrong ? <span style={{color:'#dc2626',fontWeight:600}}>{c.name}</span> : c.name) : ''}
            {c?' · ':''}{t.status}{taskTimeStr(t)?' · '+taskTimeStr(t):''}
          </div>
        </div>
      ); })}
    </div>
  ));
}
