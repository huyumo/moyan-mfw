import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { QAPair } from '../types.js';

export function formatQAtoJSONL(qa: QAPair): string {
  const output: QAPair = {
    conversations: qa.conversations.map((c) => ({
      role: c.role,
      content: c.content,
    })),
  };
  return JSON.stringify(output, null, 0);
}

export function writeJSONL(qaPairs: QAPair[], filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const lines = qaPairs.map(formatQAtoJSONL).join('\n');
  writeFileSync(filePath, lines + '\n', 'utf-8');
}

export function readJSONL(filePath: string): QAPair[] {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, 'utf-8');
  return content
    .trim()
    .split('\n')
    .filter((line: string) => line.trim())
    .map((line: string, index: number) => {
      try {
        return JSON.parse(line) as QAPair;
      } catch {
        throw new Error(`Invalid JSON at line ${index + 1} in ${filePath}`);
      }
    });
}

export function mergeJSONLFiles(filePaths: string[], outputPath: string): void {
  const allPairs: QAPair[] = [];
  for (const fp of filePaths) {
    allPairs.push(...readJSONL(fp));
  }
  writeJSONL(allPairs, outputPath);
}

export function splitTestSet(
  qaPairs: QAPair[],
  testRatio: number = 0.05
): { train: QAPair[]; test: QAPair[] } {
  const shuffled = [...qaPairs].sort(() => Math.random() - 0.5);
  const testCount = Math.max(50, Math.floor(shuffled.length * testRatio));
  return {
    test: shuffled.slice(0, testCount),
    train: shuffled.slice(testCount),
  };
}
