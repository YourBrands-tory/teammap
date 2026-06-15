interface FreqTag {
  id: string;
  label: string;
}

interface Props {
  freqTags: FreqTag[];
  clientId: string;
  onSelect: (clientId: string, freqId: string) => void;
}

export default function FrequencySelector({ freqTags, clientId, onSelect }: Props) {
  if (!freqTags.length) return null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
        Add template by frequency
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {freqTags.map(f => (
          <span key={f.id} className="freq-tag" onClick={() => onSelect(clientId, f.id)}>
            {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}
