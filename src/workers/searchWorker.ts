/// <reference lib="webworker" />

interface SearchTask {
  id: string;
  type: 'search';
  payload: {
    files: Array<{ id: string; path: string; name: string; content: string }>;
    query: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    regex: boolean;
  };
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data as SearchTask;

  if (type !== 'search') {
    self.postMessage({ id, error: `Unknown task type: ${type}` });
    return;
  }

  try {
    const { files, query, caseSensitive, wholeWord, regex } = payload;
    const flags = `${caseSensitive ? '' : 'i'}`;
    const escapedQuery = regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
    const searchRegex = new RegExp(pattern, flags);

    const results = files.map(file => {
      const lines = file.content.split('\n');
      const matches: Array<{
        lineNumber: number;
        lineContent: string;
        matchStart: number;
        matchEnd: number;
      }> = [];

      lines.forEach((line, index) => {
        let match;
        while ((match = searchRegex.exec(line)) !== null) {
          matches.push({
            lineNumber: index + 1,
            lineContent: line,
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
          if (!searchRegex.global) break;
        }
      });

      return {
        fileId: file.id,
        fileName: file.name,
        filePath: file.path,
        matches,
      };
    }).filter(r => r.matches.length > 0);

    self.postMessage({ id, result: results });
  } catch (error: any) {
    self.postMessage({ id, error: error.message });
  }
};