export interface QAPair {
  conversations: Conversation[];
  metadata?: QAMetadata;
}

export interface Conversation {
  role: 'user' | 'assistant';
  content: string;
}

export interface QAMetadata {
  dimension: string;
  subcategory: string;
  source: string;
  angle: QAAngle;
  timestamp: string;
}

export type QAAngle =
  | 'what'
  | 'how'
  | 'when'
  | 'caution'
  | 'compare'
  | 'troubleshoot';

export interface KnowledgePoint {
  id: string;
  dimension: string;
  subcategory: string;
  title: string;
  content: string;
  codeSnippet?: string;
  source: string;
  sourcePath: string;
  tags: string[];
}

export interface ExtractionResult {
  dimension: string;
  knowledgePoints: KnowledgePoint[];
  qaPairs: QAPair[];
  stats: {
    totalKnowledgePoints: number;
    totalQAPairs: number;
    byAngle: Record<QAAngle, number>;
    bySubcategory: Record<string, number>;
  };
}

export interface ValidationResult {
  total: number;
  passed: number;
  failed: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  line: number;
  rule: string;
  message: string;
  content: string;
}

export interface ValidationWarning {
  line: number;
  rule: string;
  message: string;
}

export interface ExtractorConfig {
  projectRoot: string;
  outputPath: string;
  batchSize?: number;
  maxTokensPerEntry: number;
  angleWeights: Record<QAAngle, number>;
}

export const DEFAULT_CONFIG: ExtractorConfig = {
  projectRoot: '',
  outputPath: '',
  maxTokensPerEntry: 2048,
  angleWeights: {
    what: 1,
    how: 1,
    when: 1,
    caution: 0.5,
    compare: 0.3,
    troubleshoot: 0.3,
  },
};

export const DIMENSIONS = [
  'dim01-architecture',
  'dim02-permission',
  'dim03-backend-module',
  'dim04-frontend',
  'dim05-code-review',
  'dim06-business',
  'dim07-testing',
  'dim08-deployment',
  'dim09-scenarios',
  'dim10-systems',
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

export const BATCH_MAP: Record<number, Dimension[]> = {
  1: ['dim02-permission', 'dim04-frontend', 'dim03-backend-module', 'dim09-scenarios'],
  2: ['dim05-code-review', 'dim01-architecture', 'dim10-systems', 'dim06-business'],
  3: ['dim07-testing', 'dim08-deployment'],
};
