interface View {
  name: string;
}

interface Props {
  views: View[];
  activeIndex: number | null;
  onLoad: (i: number) => void;
  onDelete: (i: number) => void;
}

export default function SavedViews({ views, activeIndex, onLoad, onDelete }: Props) {
  if (!views.length) return null;
  return (
    <div style={{
      display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
      padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--s2)', flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.4px' }}>
        Saved views:
      </span>
      {views.map((v, i) => (
        <div
          key={i}
          className="sv-row"
          style={{
            marginBottom: 0, padding: '4px 10px',
            ...(activeIndex === i ? { background: 'var(--al)', borderColor: 'var(--accent)' } : {}),
          }}
          onClick={() => onLoad(i)}
        >
          <span className="sv-name" style={activeIndex === i ? { color: 'var(--accent)' } : {}}>{v.name}</span>
          <button className="btn btn-xs btn-d" onClick={(e) => { e.stopPropagation(); onDelete(i); }}>&#10005;</button>
        </div>
      ))}
    </div>
  );
}
