const fs = require('fs');

const lines = fs.readFileSync('src/lib/constants.js', 'utf8').split('\n');
const out = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Replace NAV_ICONS: remove ms entry
  if (trimmed.startsWith('export const NAV_ICONS')) {
    out.push(line.replace(", ms:'◆'", ''));
    continue;
  }

  // Replace DEFAULT_NAV_ORDER: remove 'ms'
  if (trimmed.startsWith("export const DEFAULT_NAV_ORDER")) {
    out.push(line.replace(",'ms'", ''));
    continue;
  }

  // Replace DEFAULT_NAV_LABELS: remove ms:'Milestones'
  if (trimmed.includes("tk:'Tasks & Milestones'")) {
    out.push(line.replace(", ms:'Milestones'", ''));
    continue;
  }

  // Skip the deadline helpers block (C)
  if (trimmed === "// ── Deadline helpers ────────────────────────────────────────") {
    // Skip until the next blank line or end
    while (i < lines.length) {
      i++;
      if (i >= lines.length) break;
      const nextTrim = lines[i].trim();
      if (nextTrim === '' && (i+1 >= lines.length || lines[i+1].trim().startsWith('export') || lines[i+1].trim() === '')) {
        // End of block
        out.push(''); // keep the blank line
        break;
      }
    }
    continue;
  }

  out.push(line);
}

fs.writeFileSync('src/lib/constants.js.clean', out.join('\n'), 'utf8');
console.log('Done');
