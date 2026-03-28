/**
 * @fileoverview 登录页扩展测试。
 */

import { createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import type { Component } from 'vue';
import { describe, expect, it } from 'vitest';
import LoginPage from './LoginPage.vue';
import { useLayoutStore } from '../store/layout-store';
import type { LoginExtensionComponents } from '../types/layout-types';

const ElFormStub: Component = {
  props: {
    model: {
      type: Object,
      default: () => ({}),
    },
    rules: {
      type: Object,
      default: () => ({}),
    },
  },
  methods: {
    validate() {
      return Promise.resolve(true);
    },
  },
  template: '<form><slot /></form>',
};

const ElFormItemStub: Component = {
  template: '<div><slot /></div>',
};

const ElInputStub: Component = {
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target && $event.target.value ? $event.target.value : \'\')" />',
};

const ElButtonStub: Component = {
  template: '<button><slot /></button>',
};

const DashboardStub: Component = {
  template: '<div>dashboard</div>',
};

async function mountLoginPage(loginExtensions: LoginExtensionComponents = {}) {
  const pinia = createPinia();
  const layoutStore = useLayoutStore(pinia);
  layoutStore.setLoginExtensions(loginExtensions);

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginPage as Component },
      { path: '/dashboard', component: DashboardStub as Component },
    ],
  });

  await router.push('/login');
  await router.isReady();

  return mount(LoginPage, {
    global: {
      plugins: [pinia, router],
      stubs: {
        ElForm: ElFormStub,
        ElFormItem: ElFormItemStub,
        ElInput: ElInputStub,
        ElButton: ElButtonStub,
      },
    },
  });
}

describe('LoginPage', () => {
  it('未配置 methods 扩展时显示空态', async () => {
    const wrapper = await mountLoginPage();
    expect(wrapper.text()).toContain('No extra login methods configured.');
  });

  it('配置 methods 扩展时渲染内容', async () => {
    const wrapper = await mountLoginPage({
      methods: {
        template: '<div class="methods-extension">扩展内容</div>',
      } as Component,
    });

    expect(wrapper.find('.methods-extension').exists()).toBe(true);
    expect(wrapper.text()).toContain('扩展内容');
  });
});
