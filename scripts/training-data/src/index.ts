import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync, existsSync } from 'fs';
import { writeJSONL, readJSONL, splitTestSet } from './utils/jsonl-formatter.js';
import { validateJSONL, printValidationReport } from './utils/validator.js';
import { extractPermissionDimension } from './extractors/dim02-permission.js';
import { extractFrontendDimension } from './extractors/dim04-frontend.js';
import { extractBackendModuleDimension } from './extractors/dim03-backend-module.js';
import { extractScenariosDimension } from './extractors/dim09-scenarios.js';
import { extractTestingDimension } from './extractors/dim07-testing.js';
import { extractDeploymentDimension } from './extractors/dim08-deployment.js';
import { extractArchitectureDimension } from './extractors/dim01-architecture.js';
import { extractCodeReviewDimension } from './extractors/dim05-code-review.js';
import { extractBusinessDimension } from './extractors/dim06-business.js';
import { extractSystemsDimension } from './extractors/dim10-systems.js';
import type { QAPair, Dimension } from './types.js';
import { BATCH_MAP } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');
const outputDir = join(__dirname, '../output');

const EXTRACTORS: Record<string, (root: string) => any> = {
  'dim02-permission': extractPermissionDimension,
  'dim04-frontend': extractFrontendDimension,
  'dim03-backend-module': extractBackendModuleDimension,
  'dim09-scenarios': extractScenariosDimension,
  'dim07-testing': extractTestingDimension,
  'dim08-deployment': extractDeploymentDimension,
  'dim01-architecture': extractArchitectureDimension,
  'dim05-code-review': extractCodeReviewDimension,
  'dim06-business': extractBusinessDimension,
  'dim10-systems': extractSystemsDimension,
};

async function main() {
  const args = process.argv.slice(2);
  const batchFlag = args.indexOf('--batch');
  const batchSize = batchFlag >= 0 ? parseInt(args[batchFlag + 1]) : null;
  const validateOnly = args.includes('--validate-only');
  const statsOnly = args.includes('--stats');

  const dimensions: Dimension[] = batchSize
    ? BATCH_MAP[batchSize] || []
    : (Object.keys(EXTRACTORS) as Dimension[]);

  if (dimensions.length === 0) {
    console.error('No dimensions to extract. Available batches: 1, 2, 3');
    process.exit(1);
  }

  const allQAs: QAPair[] = [];
  let totalKP = 0;

  for (const dim of dimensions) {
    const extractor = EXTRACTORS[dim];
    if (!extractor) {
      console.warn(`No extractor for ${dim}, skipping`);
      continue;
    }

    console.log(`\n提取维度: ${dim}...`);
    const result = extractor(projectRoot);
    console.log(`  知识点: ${result.stats.totalKnowledgePoints}`);
    console.log(`  Q&A 条: ${result.stats.totalQAPairs}`);
    totalKP += result.stats.totalKnowledgePoints;

    writeJSONL(result.qaPairs, join(outputDir, `${dim}.jsonl`));
    allQAs.push(...result.qaPairs);
  }

  const manualDir = join(__dirname, '../data/manual-supplements');
  if (existsSync(manualDir)) {
    const manualFiles = readdirSync(manualDir).filter(f => f.endsWith('.jsonl'));
    for (const file of manualFiles) {
      console.log(`合并人工数据: ${file}`);
      const pairs = readJSONL(join(manualDir, file));
      allQAs.push(...pairs);
    }
  }

  const expDir = join(__dirname, '../data/dev-experiences');
  if (existsSync(expDir)) {
    const expFiles = readdirSync(expDir).filter(f => f.endsWith('.jsonl'));
    for (const file of expFiles) {
      console.log(`合并开发经验: ${file}`);
      const pairs = readJSONL(join(expDir, file));
      allQAs.push(...pairs);
    }
  }

  if (statsOnly) {
    console.log(`\n========== 统计 ==========`);
    console.log(`总知识点: ${totalKP}`);
    console.log(`总 Q&A: ${allQAs.length} 条`);
    return;
  }

  if (validateOnly) {
    const result = validateJSONL(allQAs);
    printValidationReport(result);
    return;
  }

  const { train, test } = splitTestSet(allQAs, 0.05);
  const batchFileName = batchSize ? `batch0${batchSize}.jsonl` : 'all-train.jsonl';
  writeJSONL(train, join(outputDir, batchFileName));
  writeJSONL(test, join(outputDir, '../data/test-set/test-set.jsonl'));

  const validation = validateJSONL(allQAs);
  printValidationReport(validation);

  console.log(`\n========== 最终统计 ==========`);
  console.log(`总知识点: ${totalKP}`);
  console.log(`训练集: ${train.length} 条`);
  console.log(`测试集: ${test.length} 条`);
  console.log(`输出目录: ${outputDir}`);
}

main().catch(console.error);
