import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const S = useStore(s => s.S);
  const role = useStore(s => s.role);
  const session = useStore(s => s.session);
  const exportJSON = useStore(s => s.exportJSON);
  const importJSON = useStore(s => s.importJSON);
  const loadAll = useStore(s => s.loadAll);
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setMsg('Importing…');
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      await importJSON(parsed);
      await loadAll();
      setMsg('✓ Imported and saved to Supabase.');
    } catch (err) {
      console.error(err);
      setMsg('✕ Import failed: ' + (err.message || 'invalid file or write error'));
    }
    setBusy(false);
    e.target.value = '';
  };

  return (
    <div className="view active">
      <div className="sw">
        <div className="si">
          <div className="ss-sec">
            <h3>Account</h3>
            <div className="li"><span style={{flex:1}}>Signed in as</span><b>{session?.user?.email}</b></div>
            <div className="li"><span style={{flex:1}}>Role</span><span className="pill" style={{background:'var(--al)',color:'var(--accent)'}}>{role}</span></div>
            <button className="btn" style={{marginTop:12}} onClick={()=>supabase.auth.signOut()}>Sign out</button>
          </div>

          <div className="ss-sec">
            <h3>Data — backup &amp; import</h3>
            <p style={{fontSize:12,color:'var(--t2)',lineHeight:1.6,marginBottom:14}}>
              First-time setup: import your legacy <code>teammap-backup.json</code> once as admin.
              Everything (members, clients, links, tasks, milestones, tags and all settings)
              is written to Supabase and becomes the live source of truth. Re-importing is safe —
              it upserts by id rather than duplicating.
            </p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button className="btn btn-p" disabled={busy || role!=='admin'} onClick={()=>fileRef.current?.click()}>
                ⬆ Import JSON backup
              </button>
              <button className="btn" onClick={exportJSON}>⬇ Export current data</button>
              <input ref={fileRef} type="file" accept="application/json,.json" style={{display:'none'}} onChange={onFile} />
            </div>
            {role!=='admin' && <p style={{fontSize:11,color:'var(--t3)',marginTop:10}}>Only admins can import.</p>}
            {msg && <div style={{marginTop:12,fontSize:13,fontWeight:600,
              color: msg.startsWith('✓')?'var(--accent)':msg.startsWith('✕')?'var(--warn)':'var(--t2)'}}>{msg}</div>}
          </div>

          <div className="ss-sec">
            <h3>Current data (in memory)</h3>
            <div className="li"><span style={{flex:1}}>Members</span><b>{S.members.length}</b></div>
            <div className="li"><span style={{flex:1}}>Clients</span><b>{S.clients.length}</b></div>
            <div className="li"><span style={{flex:1}}>Links</span><b>{S.links.length}</b></div>
            <div className="li"><span style={{flex:1}}>Tasks</span><b>{S.tasks.filter(t=>!t.deleted).length} active · {S.tasks.filter(t=>t.deleted).length} deleted</b></div>
            <div className="li"><span style={{flex:1}}>Milestones</span><b>{S.milestones.length}</b></div>
            <div className="li"><span style={{flex:1}}>Tags</span><b>{S.tags.length}</b></div>
            <div className="li"><span style={{flex:1}}>Moods</span><b>{S.moods.length}</b></div>
          </div>

          <div className="ss-sec">
            <h3>Member / client / mood / tag management</h3>
            <p style={{fontSize:12,color:'var(--t2)',lineHeight:1.6}}>
              The store already exposes <code>upsertMember</code>, <code>delMember</code>, <code>upsertClient</code>,
              <code> delClient</code>, <code>upsertLink</code>, <code>delLink</code>, <code>setMoods</code>, <code>upsertTag</code>,
              <code> delTag</code>, <code>setNavOrder</code>, <code>setNavLabels</code> and <code>resetNav</code>.
              Port the original <code>rST</code> management UI on top of these — the data layer is done.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
