import type { QAPair, ValidationResult } from '../types.js';
import { estimateTokens } from './token-counter.js';

export function validateJSONL(qaPairs: QAPair[], maxTokens: number = 2048): ValidationResult {
  const errors: Array<{ line: number; rule: string; message: string; content: string }> = [];
  const warnings: Array<{ line: number; rule: string; message: string }> = [];
  let passed = 0;
  const seenQuestions = new Set<string>();

  for (let i = 0; i < qaPairs.length; i++) {
    const qa = qaPairs[i];
    const line = i + 1;

    if (!qa.conversations || qa.conversations.length < 2) {
      errors.push({ line, rule: 'min_conversations', message: '对话至少需要2轮', content: JSON.stringify(qa).substring(0, 100) });
      continue;
    }

    const userMsg = qa.conversations[0];
    const assistantMsg = qa.conversations[1];

    if (userMsg.role !== 'user') {
      errors.push({ line, rule: 'role_order', message: '第一条消息必须是 user', content: userMsg.role });
    }

    if (assistantMsg.role !== 'assistant') {
      errors.push({ line, rule: 'role_order', message: '第二条消息必须是 assistant', content: assistantMsg.role });
    }

    if (!userMsg.content || userMsg.content.trim().length < 5) {
      errors.push({ line, rule: 'question_length', message: '问题内容过短', content: userMsg.content?.substring(0, 50) || '' });
    }

    if (!assistantMsg.content || assistantMsg.content.trim().length < 10) {
      errors.push({ line, rule: 'answer_length', message: '回答内容过短', content: assistantMsg.content?.substring(0, 50) || '' });
    }

    const totalTokens = estimateTokens(userMsg.content + assistantMsg.content);
    if (totalTokens > maxTokens) {
      errors.push({ line, rule: 'token_length', message: `总 token 数 ${totalTokens} 超过限制 ${maxTokens}`, content: `tokens=${totalTokens}` });
    }

    const questionKey = userMsg.content.trim().substring(0, 100);
    if (seenQuestions.has(questionKey)) {
      warnings.push({ line, rule: 'duplicate_question', message: '重复问题' });
    }
    seenQuestions.add(questionKey);

    passed++;
  }

  return {
    total: qaPairs.length,
    passed: passed - errors.length,
    failed: errors.length,
    errors,
    warnings,
  };
}

export function printValidationReport(result: ValidationResult): void {
  console.log(`\n========== 质量校验报告 ==========`);
  console.log(`总计: ${result.total} 条`);
  console.log(`通过: ${result.passed} 条`);
  console.log(`失败: ${result.failed} 条`);
  console.log(`警告: ${result.warnings.length} 条`);

  if (result.errors.length > 0) {
    console.log(`\n--- 错误 (${result.errors.length}) ---`);
    for (const err of result.errors.slice(0, 20)) {
      console.log(`  行${err.line} [${err.rule}]: ${err.message}`);
    }
    if (result.errors.length > 20) {
      console.log(`  ... 还有 ${result.errors.length - 20} 条错误`);
    }
  }

  if (result.warnings.length > 0) {
    console.log(`\n--- 警告 (${result.warnings.length}) ---`);
    for (const warn of result.warnings.slice(0, 10)) {
      console.log(`  行${warn.line} [${warn.rule}]: ${warn.message}`);
    }
    if (result.warnings.length > 10) {
      console.log(`  ... 还有 ${result.warnings.length - 10} 条警告`);
    }
  }
}
