import type { KnowledgePoint, QAPair, QAAngle, ExtractionResult } from '../types.js';
import { estimateTokens, truncateToTokenLimit } from './token-counter.js';

interface QATemplate {
  angle: QAAngle;
  questionTemplate: (kp: KnowledgePoint) => string;
  answerTemplate: (kp: KnowledgePoint) => string;
}

const DEFAULT_TEMPLATES: Record<string, QATemplate[]> = {
  default: [
    {
      angle: 'what',
      questionTemplate: (kp) => `moyan-mfw 中${kp.title}是什么？`,
      answerTemplate: (kp) => {
        let answer = `${kp.title}是 moyan-mfw 框架中的${kp.subcategory}，${kp.content}`;
        if (kp.codeSnippet) {
          answer += `\n\n示例：\n\`\`\`typescript\n${kp.codeSnippet}\n\`\`\``;
        }
        return answer;
      },
    },
    {
      angle: 'how',
      questionTemplate: (kp) => `如何在 moyan-mfw 中使用${kp.title}？`,
      answerTemplate: (kp) => {
        let answer = `使用${kp.title}的方法：\n${kp.content}`;
        if (kp.codeSnippet) {
          answer += `\n\n代码示例：\n\`\`\`typescript\n${kp.codeSnippet}\n\`\`\``;
        }
        return answer;
      },
    },
    {
      angle: 'when',
      questionTemplate: (kp) => `什么时候应该使用 moyan-mfw 的${kp.title}？`,
      answerTemplate: (kp) =>
        `${kp.title}适用于以下场景：\n${kp.content}${kp.codeSnippet ? `\n\n典型用法：\n\`\`\`typescript\n${kp.codeSnippet}\n\`\`\`` : ''}`,
    },
    {
      angle: 'caution',
      questionTemplate: (kp) => `使用 moyan-mfw 的${kp.title}有什么注意事项？`,
      answerTemplate: (kp) => {
        const cautions = extractCautions(kp.content);
        if (cautions.length === 0) {
          return `使用${kp.title}时需注意：\n${kp.content}`;
        }
        return `使用${kp.title}时需注意：\n${cautions.join('\n')}`;
      },
    },
    {
      angle: 'compare',
      questionTemplate: (kp) => `${kp.title}和相似概念有什么区别？`,
      answerTemplate: (kp) =>
        `${kp.title}的区别与辨析：\n${kp.content}${kp.codeSnippet ? `\n\n参考实现：\n\`\`\`typescript\n${kp.codeSnippet}\n\`\`\`` : ''}`,
    },
    {
      angle: 'troubleshoot',
      questionTemplate: (kp) => `${kp.title}常见问题如何排查？`,
      answerTemplate: (kp) =>
        `${kp.title}常见问题排查：\n${kp.content}`,
    },
  ],
};

function extractCautions(content: string): string[] {
  const cautions: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('✋') || line.includes('禁止') || line.includes('不要') || line.includes('注意') || line.includes('红线') || line.includes('反模式')) {
      cautions.push(line.replace(/^[>\-\s]*/, '').trim());
    }
  }
  return cautions;
}

export function generateQAPairs(
  knowledgePoints: KnowledgePoint[],
  dimension: string,
  angleWeights: Record<QAAngle, number>,
  customTemplates?: QATemplate[]
): ExtractionResult {
  const templates = customTemplates || DEFAULT_TEMPLATES.default;
  const qaPairs: QAPair[] = [];
  const byAngle: Record<string, number> = { what: 0, how: 0, when: 0, caution: 0, compare: 0, troubleshoot: 0 };
  const bySubcategory: Record<string, number> = {};

  for (const kp of knowledgePoints) {
    const subcategoryCount = bySubcategory[kp.subcategory] || 0;

    for (const template of templates) {
      const weight = angleWeights[template.angle];
      if (weight < 1 && Math.random() > weight) continue;

      const question = template.questionTemplate(kp);
      let answer = template.answerTemplate(kp);

      if (estimateTokens(question + answer) > 2048) {
        answer = truncateToTokenLimit(answer, 1800);
      }

      const qa: QAPair = {
        conversations: [
          { role: 'user', content: question },
          { role: 'assistant', content: answer },
        ],
        metadata: {
          dimension,
          subcategory: kp.subcategory,
          source: kp.source,
          angle: template.angle,
          timestamp: new Date().toISOString(),
        },
      };

      qaPairs.push(qa);
      byAngle[template.angle]++;
      bySubcategory[kp.subcategory] = subcategoryCount + 1;
    }
  }

  return {
    dimension,
    knowledgePoints,
    qaPairs,
    stats: {
      totalKnowledgePoints: knowledgePoints.length,
      totalQAPairs: qaPairs.length,
      byAngle: byAngle as Record<QAAngle, number>,
      bySubcategory,
    },
  };
}
