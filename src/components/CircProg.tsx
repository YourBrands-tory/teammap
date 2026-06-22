interface Props {
  done: number;
  total: number;
}

const CIRC = 2 * Math.PI * 13;

export default function CircProg({ done, total }: Props) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  const off = CIRC - (pct / 100) * CIRC;
  const text = `${done}/${total}`;
  const fontSize =
    text.length <= 3 ? '10px' :
    text.length <= 5 ? '9px' :
    '8px';

  return (
    <span className="subtask-progress" title={`${done} of ${total} subtasks completed`}
      role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
      <svg viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="13" fill="none" stroke="var(--s2)" strokeWidth="3.5" />
        <circle cx="15" cy="15" r="13" fill="none" stroke="var(--accent)" strokeWidth="3.5"
          strokeDasharray={CIRC} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 15 15)" style={{ transition: 'stroke-dashoffset .3s' }} />
      </svg>
      <span className="subtask-progress__label" style={{ fontSize }}>
        {text}
      </span>
    </span>
  );
}
