/**
 * Token 计数与截断工具
 *
 * 采用启发式估算：中文约 1.5 字符/token，英文约 4 字符/token，代码约 3 字符/token。
 * 不依赖外部 tokenizer，适用于粗粒度的 token 预算控制。
 */

const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/g;
const CODE_BLOCK_REGEX = /```[\s\S]*?```/g;

/** 估算文本的 token 数量 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  const chineseChars = (text.match(CHINESE_REGEX) || []).length;
  const codeBlocks = text.match(CODE_BLOCK_REGEX) || [];
  const codeLength = codeBlocks.reduce((sum, block) => sum + block.length, 0);

  // 去除中文和代码块后的内容视为英文/混合文本
  const remainingLength = Math.max(0, text.length - chineseChars - codeLength);

  const chineseTokens = Math.ceil(chineseChars / 1.5);
  const codeTokens = Math.ceil(codeLength / 3);
  const remainingTokens = Math.ceil(remainingLength / 4);

  return chineseTokens + codeTokens + remainingTokens;
}

/** 将文本截断到指定 token 限制内，尽量在句子边界处截断 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  if (estimateTokens(text) <= maxTokens) return text;

  // 二分查找合适的截断位置
  let low = 0;
  let high = text.length;
  let bestLength = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = text.substring(0, mid);
    if (estimateTokens(candidate) <= maxTokens) {
      bestLength = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // 尝试在句子边界截断
  let truncated = text.substring(0, bestLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('？'),
    truncated.lastIndexOf('\n'),
    truncated.lastIndexOf('. '),
  );

  if (lastSentenceEnd > bestLength * 0.8) {
    truncated = truncated.substring(0, lastSentenceEnd + 1);
  }

  return truncated.trimEnd();
}
