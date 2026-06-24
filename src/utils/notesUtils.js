export function getNotesText(raw) {
  if (!raw) return '';
  if (typeof raw !== 'string') return String(raw);
  try {
    const doc = JSON.parse(raw);
    if (doc && doc.type === 'doc' && Array.isArray(doc.content)) {
      return extractText(doc.content);
    }
  } catch {}
  return raw;
}

function extractText(nodes) {
  let result = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      result += node.text || '';
    }
    if (node.content && Array.isArray(node.content)) {
      result += extractText(node.content);
    }
    if (node.type === 'paragraph' || node.type === 'heading') {
      result += '\n';
    }
  }
  return result.trim();
}
