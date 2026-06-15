// Placeholder for views still to be ported (Team Dashboard, Builder,
// Tasks & Milestones, List View, Task Gen 2.0, Line Up, Playground).
// The data layer (store) already has what each needs — see README port map.
export default function Stub({ label, source }) {
  return (
    <div className="view active">
      <div style={{padding:40,maxWidth:560,margin:'0 auto'}}>
        <h2 style={{fontSize:18,fontWeight:800,marginBottom:8}}>{label}</h2>
        <p style={{fontSize:13,color:'var(--t2)',lineHeight:1.6}}>
          Not ported yet. Original logic lives in <code>{source}</code> in TeamMap.html.
          The store already exposes the data and actions this view needs — follow the
          Task Dashboard as the reference pattern.
        </p>
      </div>
    </div>
  );
}
