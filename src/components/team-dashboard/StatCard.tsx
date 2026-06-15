interface Props {
  label: string;
  value: string | number;
  color: string;
  sub: string;
}

export default function StatCard({ label, value, color, sub }: Props) {
  return (
    <div className="sc">
      <div className="sl">{label}</div>
      <div className="sv" style={{ color }}>{value}</div>
      <div className="ss" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  );
}
