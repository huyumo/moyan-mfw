# moyan-mfw-base

## 1.2.0-beta.60

### Patch Changes

- 发布体系迁移到 Changesets 独立版本 + CI 动态化（675cb1c7、82ccba2e）：
  - 独立版本 + fixed 组（base/cli），beta 通道改用 changesets pre 模式
  - 扩展包补齐 peerDependencies moyan-mfw-base 声明
  - CI 合并为动态化 release-pipeline，verify:dist 纳入发布链
