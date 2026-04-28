# 个人资料面板实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用 MfwPopup 弹窗系统实现用户个人资料查看、编辑和修改密码功能，并绑定导航栏头像数据。

**Architecture:** 修改 HeaderAvatarPanel 绑定 authStore 用户数据，创建 ProfilePanel 资料展示页，使用 MfwPopup 打开 ProfileEditForm 和 PasswordChangeForm 弹窗。

**Tech Stack:** Vue 3 Composition API, TypeScript, Element Plus, MfwPopup, moyan-api

---

### Task 1: 创建 ProfilePanel 资料展示面板

**Files:**
- Create: `frontend/src/views/profile/ProfilePanel.vue`

- [ ] **Step 1: 编写 ProfilePanel 组件**

```vue
<template>
  <div class="profile-panel">
    <div class="profile-header">
      <el-avatar :size="80" :src="userInfo.avatar" class="profile-avatar">
        {{ avatarText }}
      </el-avatar>
      <div class="profile-info">
        <div class="info-item">
          <span class="label">用户名：</span>
          <span class="value">{{ userInfo.username }}</span>
        </div>
        <div class="info-item">
          <span class="label">昵称：</span>
          <span class="value">{{ userInfo.nickname || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">手机号：</span>
          <span class="value">{{ userInfo.phone || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">性别：</span>
          <span class="value">{{ genderText }}</span>
        </div>
        <div class="info-item" v-if="userInfo.roles?.length">
          <span class="label">角色：</span>
          <span class="value">{{ userInfo.roles.join('、') }}</span>
        </div>
      </div>
    </div>
    <div class="profile-actions">
      <el-button type="primary" @click="handleEdit">编辑资料</el-button>
      <el-button @click="handleChangePassword">修改密码</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { ApiAuthGetCurrentUser } from '../../apis/sys';
import type { UserInfoDto } from '../../apis/sys/schemas';
import { MfwPopup } from 'moyan-mfw-base-frontend';
import ProfileEditForm from './ProfileEditForm.vue';
import PasswordChangeForm from './PasswordChangeForm.vue';

const userInfo = ref<UserInfoDto>({} as UserInfoDto);
const popupRef = ref<any>(null);

const avatarText = computed(() => {
  return (userInfo.value.nickname || userInfo.value.username || '?').charAt(0).toUpperCase();
});

const genderText = computed(() => {
  const map: Record<number, string> = { 0: '未知', 1: '男', 2: '女' };
  return map[userInfo.value.gender ?? 0] || '未知';
});

const loadUserInfo = async () => {
  try {
    const result = await new ApiAuthGetCurrentUser({});
    userInfo.value = result;
  } catch (e: any) {
    ElMessage.error('获取用户信息失败');
  }
};

const handleEdit = () => {
  MfwPopup.open({
    title: '编辑资料',
    component: ProfileEditForm,
    data: { userInfo: userInfo.value },
    popupProps: { width: '500px' },
    on: {
      confirm: () => {
        loadUserInfo();
      },
    },
  });
};

const handleChangePassword = () => {
  MfwPopup.open({
    title: '修改密码',
    component: PasswordChangeForm,
    popupProps: { width: '500px' },
  });
};

// 组件挂载时加载数据
loadUserInfo();
</script>

<style scoped lang="scss">
.profile-panel {
  padding: 20px;

  .profile-header {
    display: flex;
    gap: 30px;
    margin-bottom: 30px;

    .profile-avatar {
      flex-shrink: 0;
    }

    .profile-info {
      flex: 1;

      .info-item {
        margin-bottom: 12px;
        font-size: 14px;
        line-height: 1.6;

        .label {
          color: #909399;
          min-width: 70px;
          display: inline-block;
        }

        .value {
          color: #303133;
        }
      }
    }
  }

  .profile-actions {
    display: flex;
    gap: 12px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/profile/ProfilePanel.vue
git commit -m "feat: create ProfilePanel user profile display component"
```

---

### Task 2: 创建 ProfileEditForm 编辑表单

**Files:**
- Create: `frontend/src/views/profile/ProfileEditForm.vue`

- [ ] **Step 1: 编写 ProfileEditForm 组件**

```vue
<template>
  <el-form ref="formRef" :model="form" label-width="80px">
    <el-form-item label="昵称" prop="nickname" :rules="[{ max: 50, message: '昵称长度不能超过50个字符', trigger: 'blur' }]">
      <el-input v-model="form.nickname" placeholder="请输入昵称" clearable />
    </el-form-item>
    <el-form-item label="手机号" prop="phone" :rules="[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]">
      <el-input v-model="form.phone" placeholder="请输入手机号" clearable />
    </el-form-item>
    <el-form-item label="性别">
      <el-radio-group v-model="form.gender">
        <el-radio :value="0">未知</el-radio>
        <el-radio :value="1">男</el-radio>
        <el-radio :value="2">女</el-radio>
      </el-radio-group>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { ApiUserUpdate } from '../../apis/sys';
import type { UpdateUserDto } from '../../apis/sys/schemas';

const props = defineProps<{
  userInfo: any;
  popupRef?: any;
}>();

const formRef = ref();
const form = reactive({
  nickname: props.userInfo?.nickname || '',
  phone: props.userInfo?.phone || '',
  gender: props.userInfo?.gender ?? 0,
});

const onConfirm = async () => {
  await formRef.value?.validate();

  const body: UpdateUserDto = {
    nickname: form.nickname,
    phone: form.phone,
    gender: form.gender,
  };

  await new ApiUserUpdate({
    params: { id: props.userInfo.id },
    body,
  }, { hintSuccess: true });

  ElMessage.success('更新成功');
};

defineExpose({ onConfirm });
</script>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/profile/ProfileEditForm.vue
git commit -m "feat: create ProfileEditForm user profile edit component"
```

---

### Task 3: 创建 PasswordChangeForm 修改密码表单

**Files:**
- Create: `frontend/src/views/profile/PasswordChangeForm.vue`

- [ ] **Step 1: 编写 PasswordChangeForm 组件**

```vue
<template>
  <el-form ref="formRef" :model="form" label-width="80px">
    <el-form-item label="旧密码" prop="oldPassword" :rules="[{ required: true, message: '请输入旧密码', trigger: 'blur' }]">
      <el-input v-model="form.oldPassword" type="password" placeholder="请输入旧密码" show-password />
    </el-form-item>
    <el-form-item label="新密码" prop="newPassword" :rules="[
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 8, max: 20, message: '密码长度为8-20位', trigger: 'blur' },
    ]">
      <el-input v-model="form.newPassword" type="password" placeholder="请输入新密码" show-password />
    </el-form-item>
    <el-form-item label="确认密码" prop="confirmPassword" :rules="[
      { required: true, message: '请确认新密码', trigger: 'blur' },
      { validator: validateConfirmPassword, trigger: 'blur' },
    ]">
      <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { ApiAuthChangePassword } from '../../apis/sys';

const formRef = ref();
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const onConfirm = async () => {
  await formRef.value?.validate();

  await new ApiAuthChangePassword({
    body: {
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    },
  }, { hintSuccess: true });

  ElMessage.success('密码修改成功，请重新登录');

  // 修改密码后跳转登录页
  setTimeout(() => {
    window.localStorage.removeItem('mfw:admin:token');
    window.location.href = '/login';
  }, 1000);
};

defineExpose({ onConfirm });
</script>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/profile/PasswordChangeForm.vue
git commit -m "feat: create PasswordChangeForm password change component"
```

---

### Task 4: 修改 HeaderAvatarPanel 绑定用户数据

**Files:**
- Modify: `frontend/src/components/Layout/components/HeaderAvatarPanel.vue`

- [ ] **Step 1: 重写 HeaderAvatarPanel 组件**

```vue
<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <div class="user-avatar-panel">
      <el-avatar :size="32" :src="avatarUrl" class="avatar">
        {{ avatarText }}
      </el-avatar>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="profile">我的资料</el-dropdown-item>
        <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth-store';
import { MfwPopup } from 'moyan-mfw-base-frontend';
import ProfilePanel from '../../views/profile/ProfilePanel.vue';

const router = useRouter();
const authStore = useAuthStore();

const avatarUrl = computed(() => authStore.user?.avatar || '');
const avatarText = computed(() => {
  const name = authStore.user?.nickname || authStore.user?.username || '?';
  return name.charAt(0).toUpperCase();
});

function handleCommand(command: string) {
  if (command === 'logout') {
    window.localStorage.removeItem('mfw:admin:token');
    router.push('/login');
    return;
  }

  if (command === 'profile') {
    MfwPopup.open({
      title: '我的资料',
      component: ProfilePanel,
      popupProps: { width: '600px' },
      footer: false,
    });
  }
}
</script>

<style scoped lang="scss">
.user-avatar-panel {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;

  .avatar {
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Layout/components/HeaderAvatarPanel.vue
git commit -m "feat: bind HeaderAvatarPanel to authStore user data with profile popup"
```

---

### Task 5: 验证和测试

**Files:**
- N/A (verification only)

- [ ] **Step 1: 检查类型**

```bash
cd frontend && pnpm run typecheck 2>&1 | Select-String -Pattern "profile|Profile|HeaderAvatar"
```

Expected: 无相关类型错误

- [ ] **Step 2: 启动开发服务器验证**

- 登录后点击头像下拉菜单
- 点击"我的资料"查看资料面板
- 点击"编辑资料"验证编辑功能
- 点击"修改密码"验证密码修改功能

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -m "chore: verify profile panel integration"
```
