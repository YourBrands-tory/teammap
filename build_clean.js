const fs = require('fs');

const head = fs.readFileSync('src/store/useStore.js', 'utf8');
let lines = head.split('\n');
let result = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Apply A/B changes from working copy
  // 1. Import: add DEFAULT_SERVICE_CATEGORIES (B)
  if (line.includes('DMOODS, DEFAULT_NAV_ORDER, DEFAULT_NAV_LABELS, DEFAULT_TASK_STATUSES, uid,')) {
    result.push(line.replace('DMOODS, DEFAULT_NAV_ORDER, DEFAULT_NAV_LABELS, DEFAULT_TASK_STATUSES, uid,', 'DMOODS, DEFAULT_NAV_ORDER, DEFAULT_NAV_LABELS, DEFAULT_SERVICE_CATEGORIES, DEFAULT_TASK_STATUSES, uid,'));
    // lines that were added after
    const next = lines[i+1];
    if (next && next.includes('DEFAULT_SERVICE_CATEGORIES')) {
      i++; // skip the duplicate DEFAULT_SERVICE_CATEGORIES line that the working copy has (it was already inserted by the import substitution)
    }
    continue;
  }

  // If next line already has DEFAULT_SERVICE_CATEGORIES, skip it (duplicate)
  // Actually this won't work because we already processed line i. Let me rethink.
  
  // 2. clientFromRow (B)
  if (line.match(/const clientFromRow = \(r\) => \({.*?serviceCategoryIds/) || 
      (line.includes('const clientFromRow') && lines[i+1] && lines[i+1].includes('serviceCategoryIds'))) {
    result.push(line); // Keep the single-line version
    continue;
  }
  
  result.push(line);
}

fs.writeFileSync('tmp_test_output.txt', result.join('\n'), 'utf8');
console.log('done');
