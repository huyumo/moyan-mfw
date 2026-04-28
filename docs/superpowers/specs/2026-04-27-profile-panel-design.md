# 个人资料面板 - 设计文档

## 1. 概述

基于现有 `MfwPopup` 弹窗系统实现用户个人资料查看和编辑功能。包含：
- HeaderAvatarPanel 显示用户头像和快捷操作
- ProfilePanel 展示用户详细资料（弹窗）
- ProfileEditForm 编辑基础资料（弹窗）
- PasswordChangeForm 修改密码（弹窗）

## 2. 技术方案

### 2.1 现有 API

| 用途 | API 类 | 路径 | 说明 |
|------|--------|------|------|
| 获取当前用户 | `ApiAuthGetCurrentUser` | POST `/api/auth/userinfo` | 获取用户详细信息 |
| 更新用户 | `ApiUserUpdate` | PUT `/api/users/{id}` | 更新昵称、头像、性别等 |
| 修改密码 | `ApiAuthChangePassword` | POST `/api/auth/change-password` | 修改登录密码 |

### 2.2 弹窗系统

项目已有 `MfwPopup` 命令式弹窗系统：

```typescript
MfwPopup.open({
  title: '我的资料',
  component: ProfilePanel,
  data: { userId: authStore.user?.id },
  footer: false,
})
```

## 3. 文件结构

```
frontend/src/
  ├── components/Layout/components/
  │   └── HeaderAvatarPanel.vue       # 修改：绑定用户数据
  └── views/profile/
      ├── ProfilePanel.vue            # 资料展示面板
      ├── ProfileEditForm.vue         # 编辑资料表单
      └── PasswordChangeForm.vue      # 修改密码表单
```

## 4. 组件设计

### 4.1 HeaderAvatarPanel

**职责：** 显示用户头像，提供下拉菜单

**改动：**
- 从 `authStore` 获取用户信息
- 头像使用 `el-avatar`，显示用户头像或首字母
- 下拉菜单简化为：我的资料、退出登录
- 点击"我的资料"调用 `MfwPopup.open(ProfilePanel)`

### 4.2 ProfilePanel

**职责：** 展示用户详细资料，提供编辑入口

**布局：**
```
┌──────────────────────────────────────────┐
│                  我的资料                 │
├──────────────────────────────────────────┤
│                                          │
│   ┌─────┐                                │
│   │ 头像│    用户名：admin               │
│   └─────┘    昵称：张三                  │
│              手机号：138****1234         │
│              性别：男                    │
│              角色：系统管理员            │
│                                          │
│       [编辑资料]      [修改密码]         │
│                                          │
└──────────────────────────────────────────┘
```

**交互：**
- 页面加载时调用 `ApiAuthGetCurrentUser` 获取最新用户信息
- 点击"编辑资料" → `MfwPopup.open(ProfileEditForm)`，编辑成功后刷新面板数据
- 点击"修改密码" → `MfwPopup.open(PasswordChangeForm)`

### 4.3 ProfileEditForm

**职责：** 编辑用户基础资料

**表单字段：**
- 头像（可选，使用 `el-upload`）
- 昵称（必填，最大 50 字符）
- 手机号（可选，格式验证）
- 性别（单选：未知/男/女）

**交互：**
- `onConfirm()` 调用 `ApiUserUpdate` 更新用户信息
- 成功后关闭弹窗并触发 `refresh` 回调

### 4.4 PasswordChangeForm

**职责：** 修改登录密码

**表单字段：**
- 旧密码（必填）
- 新密码（必填，8-20 位，包含字母和数字）
- 确认密码（必填，需与新密码一致）

**交互：**
- `onConfirm()` 调用 `ApiAuthChangePassword`
- 成功后提示"修改成功，请重新登录"并跳转登录页

## 5. 数据流

```
HeaderAvatarPanel
  └─ authStore.user (已登录用户信息)
      │
      └─ 点击"我的资料"
          └─ MfwPopup.open(ProfilePanel)
              │
              ├─ ApiAuthGetCurrentUser() → 获取最新数据
              │
              ├─ 点击"编辑资料"
              │   └─ MfwPopup.open(ProfileEditForm)
              │       └─ ApiUserUpdate({ id, ... })
              │           └─ 成功 → 刷新 ProfilePanel
              │
              └─ 点击"修改密码"
                  └─ MfwPopup.open(PasswordChangeForm)
                      └─ ApiAuthChangePassword({ oldPassword, newPassword })
                          └─ 成功 → 提示并跳转登录
```
