import { ini } from '../lib/constants';

// Port of avEl(name,color,size)
export default function Avatar({ name, color, size = 28 }) {
  const fs = size < 26 ? 10 : size < 34 ? 12 : 13;
  return (
    <div className="av" style={{ background:`${color}22`, color, width:size, height:size, fontSize:fs }}>
      {ini(name)}
    </div>
  );
}
