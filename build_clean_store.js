const fs = require('fs');

const head = fs.readFileSync('src/store/useStore.js', 'utf8');
let lines = head.split('\n');
let result = [];

let skipMsNavBlock = false;
let skipUntilEndMsNav = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Skip the Ensure 'ms' block completely
  if (line.includes("Ensure 'ms' (Milestones) exists in saved navOrder")) {
    skipMsNavBlock = true;
    continue;
  }
  if (skipMsNavBlock) {
    // Continue skipping until we hit the sc ensure block
    if (line.includes("Ensure 'sc' (SM Calendar) exists in saved navOrder")) {
      skipMsNavBlock = false;
      // Keep this line (the sc ensure block header)
      // But we'll let it fall through to be added
    } else {
      continue;
    }
  }

  // Skip ms navLabel ensure
  if (line.includes("S.navLabels && !S.navLabels.ms")) {
    // Skip this line and the next
    skipUntilEndMsNav = true;
    continue;
  }
  if (skipUntilEndMsNav) {
    if (line.trim() === '}' || line.includes('supabase.from')) {
      continue;
    }
    if (line.trim() === '') {
      skipUntilEndMsNav = false;
      result.push(line);
      continue;
    }
    continue;
  }

  result.push(line);
}

fs.writeFileSync('src/store/useStore.js.staged', result.join('\n'), 'utf8');
console.log('Step 1 done - ms nav ensure removed');
