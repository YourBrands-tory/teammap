const fs = require('fs');

const lines = fs.readFileSync('src/store/useStore.js', 'utf8').split('\n');
const out = [];

const oldMsFrom = "const msFromRow     = (r) => ({ id:r.id, name:r.name, description:r.description||'', assignedTo:r.assigned_to||[], color:r.color, createdAt:Number(r.created_at)||Date.now() });";
const oldMsTo   = "const msToRow       = (m) => ({ id:m.id, name:m.name, description:m.description||'', assigned_to:m.assignedTo||[], color:m.color, created_at:m.createdAt||Date.now() });";
const oldUpsert = [
  '  upsertMilestone: async (m) => {',
  "    if (!m.id) m={ assignedTo:[], description:'', ...m, id:uid(), createdAt:Date.now() };",
  '    get()._patchS((S)=>{ const i=S.milestones.findIndex(x=>x.id===m.id);',
  '      S.milestones = i>=0 ? S.milestones.map(x=>x.id===m.id?m:x) : [...S.milestones,m]; });',
  "    await supabase.from('milestones').upsert(msToRow(m));",
  '    return m;',
  '  },'
];
const oldDel = [
  '  delMilestone: async (id) => {',
  "    get()._patchS((S)=>{ S.milestones=S.milestones.filter(x=>x.id!==id); });",
  "    await supabase.from('milestones').delete().eq('id', id);",
  '  },'
];

let skipMsNav = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Skip the Ensure 'ms' nav block
  if (trimmed.includes("Ensure 'ms'") && trimmed.includes('Milestones')) {
    skipMsNav = true;
    continue;
  }
  if (skipMsNav) {
    if (trimmed.includes("Ensure 'sc'") && trimmed.includes('SM Calendar')) {
      skipMsNav = false;
      // include this line
    } else {
      continue;
    }
  }

  // Replace msFromRow with original if it has substeps (C version)
  if (trimmed.startsWith('const msFromRow') && trimmed.includes('substeps')) {
    out.push(oldMsFrom);
    continue;
  }

  // Replace msToRow with original if it has substeps (C version)
  if (trimmed.startsWith('const msToRow') && trimmed.includes('substeps')) {
    out.push(oldMsTo);
    continue;
  }

  // Replace new upsertMilestone with original
  if (trimmed === 'upsertMilestone: async (m) => {') {
    const nextTrimmed = (lines[i+1] || '').trim();
    if (nextTrimmed === 'const now = Date.now();') {
      // New C version - replace with old
      out.push(...oldUpsert);
      // Skip until end of function
      while (i < lines.length) {
        if ((lines[i] || '').trim() === '},') {
          // Don't increment i here, let loop do it
          break;
        }
        i++;
      }
      continue;
    }
  }

  // Replace new delMilestone with original
  if (trimmed === 'delMilestone: async (id) => {') {
    const nextTrimmed = (lines[i+1] || '').trim();
    if (nextTrimmed === 'const now = Date.now();') {
      out.push(...oldDel);
      while (i < lines.length) {
        if ((lines[i] || '').trim() === '},') break;
        i++;
      }
      continue;
    }
  }

  out.push(line);
}

fs.writeFileSync('src/store/useStore.js.clean', out.join('\n'), 'utf8');
console.log('Done. Lines:', out.length);
