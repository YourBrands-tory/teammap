import { useState } from 'react';

export default function Login({ onLogin }) {
  const [step, setStep] = useState('role'); // 'role' | 'form'
  const [selectedRole, setSelectedRole] = useState(null); // 'manager' | 'member'
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const pickRole = (role) => {
    setSelectedRole(role);
    setErr('');
    setStep('form');
  };

  const submit = async () => {
    setBusy(true); setErr('');
    const result = await onLogin(selectedRole, email, pw);
    if (result?.error) {
      setErr(result.error);
    }
    setBusy(false);
  };

  if (step === 'role') {
    return (
      <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',background:'var(--bg)',flexDirection:'column',gap:24}}>
        <div className="nav-brand" style={{fontSize:26,marginBottom:8}}>Team<span>Map</span></div>
        <div style={{fontSize:14,color:'var(--t2)',marginBottom:8}}>Sign in as…</div>
        <div style={{display:'flex',gap:16}}>
          <RoleCard icon="⚙️" title="Manager" desc="Full access dashboard" onClick={() => pickRole('manager')} />
          <RoleCard icon="👤" title="Member" desc="My tasks &amp; sheets" onClick={() => pickRole('member')} />
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div className="modal" style={{width:360}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18}}>
          <button className="btn btn-sm" onClick={() => { setStep('role'); setErr(''); }} style={{fontSize:16,padding:'2px 8px'}}>←</button>
          <div className="nav-brand" style={{fontSize:20}}>Team<span>Map</span></div>
          <span style={{fontSize:12,color:'var(--t3)',marginLeft:'auto',background:'var(--s2)',padding:'2px 10px',borderRadius:12}}>{selectedRole === 'manager' ? 'Manager' : 'Member'}</span>
        </div>
        <label className="fl">Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@agency.com" autoFocus autoCapitalize="none" autoComplete="email" autocorrect="off" spellcheck="false" />
        <label className="fl">Password</label>
        <input type="text" style={{WebkitTextSecurity:'disc'}} value={pw}
          onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} />
        {err && <div style={{color:'var(--warn)',fontSize:12,marginTop:10}}>{err}</div>}
        <button className="btn btn-p" style={{width:'100%',marginTop:18,justifyContent:'center'}}
          disabled={busy} onClick={submit}>{busy?'Signing in…':'Sign in'}</button>
      </div>
    </div>
  );
}

function RoleCard({ icon, title, desc, onClick }) {
  return (
    <div onClick={onClick} style={{
      width:180, padding:'24px 16px', borderRadius:12, cursor:'pointer',
      background:'var(--surface)', border:'2px solid var(--border)',
      textAlign:'center', transition:'border-color .15s, box-shadow .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{fontSize:40,marginBottom:8}}>{icon}</div>
      <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{title}</div>
      <div style={{fontSize:12,color:'var(--t3)'}}>{desc}</div>
    </div>
  );
}
