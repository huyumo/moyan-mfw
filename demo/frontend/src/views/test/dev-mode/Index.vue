<template>
  <section class="mfw-dev-mode-test">
    <h2>开发者模式功能测试</h2>

    <!-- 当前状态展示 -->
    <el-card shadow="never" class="test-card">
      <template #header>当前状态</template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="isDeveloper">
          <el-tag :type="authStore.user?.isDeveloper ? 'success' : 'info'">
            {{ authStore.user?.isDeveloper ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="devModeEnabled">
          <el-tag :type="authStore.devModeEnabled ? 'success' : 'info'">
            {{ authStore.devModeEnabled ? '已开启' : '已关闭' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="isDevModeActive (computed)">
          <el-tag :type="authStore.isDevModeActive ? 'success' : 'info'">
            {{ authStore.isDevModeActive ? '激活' : '未激活' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="hasDeveloperPassword">
          <el-tag :type="authStore.user?.hasDeveloperPassword ? 'success' : 'info'">
            {{ authStore.user?.hasDeveloperPassword ? '已设置' : '未设置' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 测试用例 1: showMode=DEV 页面菜单可见性 -->
    <el-card shadow="never" class="test-card">
      <template #header>
        测试用例 1：showMode=DEV 页面可见性
        <el-tag size="small" type="warning" class="test-tag">showMode 控制</el-tag>
      </template>
      <el-alert type="info" :closable="false" show-icon>
        此页面本身在菜单树中设置了 <code>showMode: 'DEV'</code>。
        非开发者或开发者模式未开启时，此页面不出现在侧边栏菜单中，且直接输入 URL 会被路由守卫拦截。
      </el-alert>
      <div class="test-result">
        <el-icon color="#67c23a" v-if="authStore.isDevModeActive"><CircleCheckFilled /></el-icon>
        <el-icon color="#f56c6c" v-else><CircleCloseFilled /></el-icon>
        <span>
          {{ authStore.isDevModeActive
            ? '通过：当前能访问此页面，说明开发者模式已激活'
            : '异常：开发者模式未激活但页面仍可见（可能存在问题）'
          }}
        </span>
      </div>
    </el-card>

    <!-- 测试用例 2: isDevModeActive 控制按钮 -->
    <el-card shadow="never" class="test-card">
      <template #header>
        测试用例 2：isDevModeActive 控制按钮显示
        <el-tag size="small" type="primary" class="test-tag">与 showMode 无关</el-tag>
      </template>
      <el-alert type="info" :closable="false" show-icon>
        下方按钮使用 <code>v-if="authStore.isDevModeActive"</code> 控制，
        与 <code>showMode</code> 无关，适用于在任何页面控制开发者专属操作按钮。
      </el-alert>
      <div class="test-buttons">
        <el-button v-if="authStore.isDevModeActive" type="danger" :icon="Delete">
          清除缓存（仅开发者可见）
        </el-button>
        <el-button v-if="authStore.isDevModeActive" type="warning" :icon="Warning">
          重置配置（仅开发者可见）
        </el-button>
        <el-button v-if="authStore.isDevModeActive" :icon="Tools">
          调试工具（仅开发者可见）
        </el-button>
        <span v-if="!authStore.isDevModeActive" class="test-placeholder">
          开发者模式未激活，以上按钮不可见
        </span>
      </div>
    </el-card>

    <!-- 测试用例 3: isDevModeActive 控制区域 -->
    <el-card shadow="never" class="test-card">
      <template #header>
        测试用例 3：isDevModeActive 控制整个区域
        <el-tag size="small" type="primary" class="test-tag">与 showMode 无关</el-tag>
      </template>
      <el-alert type="info" :closable="false" show-icon>
        下方整个调试信息区域使用 <code>v-if="authStore.isDevModeActive"</code> 控制。
        适用于在任何页面中展示开发者专属的调试面板、诊断信息等。
      </el-alert>
      <div v-if="authStore.isDevModeActive" class="test-dev-panel">
        <h4>🔧 开发者调试面板</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="当前应用">{{ authStore.currentApp?.appName || '未选择' }}</el-descriptions-item>
          <el-descriptions-item label="AppID">{{ authStore.currentApp?.appId || '无' }}</el-descriptions-item>
          <el-descriptions-item label="权限菜单数">{{ authStore.permissionMenu.length }}</el-descriptions-item>
          <el-descriptions-item label="路由映射数">{{ authStore.routePermCodeMap.size }}</el-descriptions-item>
        </el-descriptions>
        <div class="test-dev-actions">
          <el-button size="small" @click="authStore.loadPermissions(authStore.currentApp!.appId)">
            重新加载权限
          </el-button>
          <el-button size="small" @click="handlePrintState">打印状态到控制台</el-button>
        </div>
      </div>
      <el-empty v-else description="开发者模式未激活，调试面板不可见" :image-size="60" />
    </el-card>

    <!-- 测试用例 4: isDevModeActive 在 computed 中使用 -->
    <el-card shadow="never" class="test-card">
      <template #header>
        测试用例 4：isDevModeActive 在 computed 中使用
        <el-tag size="small" type="success" class="test-tag">框架使用者示例</el-tag>
      </template>
      <el-alert type="info" :closable="false" show-icon>
        框架使用者可在自己的组件中通过 <code>computed</code> 组合 <code>isDevModeActive</code> 实现复杂条件控制。
      </el-alert>
      <pre class="test-code">{{ codeExample }}</pre>
      <div class="test-result">
        <span>当前 computed 结果：</span>
        <el-tag :type="showDevContent ? 'success' : 'info'" size="small">
          {{ showDevContent ? '显示开发者内容' : '显示常规内容' }}
        </el-tag>
      </div>
    </el-card>

    <!-- 操作按钮 -->
    <el-card shadow="never" class="test-card">
      <template #header>操作</template>
      <div class="test-actions">
        <el-button
          :type="authStore.devModeEnabled ? 'danger' : 'primary'"
          @click="handleToggleDevMode"
        >
          {{ authStore.devModeEnabled ? '关闭开发者模式' : '开启开发者模式' }}
        </el-button>
        <el-button @click="handleRefresh">刷新页面（测试持久化）</el-button>
      </div>
      <el-alert
        v-if="authStore.devModeEnabled"
        type="warning"
        :closable="false"
        show-icon
        class="test-alert"
      >
        开发者模式已开启，刷新页面后应仍保持开启状态（sessionStorage 持久化）。
      </el-alert>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  CircleCheckFilled,
  CircleCloseFilled,
  Delete,
  Warning,
  Tools,
} from '@element-plus/icons-vue';
import { useAuthStore } from 'moyan-mfw-base/frontend';

const authStore = useAuthStore();

/** 测试用例 4 的 computed：组合 isDevModeActive 实现条件渲染 */
const showDevContent = computed(() => authStore.isDevModeActive);

const codeExample = `import { computed } from 'vue';
import { useAuthStore } from 'moyan-mfw-base/frontend';

const authStore = useAuthStore();

// 组合 isDevModeActive 控制内容
const showDevContent = computed(() => authStore.isDevModeActive);

// 在模板中使用
// <div v-if="showDevContent">仅开发者可见的内容</div>`;

function handleToggleDevMode() {
  if (authStore.devModeEnabled) {
    authStore.disableDevMode();
  } else {
    authStore.enableDevMode();
  }
}

function handleRefresh() {
  window.location.reload();
}

function handlePrintState() {
  console.log('=== 开发者模式状态 ===');
  console.log('isDeveloper:', authStore.user?.isDeveloper);
  console.log('devModeEnabled:', authStore.devModeEnabled);
  console.log('isDevModeActive:', authStore.isDevModeActive);
  console.log('hasDeveloperPassword:', authStore.user?.hasDeveloperPassword);
  console.log('sessionStorage DEV_MODE_KEY:', sessionStorage.getItem('mfw:admin:dev_mode'));
  console.log('permissionMenu:', authStore.permissionMenu);
}
</script>

<style scoped lang="scss">
.mfw-dev-mode-test {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;

  h2 {
    margin: 0;
  }
}

.test-card {
  .test-tag {
    margin-left: 8px;
  }
}

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 14px;
}

.test-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.test-placeholder {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.test-dev-panel {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;

  h4 {
    margin: 0 0 12px 0;
  }
}

.test-dev-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.test-code {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color-darker);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  color: var(--el-text-color-primary);
}

.test-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.test-alert {
  margin-top: 12px;
}
</style>
