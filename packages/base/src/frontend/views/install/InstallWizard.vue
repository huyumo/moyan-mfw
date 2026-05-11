<template>
  <div class="install-wizard">
    <div class="install-container">
      <div class="install-header">
        <h1>系统初始化</h1>
        <p class="subtitle">Welcome to Moyan MFW</p>
      </div>

      <div class="install-content">
        <h2>设置管理员密码</h2>
        <p class="step-desc">请设置超级管理员 admin 的初始密码</p>

        <el-form label-width="120px" class="password-form">
          <el-form-item label="管理员账号">
            <el-input value="admin" disabled data-testid="install-admin-input" />
          </el-form-item>

          <el-form-item label="密码" required>
            <el-input
              v-model="adminPassword"
              type="password"
              placeholder="请输入 8-32 位密码，包含字母和数字"
              show-password
              data-testid="install-password-input"
              :class="{ 'is-error': !passwordValid && adminPassword }"
            />
          </el-form-item>

          <el-form-item label="确认密码" required>
            <el-input
              v-model="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
              data-testid="install-confirm-password-input"
              :class="{ 'is-error': !passwordMatch }"
            />
            <div v-if="!passwordMatch" class="error-text">两次输入的密码不一致</div>
          </el-form-item>

          <el-form-item>
            <el-alert
              title="密码要求"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <ul>
                  <li>长度：8-32 位</li>
                  <li>必须包含字母和数字</li>
                </ul>
              </template>
            </el-alert>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              :disabled="!passwordValid || !passwordMatch"
              data-testid="install-init-btn"
              @click="handleInit"
            >
              <template v-if="loading">
                <Loading class="loading-icon" />
                初始化中...
              </template>
              <template v-else>
                开始初始化
              </template>
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="install-footer">
        <p>© 2026 Moyan MFW. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';

import { ApiInstallInitialize } from '../../apis/sys';
import { resetSystemInitialized } from '../../router/guard';

const router = useRouter();

// 状态
const loading = ref(false);
const adminPassword = ref('');
const confirmPassword = ref('');

// 验证密码
const passwordValid = computed(() => {
  if (!adminPassword.value) return false;
  // 密码要求：8-32 位，包含字母和数字
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,32}$/;
  return passwordRegex.test(adminPassword.value);
});

const passwordMatch = computed(() => {
  if (!confirmPassword.value) return true;
  return adminPassword.value === confirmPassword.value;
});

// 执行初始化
const handleInit = async () => {
  if (!passwordValid.value) {
    ElMessage.error('密码格式不正确，需要 8-32 位且包含字母和数字');
    return;
  }

  if (!passwordMatch.value) {
    ElMessage.error('两次输入的密码不一致');
    return;
  }

  loading.value = true;

  try {
    await new ApiInstallInitialize({
      body: {
        adminPassword: adminPassword.value,
      },
    });

    // 重置系统初始化状态
    resetSystemInitialized();

    ElMessage.success('初始化成功，即将跳转到登录页');

    // 延迟跳转
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '初始化失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.install-wizard {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.install-container {
  width: 100%;
  max-width: 600px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.install-header {
  padding: 40px 40px 20px;
  text-align: center;

  h1 {
    margin: 0;
    font-size: 28px;
    color: #333;
    font-weight: 600;
  }

  .subtitle {
    margin: 10px 0 0;
    color: #999;
    font-size: 14px;
  }
}

.install-content {
  padding: 20px 40px 40px;
}

.step-content {
  h2 {
    margin: 0 0 10px;
    font-size: 20px;
    color: #333;
  }

  .step-desc {
    margin: 0 0 30px;
    color: #666;
    font-size: 14px;
  }
}

.password-form {
  .is-error {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #f56c6c inset;
    }
  }

  .error-text {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 5px;
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      color: #666;
      font-size: 13px;
      line-height: 1.8;
    }
  }
}

.route-preview {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;

  h3 {
    margin: 0 0 15px;
    font-size: 14px;
    color: #606266;
  }
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.install-footer {
  padding: 20px 40px;
  background: #f5f7fa;
  text-align: center;

  p {
    margin: 0;
    color: #999;
    font-size: 12px;
  }
}

.loading-icon {
  margin-right: 5px;
}
</style>
