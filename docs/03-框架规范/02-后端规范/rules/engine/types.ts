/**
 * @fileoverview 规则引擎类型定义
 * @description 定义规则引擎的所有类型接口
 */

// 规则优先级
export type Priority = 'MUST' | 'SHOULD' | 'MAY';

// 规则类型
export type RuleType =
  | 'regex'       // 正则表达式匹配
  | 'ast'         // AST 语法树分析
  | 'content'     // 文件内容检查
  | 'structure'   // 目录/项目结构
  | 'naming'      // 命名规范
  | 'dependency'; // 依赖检查

// 规则定义
export interface Rule {
  id: string;
  name: string;
  priority: Priority;
  type: RuleType;
  target: string;
  pattern?: string;
  negative?: boolean;  // 是否为负向匹配（true 表示匹配到则违规）
  message: string;
  examples?: {
    valid: string[];
    invalid: string[];
  };
  // 扩展字段
  forbidden?: string[];
  required?: string[];
  mapping?: Record<string, string>;
  structure?: {
    type: string;
    required_fields?: Array<{
      name: string;
      type: string;
      fields?: Array<{ name: string; type: string }>;
    }>;
  };
}

// 规则分类
export interface RuleCategory {
  id: string;
  name: string;
  description: string;
  rules: Rule[];
}

// 元数据
export interface RuleMeta {
  id: string;
  name: string;
  version: string;
  source: string;
  last_updated: string;
  priority: Priority;
}

// 任务索引
export interface TaskIndex {
  task: string;
  trigger_keywords: string[];
  required_rules: string[];
  optional_rules?: string[];
}

// 规则文件完整结构
export interface RuleFile {
  meta: RuleMeta;
  categories: RuleCategory[];
  task_index: TaskIndex[];
}

// 验证结果
export interface ValidationResult {
  passed: boolean;
  ruleId: string;
  ruleName: string;
  priority: Priority;
  message: string;
  filePath?: string;
  line?: number;
  column?: number;
  suggestion?: string;      // 修正建议
  autoFixable?: boolean;    // 是否可自动修正
  autoFix?: () => string;   // 自动修正函数
}

// 验证上下文
export interface ValidationContext {
  filePath?: string;
  fileName?: string;
  fileContent: string;
  language: 'typescript' | 'javascript' | 'yaml' | 'json' | 'markdown';
  taskType?: string;  // 任务类型（用于加载适用规则）
}

// 验证引擎接口
export interface ValidationEngine {
  /**
   * 加载规则文件
   */
  loadRules(rulePath: string): Promise<RuleFile>;

  /**
   * 根据任务类型获取适用规则
   */
  getRulesForTask(taskType: string): Promise<Rule[]>;

  /**
   * 验证代码片段
   */
  validateSnippet(code: string, rules: Rule[]): Promise<ValidationResult[]>;

  /**
   * 验证文件
   */
  validateFile(filePath: string): Promise<ValidationResult[]>;

  /**
   * 自动修正代码
   */
  autoFix(code: string, violations: ValidationResult[]): Promise<string>;
}

// AI 提示词上下文
export interface AIPromptContext {
  taskType: string;
  applicableRules: Rule[];
  codeSnippet?: string;
  violations?: ValidationResult[];
}

// 规则引擎配置
export interface EngineConfig {
  rulesDirectory: string;
  enableAutoFix: boolean;
  strictMode: boolean;  // true: MUST 规则违规则拒绝输出
}
