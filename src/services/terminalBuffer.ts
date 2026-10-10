export interface TerminalBufferConfig {
  maxLines: number;
  maxBatchSize: number;
  flushIntervalMs: number;
  warningThreshold: number;
}

export interface TerminalOutput {
  text: string;
  timestamp: number;
  type: 'stdout' | 'stderr' | 'system' | 'warning';
}

const DEFAULT_CONFIG: TerminalBufferConfig = {
  maxLines: 5000,
  maxBatchSize: 100,
  flushIntervalMs: 16,
  warningThreshold: 4500,
};

export class TerminalStreamThrottler {
  private buffer: string[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private config: TerminalBufferConfig;
  private lineCount = 0;
  private totalWritten = 0;
  private totalDropped = 0;

  constructor(
    private onFlush: (batch: string, metadata?: { dropped?: number; lineCount?: number }) => void,
    config: Partial<TerminalBufferConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  write(data: string): void {
    if (!data) return;

    this.buffer.push(data);
    this.totalWritten++;

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.config.flushIntervalMs);
    }
  }

  writeLine(line: string, type: TerminalOutput['type'] = 'stdout'): void {
    this.write(`${line}\n`);
    this.lineCount++;
  }

  private flush(): void {
    this.flushTimer = null;
    if (this.buffer.length === 0) return;

    let dropped = 0;

    if (this.buffer.length > this.config.maxBatchSize * 10) {
      dropped = this.buffer.length - this.config.maxBatchSize;
      this.buffer = this.buffer.slice(-this.config.maxBatchSize);
      this.totalDropped += dropped;
    }

    const payload = this.buffer.join('');
    this.buffer = [];

    this.onFlush(payload, { dropped, lineCount: this.lineCount });
  }

  destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.buffer = [];
    this.lineCount = 0;
  }

  getStats(): { lineCount: number; totalWritten: number; totalDropped: number; bufferSize: number } {
    return {
      lineCount: this.lineCount,
      totalWritten: this.totalWritten,
      totalDropped: this.totalDropped,
      bufferSize: this.buffer.length,
    };
  }

  resetStats(): void {
    this.lineCount = 0;
    this.totalWritten = 0;
    this.totalDropped = 0;
  }
}

export class RingBufferTerminal {
  private lines: TerminalOutput[] = [];
  private maxLines: number;
  private onLinesChange: (lines: TerminalOutput[]) => void;

  constructor(
    maxLines: number = 5000,
    onLinesChange: (lines: TerminalOutput[]) => void = () => {}
  ) {
    this.maxLines = maxLines;
    this.onLinesChange = onLinesChange;
  }

  append(text: string, type: TerminalOutput['type'] = 'stdout'): void {
    const newLines = text.split('\n').filter(l => l.length > 0);
    
    for (const line of newLines) {
      this.lines.push({
        text: line,
        timestamp: Date.now(),
        type,
      });
    }

    if (this.lines.length > this.maxLines) {
      this.lines = this.lines.slice(-this.maxLines);
    }

    this.onLinesChange(this.lines);
  }

  getLines(): TerminalOutput[] {
    return [...this.lines];
  }

  getLastLines(count: number): TerminalOutput[] {
    return this.lines.slice(-count);
  }

  clear(): void {
    this.lines = [];
    this.onLinesChange(this.lines);
  }

  setMaxLines(maxLines: number): void {
    this.maxLines = maxLines;
    if (this.lines.length > this.maxLines) {
      this.lines = this.lines.slice(-this.maxLines);
      this.onLinesChange(this.lines);
    }
  }

  getLineCount(): number {
    return this.lines.length;
  }

  search(query: string, caseSensitive = false): TerminalOutput[] {
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
    return this.lines.filter(line => regex.test(line.text));
  }
}

export function createTerminalThrottler(
  onFlush: (batch: string) => void,
  config?: Partial<TerminalBufferConfig>
): TerminalStreamThrottler {
  return new TerminalStreamThrottler(
    (batch, meta) => {
      if (meta?.dropped && meta.dropped > 0) {
        const warning = `\r\n\x1b[33m[Warning: ${meta.dropped} output lines truncated to prevent browser freeze]\x1b[0m\r\n`;
        onFlush(warning + batch);
      } else {
        onFlush(batch);
      }
    },
    config
  );
}