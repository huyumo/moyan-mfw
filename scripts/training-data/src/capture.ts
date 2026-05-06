import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import type { QAPair } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const experienceDir = join(__dirname, '../data/dev-experiences');

function getWeekFile(): string {
  const now = new Date();
  const year = now.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `week-${year}-W${String(week).padStart(2, '0')}.jsonl`;
}

function getTodayTag(): string {
  return new Date().toISOString().split('T')[0];
}

export function captureExperience(entry: {
  question: string;
  answer: string;
  category?: string;
  source?: string;
}): void {
  mkdirSync(experienceDir, { recursive: true });
  const weekFile = join(experienceDir, getWeekFile());

  const qa: QAPair = {
    conversations: [
      { role: 'user', content: entry.question },
      { role: 'assistant', content: entry.answer },
    ],
  };

  const line = JSON.stringify(qa, null, 0);
  appendFileSync(weekFile, line + '\n', 'utf-8');

  const logEntry = `[${getTodayTag()}] [${entry.category || 'general'}] ${entry.question.substring(0, 60)}... → ${weekFile}`;
  const logFile = join(experienceDir, 'capture.log');
  appendFileSync(logFile, logEntry + '\n', 'utf-8');

  console.log(`✓ 已捕获经验到 ${getWeekFile()}`);
  console.log(`  类别: ${entry.category || 'general'}`);
  console.log(`  问题: ${entry.question.substring(0, 80)}...`);
}

export function captureBugFix(entry: {
  bug: string;
  rootCause: string;
  fix: string;
  prevention?: string;
}): void {
  const question = `moyan-mfw 开发中遇到问题：${entry.bug}，原因是什么？如何修复？`;
  let answer = `问题：${entry.bug}\n\n根本原因：${entry.rootCause}\n\n修复方法：${entry.fix}`;
  if (entry.prevention) {
    answer += `\n\n预防措施：${entry.prevention}`;
  }

  captureExperience({ question, answer, category: 'bug-fix' });
}

export function captureLesson(entry: {
  scenario: string;
  lesson: string;
  correctApproach: string;
  wrongApproach?: string;
}): void {
  const question = `在 moyan-mfw 中${entry.scenario}，有什么经验教训？`;
  let answer = `经验教训：${entry.lesson}\n\n正确做法：${entry.correctApproach}`;
  if (entry.wrongApproach) {
    answer += `\n\n错误做法（避免）：${entry.wrongApproach}`;
  }

  captureExperience({ question, answer, category: 'lesson' });
}

export function captureDecision(entry: {
  decision: string;
  context: string;
  reasoning: string;
  alternatives?: string;
}): void {
  const question = `moyan-mfw 项目为什么选择${entry.decision}？`;
  let answer = `背景：${entry.context}\n\n决策：${entry.decision}\n\n原因：${entry.reasoning}`;
  if (entry.alternatives) {
    answer += `\n\n备选方案：${entry.alternatives}`;
  }

  captureExperience({ question, answer, category: 'decision' });
}

export function listExperiences(): void {
  if (!existsSync(experienceDir)) {
    console.log('暂无开发经验记录');
    return;
  }

  const files = readdirSync(experienceDir).filter((f: string) => f.endsWith('.jsonl'));
  if (files.length === 0) {
    console.log('暂无开发经验记录');
    return;
  }

  let total = 0;
  for (const file of files) {
    const content = readFileSync(join(experienceDir, file), 'utf-8');
    const count = content.trim().split('\n').filter((l: string) => l.trim()).length;
    total += count;
    console.log(`  ${file}: ${count} 条`);
  }
  console.log(`\n总计: ${total} 条开发经验`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list': {
      listExperiences();
      break;
    }
    case 'bug': {
      const [bug, rootCause, fix, prevention] = args.slice(1);
      if (!bug || !rootCause || !fix) {
        console.error('用法: tsx src/capture.ts bug "问题描述" "根本原因" "修复方法" ["预防措施"]');
        process.exit(1);
      }
      captureBugFix({ bug, rootCause, fix, prevention });
      break;
    }
    case 'lesson': {
      const [scenario, lesson, correct, wrong] = args.slice(1);
      if (!scenario || !lesson || !correct) {
        console.error('用法: tsx src/capture.ts lesson "场景" "教训" "正确做法" ["错误做法"]');
        process.exit(1);
      }
      captureLesson({ scenario, lesson, correctApproach: correct, wrongApproach: wrong });
      break;
    }
    case 'decision': {
      const [decision, context, reasoning, alternatives] = args.slice(1);
      if (!decision || !context || !reasoning) {
        console.error('用法: tsx src/capture.ts decision "决策" "背景" "原因" ["备选方案"]');
        process.exit(1);
      }
      captureDecision({ decision, context, reasoning, alternatives });
      break;
    }
    case 'qa': {
      const [question, answer, category] = args.slice(1);
      if (!question || !answer) {
        console.error('用法: tsx src/capture.ts qa "问题" "回答" ["类别"]');
        process.exit(1);
      }
      captureExperience({ question, answer, category });
      break;
    }
    default:
      console.log('moyan-mfw 开发经验捕获工具');
      console.log('');
      console.log('命令:');
      console.log('  list                      列出所有开发经验');
      console.log('  bug "描述" "原因" "修复"    记录 bug 修复经验');
      console.log('  lesson "场景" "教训" "做法" 记录经验教训');
      console.log('  decision "决策" "背景" "原因" 记录架构决策');
      console.log('  qa "问题" "回答"            记录自由格式 Q&A');
  }
}

main().catch(console.error);
