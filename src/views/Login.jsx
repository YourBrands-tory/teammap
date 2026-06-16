import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

export default function Login() {
  const loading = useStore(s => s.loading);
  const loadAll = useStore(s => s.loadAll);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) setErr(error.message);
    else await loadAll(true);
    setBusy(false);
  };

  if (loading) {
    return <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'var(--t2)'}}>Loading…</div>;
  }

  return (
    <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div className="modal" style={{width:360}}>
        <div className="nav-brand" style={{fontSize:22,marginBottom:18}}>Team<span>Map</span></div>
        <label className="fl">Email</label>
        <input type="text" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@agency.com" />
        <label className="fl">Password</label>
        <input type="text" style={{WebkitTextSecurity:'disc'}} value={pw}
          onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&signIn()} />
        {err && <div style={{color:'var(--warn)',fontSize:12,marginTop:10}}>{err}</div>}
        <button className="btn btn-p" style={{width:'100%',marginTop:18,justifyContent:'center'}}
          disabled={busy} onClick={signIn}>{busy?'Signing in…':'Sign in'}</button>
        <p style={{fontSize:11,color:'var(--t3)',marginTop:14,lineHeight:1.5}}>
          Create users in Supabase → Authentication → Users, then give them a row in
          the <code>profiles</code> table with role <code>admin</code>, <code>manager</code>,
          or <code>member</code>.
        </p>
      </div>
    </div>
  );
}
