/**
 * @fileoverview Jest 集成测试配置
 * @description base 包 tests/ 目录的 Jest 配置，由 @internal/base-backend 的 test 脚本调用。
 * 依赖解析：pnpm 严格目录结构下 tests/ 无法直接解析 @nestjs/*，通过 moduleDirectories
 * 指向 backend 包的 node_modules（与其 tests/tsconfig.json 的 paths 保持一致）。
 *
 * globalSetup/globalTeardown 及其依赖图经 Node 原生 require 加载，不应用 Jest 的
 * moduleNameMapper/moduleDirectories，因此在此注册 Node 层 require hook 兜底：
 * - 将业务代码的 `@/` 路径别名映射到 backend 源码目录（支持 .ts / index.ts）
 * - 将 @nestjs/*、typeorm 等模块重定向到 backend 包的 node_modules
 */
const path = require("path");
const fs = require("fs");
const Module = require("module");

const backendSrc = path.join(__dirname, "../src/backend/src");
const backendNodeModules = path.join(__dirname, "../src/backend/node_modules");
const testRoot = __dirname;

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  // 仅对测试目录与 backend 源码的依赖图生效，避免影响 Jest 自身加载
  const parentFile = parent && parent.filename;
  const isTestRelated =
    parentFile &&
    (parentFile.startsWith(testRoot) ||
      parentFile.startsWith(backendSrc) ||
      parentFile.startsWith(backendNodeModules));

  if (isTestRelated && !request.startsWith(".")) {
    if (request.startsWith("@/")) {
      const base = path.join(backendSrc, request.slice(2));
      const candidates = [
        base,
        base + ".ts",
        base + ".tsx",
        path.join(base, "index.ts"),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          request = candidate;
          break;
        }
      }
    } else {
      const mapped = path.join(backendNodeModules, request);
      if (fs.existsSync(path.join(mapped, "package.json"))) {
        request = mapped;
      }
    }
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

module.exports = {
  rootDir: __dirname,
  testEnvironment: "node",
  testRegex: "integration/.*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      { tsconfig: path.join(__dirname, "tsconfig.jest.json") },
    ],
  },
  moduleFileExtensions: ["js", "json", "ts"],
  moduleNameMapper: {
    "^@/(.*)$": path.join(__dirname, "../src/backend/src/$1"),
  },
  moduleDirectories: [
    "node_modules",
    path.join(__dirname, "../src/backend/node_modules"),
  ],
  globalSetup: "<rootDir>/setup/jest.global-setup.ts",
  globalTeardown: "<rootDir>/setup/jest.global-teardown.ts",
  setupFiles: [
    "<rootDir>/setup/jest.env.setup.ts",
    "<rootDir>/setup/jest.setup.ts",
  ],
  testTimeout: 60000,
  verbose: true,
};
