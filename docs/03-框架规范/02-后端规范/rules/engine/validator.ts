/**
 * @fileoverview 规则验证引擎
 * @description 验证代码是否符合规范定义
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  Rule,
  RuleFile,
  ValidationResult,
  ValidationContext,
  ValidationEngine,
  TaskIndex,
  Priority,
} from './types';

/**
 * 规则验证引擎实现
 */
export class RuleValidator implements ValidationEngine {
  private rulesCache: Map<string, RuleFile> = new Map();
  private rulesDirectory: string;

  constructor(rulesDirectory: string) {
    this.rulesDirectory = rulesDirectory;
  }

  /**
   * 加载规则文件
   */
  async loadRules(rulePath: string): Promise<RuleFile> {
    // 检查缓存
    if (this.rulesCache.has(rulePath)) {
      return this.rulesCache.get(rulePath)!;
    }

    // 读取 YAML 文件
    const fullPath = path.join(this.rulesDirectory, rulePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const ruleFile = yaml.load(content) as RuleFile;

    // 缓存
    this.rulesCache.set(rulePath, ruleFile);

    return ruleFile;
  }

  /**
   * 加载所有规则文件
   */
  async loadAllRules(): Promise<RuleFile[]> {
    const files = fs
      .readdirSync(this.rulesDirectory)
      .filter((f) => f.endsWith('.rules.yaml'));

    const ruleFiles: RuleFile[] = [];
    for (const file of files) {
      const ruleFile = await this.loadRules(file);
      ruleFiles.push(ruleFile);
    }

    return ruleFiles;
  }

  /**
   * 根据任务类型获取适用规则
   */
  async getRulesForTask(taskType: string): Promise<Rule[]> {
    const allRules: Rule[] = [];
    const ruleFiles = await this.loadAllRules();

    for (const ruleFile of ruleFiles) {
      // 查找匹配的任务索引
      const taskIndex = ruleFile.task_index?.find((ti) =>
        ti.trigger_keywords.some((keyword) =>
          taskType.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      if (taskIndex) {
        // 加载必需规则
        for (const ruleRef of taskIndex.required_rules) {
          const rules = this.getRulesByReference(ruleFile, ruleRef);
          allRules.push(...rules);
        }

        // 加载可选规则
        if (taskIndex.optional_rules) {
          for (const ruleRef of taskIndex.optional_rules) {
            const rules = this.getRulesByReference(ruleFile, ruleRef);
            allRules.push(...rules);
          }
        }
      }
    }

    return allRules;
  }

  /**
   * 根据引用获取规则（格式：RULE_FILE_ID:CATEGORY_ID 或 RULE_FILE_ID:RULE_ID）
   */
  private getRulesByReference(ruleFile: RuleFile, reference: string): Rule[] {
    const [fileId, categoryIdOrRuleId] = reference.split(':');
    const rules: Rule[] = [];

    for (const category of ruleFile.categories) {
      // 检查是否匹配分类 ID
      if (category.id === categoryIdOrRuleId) {
        rules.push(...category.rules);
        continue;
      }

      // 检查是否匹配规则 ID
      const rule = category.rules.find((r) => r.id === categoryIdOrRuleId);
      if (rule) {
        rules.push(rule);
      }
    }

    return rules;
  }

  /**
   * 验证代码片段
   */
  async validateSnippet(
    code: string,
    rules: Rule[]
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const rule of rules) {
      const result = await this.validateRule(code, rule, {
        fileContent: code,
        language: 'typescript',
      });

      if (!result.passed) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 验证单个规则
   */
  private async validateRule(
    code: string,
    rule: Rule,
    context: ValidationContext
  ): Promise<ValidationResult> {
    let passed = false;

    switch (rule.type) {
      case 'regex':
        passed = this.validateRegex(code, rule);
        break;
      case 'content':
        passed = this.validateContent(code, rule);
        break;
      case 'naming':
        passed = this.validateNaming(code, rule);
        break;
      case 'ast':
        passed = await this.validateAST(code, rule);
        break;
      case 'structure':
        passed = this.validateStructure(code, rule);
        break;
      default:
        passed = true; // 未知类型默认通过
    }

    // 处理 negative 标志
    if (rule.negative) {
      passed = !passed;
    }

    return {
      passed,
      ruleId: rule.id,
      ruleName: rule.name,
      priority: rule.priority,
      message: passed ? '' : rule.message,
      suggestion: passed ? '' : this.generateSuggestion(rule),
      autoFixable: passed ? false : this.isAutoFixable(rule),
    };
  }

  /**
   * 正则验证
   */
  private validateRegex(code: string, rule: Rule): boolean {
    if (!rule.pattern) return true;

    const regex = new RegExp(rule.pattern, 'gm');
    const match = regex.test(code);

    return rule.negative ? !match : match;
  }

  /**
   * 内容验证
   */
  private validateContent(code: string, rule: Rule): boolean {
    if (!rule.pattern) return true;

    const regex = new RegExp(rule.pattern, 'gm');
    return regex.test(code);
  }

  /**
   * 命名验证
   */
  private validateNaming(code: string, rule: Rule): boolean {
    if (!rule.pattern) return true;

    const regex = new RegExp(rule.pattern, 'gm');
    return regex.test(code);
  }

  /**
   * AST 验证（简化版，实际可接入 @typescript-eslint/parser）
   */
  private async validateAST(code: string, rule: Rule): Promise<boolean> {
    // 简化实现：使用正则模拟 AST 检查
    if (!rule.pattern) return true;

    const regex = new RegExp(rule.pattern, 'gm');
    return regex.test(code);
  }

  /**
   * 结构验证
   */
  private validateStructure(code: string, rule: Rule): boolean {
    // 检查禁止内容
    if (rule.forbidden) {
      for (const forbidden of rule.forbidden) {
        if (code.includes(forbidden)) {
          return false;
        }
      }
    }

    // 检查必需内容
    if (rule.required) {
      for (const required of rule.required) {
        if (!code.includes(required)) {
          return false;
        }
      }
    }

    // 检查模式
    if (rule.pattern) {
      const regex = new RegExp(rule.pattern, 'gm');
      return regex.test(code);
    }

    return true;
  }

  /**
   * 生成修正建议
   */
  private generateSuggestion(rule: Rule): string {
    if (rule.examples?.valid?.[0]) {
      return `参考示例：${rule.examples.valid[0]}`;
    }
    return '';
  }

  /**
   * 检查是否可自动修正
   */
  private isAutoFixable(rule: Rule): boolean {
    // 简单规则不可自动修正，需要 AI 判断
    return false;
  }

  /**
   * 验证文件
   */
  async validateFile(filePath: string): Promise<ValidationResult[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    // 根据文件名加载适用规则
    const ruleFile = await this.loadRulesByFileName(fileName);
    if (!ruleFile) {
      return [];
    }

    // 收集所有规则
    const allRules: Rule[] = [];
    for (const category of ruleFile.categories) {
      allRules.push(...category.rules);
    }

    // 验证
    return this.validateSnippet(content, allRules);
  }

  /**
   * 根据文件名加载适用规则
   */
  private async loadRulesByFileName(fileName: string): Promise<RuleFile | null> {
    // 根据文件名推断适用规则
    if (fileName.endsWith('.service.ts')) {
      // 加载编码基础规范 + 项目架构规范
      return this.loadRules('02-项目架构规范.rules.yaml');
    }

    if (fileName.endsWith('.controller.ts')) {
      // 加载编码基础规范 + 项目架构规范 + API 设计规范
      return this.loadRules('03-API 设计规范.rules.yaml');
    }

    if (fileName.endsWith('.entity.ts')) {
      // 加载数据库规范
      return this.loadRules('04-数据库规范.rules.yaml');
    }

    if (fileName.endsWith('.dto.ts') || fileName.endsWith('.vo.ts')) {
      // 加载 API 设计规范
      return this.loadRules('03-API 设计规范.rules.yaml');
    }

    return null;
  }

  /**
   * 自动修正代码
   */
  async autoFix(code: string, violations: ValidationResult[]): Promise<string> {
    // 当前版本不支持自动修正，返回原代码
    // 未来可接入 AI 进行自动修正
    return code;
  }
}

/**
 * 创建验证引擎实例
 */
export function createValidator(rulesDirectory: string): RuleValidator {
  return new RuleValidator(rulesDirectory);
}
