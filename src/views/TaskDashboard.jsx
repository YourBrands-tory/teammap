import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { useStore, sel } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { today, fmtD, taskTimeStr } from '../lib/constants';
import { getStatusMaps, getCompleteStatus, getStandUpStatus, getReviewStatus, getPassStatus } from '../utils/statusUtils';
import Avatar from '../components/Avatar';
import TaskModal from '../components/TaskModal';
import StatusPopup from '../components/StatusPopup';
import CircProg from '../components/CircProg';
import TaskSidePanel from '../components/TaskSidePanel';

const minsOf = (t) => (t.estH||0)*60 + (t.estM||0);
const hm = (m) => m ? `${Math.floor(m/60)}h${m%60?' '+m%60+'m':''}` : null;

function getMemberStats(S, memberId, date, completeStatus, passStatus, reviewStatus) {
  const allTasks = sel.tasksForMD(S, memberId, date);
  const activeCount = S.tasks.filter(t =>
    t.assignedTo?.includes(memberId) && t.date === date && !t.deleted &&
    t.status !== completeStatus && t.status !== passStatus
  ).length;
  const reviewPendingCount = allTasks.filter(t => t.status === reviewStatus).length;
  const doneCount = allTasks.filter(t => t.status === completeStatus).length;
  const total = allTasks.length;
  const completionPercent = total ? Math.round(doneCount / total * 100) : 0;
  const estimatedTime = hm(allTasks.reduce((a, t) => a + minsOf(t), 0));
  return { activeCount, reviewPendingCount, completionPercent, estimatedTime, doneCount };
}

export default function TaskDashboard() {
  const S = useStore(s => s.S);
  const session = useStore(s => s.session);
  const isManager = session?.role === 'admin' || session?.role === 'manager';
  const completeStatus = getCompleteStatus(S.task_statuses);
  const passStatus = getPassStatus(S.task_statuses);
  const standUpStatus = getStandUpStatus(S.task_statuses);
  const reviewStatus = getReviewStatus(S.task_statuses);
  const updateSettings = useStore(s => s.updateSettings);
  const uiViewState = useUIStore(s => s.viewStates.tkd || {});
  const setViewState = useUIStore(s => s.setViewState);
  const [dashDate, setDashDate] = useState(uiViewState.dashDate || today());
  const [modal, setModal] = useState(null);
  const [stPop, setStPop] = useState(null);
  const [drawers, setDrawers] = useState(uiViewState.drawers || {});
  const [reviewFilter, setReviewFilter] = useState(uiViewState.reviewFilter || false);

  // Mobile state
  const [mobileMemberIdx, setMobileMemberIdx] = useState(0);
  const [mobileSheet, setMobileSheet] = useState(null);
  const [expandedCards, setExpandedCards] = useState(uiViewState.expandedCards || {});

  useEffect(() => {
    setViewState('tkd', { dashDate, drawers, expandedCards, reviewFilter });
  }, [dashDate, drawers, expandedCards, reviewFilter, setViewState]);

  const openTask = useCallback((t) => setModal(t), []);
  const openStatus = useCallback((s) => setStPop(s), []);
  const closeModal = useCallback(() => setModal(null), []);
  const closeStatus = useCallback(() => setStPop(null), []);

  const shift = (days) => {
    const d = new Date(dashDate+'T12:00:00'); d.setDate(d.getDate()+days);
    setDashDate(d.toISOString().slice(0,10));
  };

  const allTasks = sel.tasksOnDate(S, dashDate);
  const total = allTasks.length;
  const done = allTasks.filter(t=>t.status===completeStatus).length;
  const dayPct = total ? Math.round(done/total*100) : 0;
  const reviewCount = allTasks.filter(t=>t.status===reviewStatus).length;
  const spM = sel.gm(S, S.settings.spMember) || S.members[0];

  const mobileMember = S.members[mobileMemberIdx] || S.members[0];
  const VISIBLE_MEMBER_LIMIT = 5;
  const showMoreMembers = S.members.length > VISIBLE_MEMBER_LIMIT;
  const visibleMembers = showMoreMembers ? S.members.slice(0, VISIBLE_MEMBER_LIMIT) : S.members;

  return (
    <div className="view active" style={{display:'flex'}}>
      {/* ── DESKTOP HEADER ── */}
      <div className="td-desk-header" style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'var(--surface)',
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
        {isManager && reviewCount > 0 && (
          <button
            onClick={() => setReviewFilter(v => !v)}
            style={{
              display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:6,border:'none',
              background:reviewFilter?'var(--al)':'var(--warn)',
              color:reviewFilter?'var(--accent)':'#fff',fontSize:11,fontWeight:700,cursor:'pointer',
              fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0,
            }}
          >
            {reviewFilter ? '✕ ' : ''}Needs Review ({reviewCount})
          </button>
        )}
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <span style={{fontSize:11,color:'var(--t3)'}}>Side panel:</span>
          <select style={{width:110,fontSize:12,padding:'4px 8px'}} value={S.settings.spMember||''}
            onChange={e=>updateSettings({ spMember:e.target.value })}>
            {S.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button className="btn btn-sm btn-p" onClick={()=>setModal({ date:dashDate })}>+ Quick add</button>
        </div>
      </div>

      {/* ── DESKTOP BODY ── */}
      <div className="td-desk-body task-dash" style={{flex:1,overflow:'hidden'}}>
        <div className="task-dash-main">
          <div className="tcols">
            {S.members.map(m => (
              <TeamCol key={m.id} member={m} date={dashDate} S={S}
                reviewStatus={reviewStatus} reviewFilter={reviewFilter}
                drawerOpen={!!drawers[m.id]} toggleDrawer={()=>setDrawers(d=>({...d,[m.id]:!d[m.id]}))}
                onOpenTask={openTask} onStatus={openStatus} />
            ))}
          </div>
        </div>
        <div className="sp">
          <div className="sph">
            <h4>{spM ? spM.name : 'Quick View'}</h4>
            <div style={{fontSize:10,color:'var(--t3)'}}>{fmtD(dashDate)}</div>
          </div>
          <div className="spb"><TaskSidePanel memberId={spM?.id} date={dashDate} S={S} onOpenTask={openTask} /></div>
        </div>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="td-mobile">
        {/* Mobile header: date nav + add button */}
        <div className="td-mob-header">
          <div className="td-mob-date-row">
            <button className="td-mob-date-btn" onClick={()=>shift(-1)}>←</button>
            <input type="date" value={dashDate} onChange={e=>setDashDate(e.target.value)} className="td-mob-date-input" />
            <button className="td-mob-date-btn" onClick={()=>shift(1)}>→</button>
            <button className="td-mob-today-btn" onClick={()=>setDashDate(today())}>Today</button>
          </div>
          <button className="td-mob-add-btn" onClick={()=>setModal({ date:dashDate })}>+</button>
        </div>

        {/* Day progress */}
        <div className="td-mob-day-progress">
          <span className="td-mob-day-progress-date">{fmtD(dashDate)}</span>
          <span className="td-mob-day-progress-stats">{done}/{total} &middot; {dayPct}%</span>
          <div className="td-mob-day-progress-track">
            <div className="td-mob-day-progress-fill" style={{
              width:`${dayPct}%`,
              background:dayPct===100?'var(--accent)':dayPct>60?'var(--a2)':'var(--info)'
            }} />
          </div>
        </div>

        {/* Member selector strip */}
        <div className="td-mob-member-strip">
          {visibleMembers.map((m, i) => {
            const stats = getMemberStats(S, m.id, dashDate, completeStatus, passStatus, reviewStatus);
            return (
              <button key={m.id}
                className={`td-mob-member-chip${i === mobileMemberIdx ? ' active' : ''}`}
                onClick={() => { setMobileMemberIdx(i); setExpandedCards({}); }}>
                <Avatar name={m.name} color={m.color} size={24} />
                <span className="td-mob-member-name">{m.name.split(' ')[0]}</span>
                <div className="member-summary">
                  {stats.activeCount} active{stats.doneCount ? ` · ${stats.doneCount}✓` : ''}
                </div>
              </button>
            );
          })}
          {showMoreMembers && (
            <button className="td-mob-member-chip td-mob-member-more" onClick={() => setMobileSheet('members')}>
              <span style={{fontSize:14,fontWeight:800}}>+{S.members.length - VISIBLE_MEMBER_LIMIT}</span>
              <span className="td-mob-member-name">More</span>
            </button>
          )}
        </div>

        {/* Single member column */}
        <div className="td-mob-col">
          {mobileMember && (
            <TeamColMobile
              member={mobileMember} date={dashDate} S={S}
              expandedCards={expandedCards}
              onToggleExpand={(id) => setExpandedCards(c => ({...c, [id]: !c[id]}))}
              onOpenTask={openTask} onStatus={openStatus}
            />
          )}
        </div>
      </div>

      {/* ── MOBILE FAB ── */}
      <button className="td-fab" onClick={()=>openTask({ date:dashDate })}>+</button>

      {/* ── MOBILE BOTTOM SHEET ── */}
      {mobileSheet && (
        <div className="td-mob-sheet-overlay" onClick={() => setMobileSheet(null)}>
          <div className="td-mob-sheet" onClick={e => e.stopPropagation()}>
            <div className="td-mob-sheet-head">
              <span>{mobileSheet === 'members' ? 'All members' : 'Quick view'}</span>
              <button className="btn btn-sm btn-g" onClick={() => setMobileSheet(null)}>Close</button>
            </div>
            <div className="td-mob-sheet-body">
              {mobileSheet === 'members' ? (
                /* Full member list */
                S.members.map((m, i) => {
                  const stats = getMemberStats(S, m.id, dashDate, completeStatus, passStatus, reviewStatus);
                  const mcap = m.capacity ?? 6;
                  const mc = stats.activeCount > mcap ? '#e76f51' : stats.activeCount === mcap ? '#d97706' : 'var(--t3)';
                  return (
                    <button key={m.id}
                      className={`td-mob-member-row${i === mobileMemberIdx ? ' active' : ''}`}
                      onClick={() => { setMobileMemberIdx(i); setMobileSheet(null); setExpandedCards({}); }}>
                      <Avatar name={m.name} color={m.color} size={32} />
                      <span style={{fontWeight:600}}>{m.name}</span>
                      <span style={{fontSize:11,color:mc,fontWeight:700,marginLeft:'auto'}}>{stats.activeCount}/{mcap}</span>
                      <span style={{fontSize:12,color:'var(--t3)',marginLeft:8}}>{m.role}</span>
                    </button>
                  );
                })
              ) : (
                /* Side panel content */
                <>
                  {/* Day progress */}
                  <div className="td-mob-sheet-section">
                    <div className="td-mob-sheet-label">Day progress</div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                      <span>{done}/{total} complete</span>
                      <span style={{fontWeight:700}}>{dayPct}%</span>
                    </div>
                    <div style={{height:6,background:'var(--s3)',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:3,width:`${dayPct}%`,transition:'.4s',
                        background:dayPct===100?'var(--accent)':dayPct>60?'var(--a2)':'var(--info)'}} />
                    </div>
                  </div>

                  {/* Side panel member selector */}
                  <div className="td-mob-sheet-section">
                    <div className="td-mob-sheet-label">Quick view member</div>
                    <select style={{width:'100%',fontSize:13,padding:'8px 11px'}} value={S.settings.spMember||''}
                      onChange={e => { updateSettings({ spMember:e.target.value }); setMobileSheet(null); }}>
                      {S.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>

                  {/* Side panel content */}
                  <div className="td-mob-sheet-section" style={{flex:1,overflowY:'auto'}}>
                    <TaskSidePanel memberId={spM?.id} date={dashDate} S={S} onOpenTask={(t) => { openTask(t); setMobileSheet(null); }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE MEMBER SUMMARY STRIP ── */}
      <div className="td-mob-summary">
        <button className="td-mob-summary-btn" onClick={() => setMobileSheet('progress')}>
          <span className="td-mob-summary-pct">{dayPct}%</span>
          <span className="td-mob-summary-bar" style={{width:`${dayPct}%`,background:dayPct===100?'var(--accent)':dayPct>60?'var(--a2)':'var(--info)'}} />
        </button>
      </div>

      {modal && <TaskModal task={modal} onClose={closeModal} onSaveAsTemplate={(d) => { useUIStore.getState().triggerSaveAsTemplate(d); }} />}
      {stPop && <StatusPopup taskId={stPop.taskId} anchorRect={stPop.rect} onClose={closeStatus} />}
    </div>
  );
}

/* ── DESKTOP TEAM COL ── */
const TeamCol = memo(function TeamCol({ member, date, S, reviewStatus, reviewFilter, drawerOpen, toggleDrawer, onOpenTask, onStatus }) {
  const completeStatus = getCompleteStatus(S.task_statuses);
  const passStatus = getPassStatus(S.task_statuses);
  const standUpStatus = getStandUpStatus(S.task_statuses);
  const allTasks = sel.tasksForMD(S, member.id, date);
  const stats = getMemberStats(S, member.id, date, completeStatus, passStatus, reviewStatus);
  const baseVisible = allTasks.filter(t=>t.status!==completeStatus);
  const reviewVisible = reviewFilter ? baseVisible.filter(t=>t.status===reviewStatus) : baseVisible;
  const dailyCap = member.capacity ?? 6;
  const limitReached = stats.activeCount >= dailyCap;
  const capColor = stats.activeCount > dailyCap ? '#e76f51' : stats.activeCount === dailyCap ? '#d97706' : 'var(--t3)';
  const setToast = useUIStore(s => s.setToast);
  const handleAddTask = useCallback((moodId) => {
    if (limitReached) {
      setToast(`Task limit reached.\n\n${member.name} already has ${stats.activeCount}/${dailyCap} active tasks for today.\n\nComplete, pass, move, or reassign an existing task before creating another.`);
      return;
    }
    onOpenTask({ date, mood: moodId, assignedTo: [member.id] });
  }, [limitReached, stats.activeCount, dailyCap, member.name, date, onOpenTask, setToast]);
  const doneCount = allTasks.filter(t=>t.status===completeStatus).length;

  const primaryMoodIds = ['hero', 'imp', 'top'];
  const visibleMoods = S.moods.filter(m => m.visible);
  const hiddenMoodIds = useMemo(() => S.moods.filter(m => !m.visible).map(m => m.id), [S.moods]);
  const visibleTasks = reviewVisible.filter(t => !hiddenMoodIds.includes(t.mood));
  const suTasks = visibleTasks.filter(t=>t.status===standUpStatus);

  const overflowMoods = visibleMoods.filter(m => !primaryMoodIds.includes(m.id));
  const overflowTasks = useMemo(() => {
    return reviewVisible.filter(t =>
      t.status !== standUpStatus && (
        overflowMoods.some(m => m.id === t.mood) ||
        hiddenMoodIds.includes(t.mood)
      )
    );
  }, [reviewVisible, overflowMoods, hiddenMoodIds, standUpStatus]);

  const overflowMoodLabels = useMemo(() => {
    const labels = overflowMoods.map(m => m.label);
    if (!labels.length) return '';
    if (labels.length <= 2) return labels.join(' & ');
    return labels.slice(0, 2).join(', ') + ' & others';
  }, [overflowMoods]);

  const overflowMoodIds = useMemo(() => {
    const ids = new Set(overflowMoods.map(m => m.id));
    hiddenMoodIds.forEach(id => ids.add(id));
    return ids;
  }, [overflowMoods, hiddenMoodIds]);

  const groupedOverflowTasks = useMemo(() => {
    return overflowTasks.reduce((acc, task) => {
      const mood = task.mood;
      if (!acc[mood]) acc[mood] = [];
      acc[mood].push(task);
      return acc;
    }, {});
  }, [overflowTasks]);

  return (
    <div className="tcol">
      <div className="tcolh" style={{borderTop:`3px solid ${member.color}`}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
          <Avatar name={member.name} color={member.color} size={22} />
          <span style={{fontSize:12,fontWeight:800,flex:1}}>{member.name}</span>
          <span style={{fontSize:10,fontWeight:600,color:capColor}}>{stats.activeCount}/{dailyCap}</span>
          <span style={{fontSize:10,color:'var(--t3)',marginLeft:4}}>{stats.estimatedTime||''}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:3}}>
          <span style={{color:'var(--t3)'}}>
            {reviewVisible.length} active{doneCount?` · ${doneCount}✓`:''}
            {stats.reviewPendingCount > 0 && !reviewFilter ? <span style={{color:'var(--warn)',fontWeight:700,marginLeft:4}}>· {stats.reviewPendingCount} review{stats.reviewPendingCount>1?'s':''} pending</span> : ''}
            {reviewFilter && stats.reviewPendingCount === 0 ? <span style={{color:'var(--t2)',marginLeft:4}}>— no reviews</span> : ''}
          </span>
          <span style={{fontWeight:700,color:stats.completionPercent===100?'var(--accent)':'var(--t2)'}}>{stats.completionPercent}%</span>
        </div>
        <div style={{height:5,background:'var(--s3)',borderRadius:3,overflow:'hidden',marginBottom:4}}>
          <div style={{height:'100%',borderRadius:3,background:stats.completionPercent===100?'#2d6a4f':stats.completionPercent>60?'#52b788':'#2196c4',width:`${stats.completionPercent}%`,transition:'.5s'}} />
        </div>
      </div>

      <div className="tcolb">
        {overflowTasks.length > 0 && (
          <div>
            <button
              onClick={toggleDrawer}
              style={{
                width:'100%',display:'flex',alignItems:'center',gap:6,padding:'5px 8px',
                border:'1px dashed var(--border)',borderRadius:6,background:'transparent',
                color:'var(--t2)',fontSize:11,fontWeight:600,cursor:'pointer',
                fontFamily:'inherit',textAlign:'left',
              }}>
              {drawerOpen ? '▲ Hide' : `+${overflowTasks.length} more`}
              {overflowMoodLabels ? <span style={{color:'var(--t3)',fontWeight:400}}>({overflowMoodLabels})</span> : null}
            </button>
            {drawerOpen && S.moods.filter(m => overflowMoodIds.has(m.id)).map(mood => {
              const moodTasks = groupedOverflowTasks[mood.id] || [];
              if (!moodTasks.length) return null;
              const mid = mood.id;
              const moodMins = allTasks.filter(t=>t.mood===mid).reduce((a,t)=>a+minsOf(t),0);
              const totalMoodCount = allTasks.filter(t=>t.mood===mid).length;
              const doneInMood = totalMoodCount - allTasks.filter(t=>t.mood===mid && t.status!==completeStatus).length;
              return (
                <div key={mid} className="msec" style={{marginTop:4}}>
                  <div className="msec-head" style={{background:'transparent'}}>
                    <span style={{fontSize:10}}>{mood.icon}</span>
                    <span className="msec-label" style={{color:mood.color,fontSize:9.5}}>{mood.label}</span>
                    <span className="msec-cnt" style={{background:mood.color+'22',color:mood.color}}>
                      {moodTasks.length}{doneInMood?<span style={{opacity:.55,fontSize:8}}> {doneInMood}✓</span>:null}
                    </span>
                    {hm(moodMins) && <span style={{fontSize:9,color:mood.color,marginLeft:'auto',fontWeight:700,opacity:.7}}>{hm(moodMins)}</span>}
                    <button disabled={limitReached}
                      onClick={(e)=>{e.stopPropagation();handleAddTask(mid);}}
                      title={limitReached?`Daily task limit reached (${stats.activeCount}/${dailyCap})`:''}
                      style={{width:16,height:16,borderRadius:'50%',background:mood.color+'22',border:`1px solid ${mood.color}44`,
                        color:mood.color,fontSize:11,lineHeight:1,cursor:limitReached?'not-allowed':'pointer',display:'flex',alignItems:'center',
                        justifyContent:'center',flexShrink:0,padding:0,fontFamily:'inherit',marginLeft:hm(moodMins)?2:'auto',opacity:limitReached?0.5:1}}>+</button>
                  </div>
                  <div className="msec-tasks">
                    {moodTasks.map(t => <TCard key={t.id} task={t} member={member} S={S} onOpenTask={onOpenTask} onStatus={onStatus} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {suTasks.length>0 && (
          <div className="msec su-sec">
            <div className="su-head">🗣 Stand Up <span style={{fontSize:9,background:'var(--warn)',color:'#fff',padding:'1px 5px',borderRadius:8,marginLeft:2}}>{suTasks.length}</span></div>
            <div className="msec-tasks">{suTasks.map(t => <TCard key={t.id} task={t} member={member} S={S} onOpenTask={onOpenTask} onStatus={onStatus} />)}</div>
          </div>
        )}

        {visibleMoods.filter(m => primaryMoodIds.includes(m.id)).map(mood => {
          const mid = mood.id;
          const mt = visibleTasks.filter(t=>t.mood===mid && t.status!==standUpStatus);
          if ((mid==='top'||mid==='creative') && !mt.length) return null;
          const isHero=mid==='hero', isImp=mid==='imp', isTop=mid==='top';
          const secClass = isHero?'hero-sec':isImp?'imp-sec':isTop?'top-sec':'other-sec';
          const moodMins = allTasks.filter(t=>t.mood===mid).reduce((a,t)=>a+minsOf(t),0);
          const totalMoodCount = allTasks.filter(t=>t.mood===mid).length;
          const doneInMood = totalMoodCount - allTasks.filter(t=>t.mood===mid && t.status!==completeStatus).length;
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
                <button disabled={limitReached}
                  onClick={(e)=>{e.stopPropagation();handleAddTask(mid);}}
                  title={limitReached?`Daily task limit reached (${stats.activeCount}/${dailyCap})`:''}
                  style={{width:16,height:16,borderRadius:'50%',background:mood.color+'22',border:`1px solid ${mood.color}44`,
                    color:mood.color,fontSize:11,lineHeight:1,cursor:limitReached?'not-allowed':'pointer',display:'flex',alignItems:'center',
                    justifyContent:'center',flexShrink:0,padding:0,fontFamily:'inherit',marginLeft:hm(moodMins)?2:'auto',opacity:limitReached?0.5:1}}>+</button>
              </div>
              <div className="msec-tasks">
                {mt.length ? mt.map(t => <TCard key={t.id} task={t} member={member} S={S} onOpenTask={onOpenTask} onStatus={onStatus} />)
                  : <div style={{fontSize:10,color:'var(--t3)',padding:'5px 4px',fontStyle:'italic'}}>No active {mood.label}</div>}
              </div>
            </div>
          );
        })}

        <button className="addbtn" disabled={limitReached}
          title={limitReached?`Daily task limit reached (${stats.activeCount}/${dailyCap})`:''}
          style={{fontSize:11,flexShrink:0,opacity:limitReached?0.5:1,cursor:limitReached?'not-allowed':'pointer'}}
          onClick={()=>handleAddTask()}>+ Task</button>
      </div>
    </div>
  );
});

/* ── CIRCULAR SUBTASK PROGRESS ── */

/* ── DESKTOP TASK CARD ── */
const TCard = memo(function TCard({ task, member, S, onOpenTask, onStatus }) {
  const { STC, STB } = getStatusMaps(useStore.getState().S.task_statuses);
  const mood = sel.gmood(S, task.mood);
  const isHero=task.mood==='hero', isTop=task.mood==='top', isImp=task.mood==='imp';
  const isLight=!isHero&&!isImp&&!isTop;
  const client = sel.gc(S, task.clientId);
  const timeStr = taskTimeStr(task);
  const extra = isHero?' hero':isImp?' imp-card':isTop?' top':isLight?' light':'';
  const [linkPop, setLinkPop] = useState(false);
  const hasNotes = task.notes?.trim().length > 0;
  const hasLinks = task.links?.length > 0;
  const hasSubtasks = task.subtasks?.length > 0;
  const subTotal = task.subtasks?.length || 0;
  const subDone = task.subtasks?.filter(s => s.done).length || 0;

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
      {(hasNotes || hasLinks || hasSubtasks) && (
        <div className="card-icon-row">
          {hasNotes && (
            <span className="card-icon-pill notes-pill" aria-label="Has notes">
              📝<span className="card-pill-tip">{task.notes}</span>
            </span>
          )}
          {hasLinks && (
            <span className="card-icon-pill link-pill" aria-label={`${task.links.length} link(s)`}
              onClick={e=>{e.stopPropagation();setLinkPop(p=>!p);}}>
              🔗 {task.links.length}
              {linkPop && (
                <span className="card-link-pop" onClick={e=>e.stopPropagation()}>
                  {task.links.map((ln,i) => (
                    <span key={i} className="card-link-item" onClick={()=>window.open(ln.url,'_blank','noopener,noreferrer')}>
                      {ln.label||ln.url}
                    </span>
                  ))}
                </span>
              )}
            </span>
          )}
          {hasSubtasks && <CircProg done={subDone} total={subTotal} />}
        </div>
      )}
    </div>
  );
});

/* ── MOBILE TEAM COL ── */
const TeamColMobile = memo(function TeamColMobile({ member, date, S, expandedCards, onToggleExpand, onOpenTask, onStatus }) {
  const completeStatus = getCompleteStatus(S.task_statuses);
  const standUpStatus = getStandUpStatus(S.task_statuses);
  const allTasks = sel.tasksForMD(S, member.id, date);
  const visible = allTasks.filter(t=>t.status!==completeStatus);
  const doneCount = allTasks.filter(t=>t.status===completeStatus).length;
  const pct = allTasks.length ? Math.round(doneCount/allTasks.length*100) : 0;
  const totalDisp = hm(allTasks.reduce((a,t)=>a+minsOf(t),0));
  const [overflowOpen, setOverflowOpen] = useState(false);
  const passStatus = getPassStatus(S.task_statuses);
  const dailyActive = S.tasks.filter(t => t.assignedTo?.includes(member.id) && t.date === date && !t.deleted && t.status !== completeStatus && t.status !== passStatus).length;
  const dailyCap = member.capacity ?? 6;
  const limitReached = dailyActive >= dailyCap;
  const setToast = useUIStore(s => s.setToast);
  const handleAddTask = useCallback((moodId) => {
    if (limitReached) {
      setToast(`Task limit reached.\n\n${member.name} already has ${dailyActive}/${dailyCap} active tasks for today.\n\nComplete, pass, move, or reassign an existing task before creating another.`);
      return;
    }
    onOpenTask({ date, mood: moodId, assignedTo: [member.id] });
  }, [limitReached, dailyActive, dailyCap, member.name, date, onOpenTask, setToast]);

  const primaryMoodIds = ['hero', 'imp', 'top'];
  const visibleMoods = S.moods.filter(m => m.visible);
  const hiddenMoodIds = useMemo(() => S.moods.filter(m => !m.visible).map(m => m.id), [S.moods]);
  const visibleTasks = visible.filter(t => !hiddenMoodIds.includes(t.mood));
  const suTasks = visibleTasks.filter(t=>t.status===standUpStatus);

  const overflowMoods = visibleMoods.filter(m => !primaryMoodIds.includes(m.id));
  const overflowTasks = useMemo(() => {
    return visible.filter(t =>
      t.status !== standUpStatus && (
        overflowMoods.some(m => m.id === t.mood) ||
        hiddenMoodIds.includes(t.mood)
      )
    );
  }, [visible, overflowMoods, hiddenMoodIds, standUpStatus]);

  const overflowMoodLabels = useMemo(() => {
    const labels = overflowMoods.map(m => m.label);
    if (!labels.length) return '';
    if (labels.length <= 2) return labels.join(' & ');
    return labels.slice(0, 2).join(', ') + ' & others';
  }, [overflowMoods]);

  const overflowMoodIds = useMemo(() => {
    const ids = new Set(overflowMoods.map(m => m.id));
    hiddenMoodIds.forEach(id => ids.add(id));
    return ids;
  }, [overflowMoods, hiddenMoodIds]);

  const groupedOverflowTasks = useMemo(() => {
    return overflowTasks.reduce((acc, task) => {
      const mood = task.mood;
      if (!acc[mood]) acc[mood] = [];
      acc[mood].push(task);
      return acc;
    }, {});
  }, [overflowTasks]);

  return (
    <div className="td-mob-col-inner">
      {overflowTasks.length > 0 && (
        <div style={{marginBottom:3}}>
          <button
            onClick={() => setOverflowOpen(o => !o)}
            style={{
              width:'100%',display:'flex',alignItems:'center',gap:6,padding:'5px 8px',
              border:'1px dashed var(--border)',borderRadius:6,background:'transparent',
              color:'var(--t2)',fontSize:11,fontWeight:600,cursor:'pointer',
              fontFamily:'inherit',textAlign:'left',
            }}>
            {overflowOpen ? '▲ Hide' : `+${overflowTasks.length} more`}
            {overflowMoodLabels ? <span style={{color:'var(--t3)',fontWeight:400}}>({overflowMoodLabels})</span> : null}
          </button>
          {overflowOpen && S.moods.filter(m => overflowMoodIds.has(m.id)).map(mood => {
            const moodTasks = groupedOverflowTasks[mood.id] || [];
            if (!moodTasks.length) return null;
            const mid = mood.id;
            const moodMins = allTasks.filter(t=>t.mood===mid).reduce((a,t)=>a+minsOf(t),0);
            return (
              <div key={mid} className="msec" style={{marginTop:4}}>
                <div className="msec-head" style={{background:'transparent',padding:'2px 4px'}}>
                  <span style={{fontSize:10}}>{mood.icon}</span>
                  <span className="msec-label" style={{color:mood.color,fontSize:9}}>{mood.label}</span>
                  <span className="msec-cnt" style={{background:mood.color+'22',color:mood.color,fontSize:9}}>
                    {moodTasks.length}
                  </span>
                  {hm(moodMins) && <span style={{fontSize:8,color:mood.color,marginLeft:'auto',fontWeight:700,opacity:.7}}>{hm(moodMins)}</span>}
                  <button disabled={limitReached}
                    onClick={(e)=>{e.stopPropagation();handleAddTask(mid);}}
                    title={limitReached?`Daily task limit reached (${dailyActive}/${dailyCap})`:''}
                    style={{width:22,height:22,borderRadius:'50%',background:mood.color+'22',border:`1px solid ${mood.color}44`,
                      color:mood.color,fontSize:14,lineHeight:1,cursor:limitReached?'not-allowed':'pointer',display:'flex',alignItems:'center',
                      justifyContent:'center',flexShrink:0,padding:0,fontFamily:'inherit',marginLeft:hm(moodMins)?2:'auto',opacity:limitReached?0.5:1}}>+</button>
                  </div>
                  <div className="msec-tasks">
                    {moodTasks.map(t => <MobileTaskCard key={t.id} task={t} member={member} S={S} expanded={expandedCards[t.id]} onToggleExpand={onToggleExpand} onOpenTask={onOpenTask} onStatus={onStatus} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      {/* Stand Up */}
      {suTasks.length>0 && (
        <div className="msec su-sec" style={{marginBottom:6}}>
          <div className="su-head" style={{padding:'4px 6px'}}>🗣 Stand Up <span style={{fontSize:9,background:'var(--warn)',color:'#fff',padding:'1px 6px',borderRadius:8,marginLeft:2}}>{suTasks.length}</span></div>
          <div className="msec-tasks" style={{maxHeight:100,overflowY:'auto'}}>{suTasks.map(t => <MobileTaskCard key={t.id} task={t} member={member} S={S} expanded={expandedCards[t.id]} onToggleExpand={onToggleExpand} onOpenTask={onOpenTask} onStatus={onStatus} />)}</div>
        </div>
      )}

      {visibleMoods.filter(m => primaryMoodIds.includes(m.id)).map(mood => {
        const mid = mood.id;
        const mt = visibleTasks.filter(t=>t.mood===mid && t.status!==standUpStatus);
        if ((mid==='top'||mid==='creative') && !mt.length) return null;
        const isHero=mid==='hero', isImp=mid==='imp', isTop=mid==='top';
        const secClass = isHero?'hero-sec':isImp?'imp-sec':isTop?'top-sec':'other-sec';
        const moodMins = allTasks.filter(t=>t.mood===mid).reduce((a,t)=>a+minsOf(t),0);
        const totalMoodCount = allTasks.filter(t=>t.mood===mid).length;
        const doneInMood = totalMoodCount - allTasks.filter(t=>t.mood===mid && t.status!==completeStatus).length;
        const secStyle = isHero?{background:mood.bg,border:`2px solid ${mood.color}55`,padding:4}
          : isImp?{background:mood.bg+'88',border:`1.5px solid ${mood.color}44`,padding:3} : {};
        const headBg = isHero?mood.color+'15':isImp?mood.color+'10':'transparent';
        return (
          <div key={mid} className={`msec ${secClass}`} style={{...secStyle,marginBottom:3}}>
            <div className="msec-head" style={{background:headBg,padding:'2px 4px'}}>
              <span style={{fontSize:isHero?12:isImp?11:10}}>{mood.icon}</span>
              <span className="msec-label" style={{color:mood.color,fontSize:isHero?10:isImp?9.5:9}}>{mood.label}</span>
              <span className="msec-cnt" style={{background:mood.color+'22',color:mood.color,fontSize:9}}>
                {mt.length}{mood.max?`/${mood.max}`:''}
              </span>
              {hm(moodMins) && <span style={{fontSize:8,color:mood.color,marginLeft:'auto',fontWeight:700,opacity:.7}}>{hm(moodMins)}</span>}
              <button disabled={limitReached}
                onClick={(e)=>{e.stopPropagation();handleAddTask(mid);}}
                title={limitReached?`Daily task limit reached (${dailyActive}/${dailyCap})`:''}
                style={{width:22,height:22,borderRadius:'50%',background:mood.color+'22',border:`1px solid ${mood.color}44`,
                  color:mood.color,fontSize:14,lineHeight:1,cursor:limitReached?'not-allowed':'pointer',display:'flex',alignItems:'center',
                  justifyContent:'center',flexShrink:0,padding:0,fontFamily:'inherit',marginLeft:hm(moodMins)?2:'auto',opacity:limitReached?0.5:1}}>+</button>
            </div>
            <div className="msec-tasks" style={{maxHeight:isHero?160:isImp?120:80,overflowY:'auto'}}>
              {mt.length ? mt.map(t => <MobileTaskCard key={t.id} task={t} member={member} S={S} expanded={expandedCards[t.id]} onToggleExpand={onToggleExpand} onOpenTask={onOpenTask} onStatus={onStatus} />)
                : <div style={{fontSize:10,color:'var(--t3)',padding:'4px 4px',fontStyle:'italic'}}>No active {mood.label}</div>}
            </div>
          </div>
        );
      })}

        <button className="addbtn" disabled={limitReached}
          title={limitReached?`Daily task limit reached (${dailyActive}/${dailyCap})`:''}
          style={{fontSize:11,marginTop:4,flexShrink:0,opacity:limitReached?0.5:1,cursor:limitReached?'not-allowed':'pointer'}}
          onClick={()=>handleAddTask()}>+ Task</button>
    </div>
  );
});

/* ── MOBILE TASK CARD (simplified, expandable) ── */
const MobileTaskCard = memo(function MobileTaskCard({ task, member, S, expanded, onToggleExpand, onOpenTask, onStatus }) {
  const { STC, STB } = getStatusMaps(useStore.getState().S.task_statuses);
  const mood = sel.gmood(S, task.mood);
  const client = sel.gc(S, task.clientId);
  const timeStr = taskTimeStr(task);
  const [linkPop, setLinkPop] = useState(false);
  const hasNotes = task.notes?.trim().length > 0;
  const hasLinks = task.links?.length > 0;
  const hasSubtasks = task.subtasks?.length > 0;
  const subTotal = task.subtasks?.length || 0;
  const subDone = task.subtasks?.filter(s => s.done).length || 0;

  return (
    <div className="td-mob-card" onClick={() => onOpenTask(task)}>
      <div className="td-mob-card-main">
        <div className="td-mob-card-name">{task.isMilestone?'🏁 ':''}{task.name}</div>
        <div className="td-mob-card-meta">
          {client && <span style={{color:mood?.color||'var(--t2)',fontWeight:600}}>{client.name}</span>}
          <span className="tcs" style={{background:STB[task.status],color:STC[task.status],fontSize:10,padding:'2px 7px',borderRadius:4,fontWeight:700}}
            onClick={(e)=>{e.stopPropagation();onStatus({ taskId:task.id, rect:e.target.getBoundingClientRect() });}}>
            {task.status} ▼
          </span>
          {timeStr && <span className="ttime" style={{fontSize:10}}>{timeStr}</span>}
        </div>
      </div>
      {task.tags?.length > 0 || task.assignedTo?.length > 1 ? (
        <button className="td-mob-card-expand" onClick={(e)=>{e.stopPropagation();onToggleExpand(task.id);}}>
          {expanded ? '▲' : '···'}
        </button>
      ) : null}
      {expanded && (task.tags?.length > 0 || task.assignedTo?.length > 1) && (
        <div className="td-mob-card-detail" onClick={e => e.stopPropagation()}>
          {task.tags?.length > 0 && (
            <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:4}}>
              {task.tags.map(tid => { const tg = sel.gtag(S, tid); return tg ? <span key={tid} className="ttag-chip">{tg.label}</span> : null; })}
            </div>
          )}
          {task.assignedTo?.length > 1 && (
            <div style={{display:'flex',gap:4,flexWrap:'wrap',fontSize:10,color:'var(--t2)'}}>
              {task.assignedTo.filter(id=>id!==member.id).map(id => { const m = sel.gm(S, id); return m ? (
                <span key={id} style={{padding:'2px 7px',borderRadius:4,background:'var(--s2)',border:'1px solid var(--border)',fontWeight:600}}>{m.name}</span>) : null; })}
            </div>
          )}
        </div>
      )}
      {(hasNotes || hasLinks || hasSubtasks) && (
        <div className="card-icon-row mob">
          {hasNotes && (
            <span className="card-icon-pill notes-pill" aria-label="Has notes">
              📝<span className="card-pill-tip">{task.notes}</span>
            </span>
          )}
          {hasLinks && (
            <span className="card-icon-pill link-pill" aria-label={`${task.links.length} link(s)`}
              onClick={e=>{e.stopPropagation();setLinkPop(p=>!p);}}>
              🔗 {task.links.length}
              {linkPop && (
                <span className="card-link-pop" onClick={e=>e.stopPropagation()}>
                  {task.links.map((ln,i) => (
                    <span key={i} className="card-link-item" onClick={()=>window.open(ln.url,'_blank','noopener,noreferrer')}>
                      {ln.label||ln.url}
                    </span>
                  ))}
                </span>
              )}
            </span>
          )}
          {hasSubtasks && <CircProg done={subDone} total={subTotal} />}
        </div>
      )}
    </div>
  );
});
