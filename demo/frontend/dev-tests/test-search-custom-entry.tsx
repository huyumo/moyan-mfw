/**
 * @fileoverview SearchPanel 自定义组件渲染测试入口
 * @description 测试 SearchTemplateItem 的 component/render/slot 三种自定义能力
 */
import { createApp, defineComponent, h, ref } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { ElTag, ElSlider, ElInput, ElSelect, ElCascader, ElTreeSelect } from 'element-plus';
import 'element-plus/dist/index.css';
import { MfwListPage, MfwPageWrapper } from 'moyan-mfw-base/frontend';
import type { SearchTemplateItem, TableColumnConfig } from 'moyan-mfw-base/frontend';

// 模拟树形数据
const treeData = [
  { label: '部门A', value: 'dept-a', children: [{ label: '小组1', value: 'group-1' }] },
  { label: '部门B', value: 'dept-b' },
];

// 模拟级联数据
const cascaderOptions = [
  { label: '技术', value: 'tech', children: [
    { label: '前端', value: 'frontend' },
    { label: '后端', value: 'backend' },
  ]},
  { label: '产品', value: 'product' },
];

const TestApp = defineComponent({
  name: 'TestApp',
  setup() {
    // 搜索模板：涵盖 component / render / slot 三种自定义方式
    const searchTemplate: SearchTemplateItem[] = [
      // 1. 内置 input 类型
      { key: 'keyword', label: '', type: 'input' },

      // 2. 内置 select 类型
      {
        key: 'category',
        label: '',
        type: 'select',
        componentWidth: 100,
        elProps: {
          options: [
            { label: '选项1', value: '1' },
            { label: '选项2', value: '2' },
          ],
        },
      },

      // 3. component: 直接使用 ElInput
      {
        key: 'customInput',
        label: '自定义Input',
        type: 'custom',
        component: ElInput,
        placeholder: '通过 component 属性传入 ElInput',
      },

      // 4. component: 使用 ElSelect
      {
        key: 'customSelect',
        label: '自定义Select',
        type: 'custom',
        component: ElSelect,
        elProps: {
          options: [
            { label: '自定义A', value: 'A' },
            { label: '自定义B', value: 'B' },
          ],
        },
      },

      // 5. component: 使用 ElCascader
      {
        key: 'cascade',
        label: '级联',
        type: 'custom',
        component: ElCascader,
        elProps: { options: cascaderOptions, props: { checkStrictly: true } },
      },

      // 6. component: 使用 ElTreeSelect
      {
        key: 'tree',
        label: '树选',
        component: ElTreeSelect,
        elProps: { data: treeData, checkStrictly: true },
      },

      // 7. render: 自定义渲染函数
      {
        key: 'renderComp',
        label: 'Render函数',
        render: ({ value, setValue }) =>
          h(ElInput, {
            modelValue: value,
            'onUpdate:modelValue': setValue,
            placeholder: '通过 render 函数自定义',
          }),
      },

      // 8. slot: 使用默认插槽名 search-item-${key}
      {
        key: 'status',
        label: '状态',
      },

      // 9. slot: 使用自定义插槽名
      {
        key: 'range',
        label: '范围',
        slot: 'my-range',
        labelWidth: '60px', // 测试单项 labelWidth
        componentWidth: 200, // 测试单项组件宽度
      },

      // 10. date-range 内置类型
      { key: 'dateRange', label: '日期', type: 'date-range', componentWidth: 340 },
    ];

    // 表格列
    const columns: TableColumnConfig[] = [
      { prop: 'id', label: 'ID', width: 80 },
      { prop: 'name', label: '名称' },
      { prop: 'keyword', label: '关键词' },
      { prop: 'customInput', label: '自定义Input' },
      { prop: 'customSelect', label: '自定义Select' },
      { prop: 'status', label: '状态' },
    ];

    // 模拟数据加载
    const loadData = async (params: Record<string, any>) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        total: 3,
        list: [
          { id: 1, name: '数据1', keyword: params.keyword, customInput: params.customInput, customSelect: params.customSelect, status: params.status },
          { id: 2, name: '数据2', keyword: '测试2', customInput: '测试', customSelect: 'A', status: 'active' },
          { id: 3, name: '数据3', keyword: '测试3', customInput: '测试', customSelect: 'B', status: 'inactive' },
        ],
      };
    };

    return () => (
      <MfwPageWrapper title="搜索面板自定义组件测试" headerMode="title">
        <p style={{ marginBottom: '16px', color: '#909399', fontSize: '14px' }}>
          测试 <code style={{ padding: '2px 6px', background: '#f5f7fa', borderRadius: '3px' }}>SearchTemplateItem</code> 的
          <code style={{ padding: '2px 6px', background: '#f5f7fa', borderRadius: '3px', marginLeft: '4px' }}>component</code> /
          <code style={{ padding: '2px 6px', background: '#f5f7fa', borderRadius: '3px', marginLeft: '4px' }}>render</code> /
          <code style={{ padding: '2px 6px', background: '#f5f7fa', borderRadius: '3px', marginLeft: '4px' }}>slot</code> 三种自定义能力
        </p>

        <MfwListPage
          searchTemplate={searchTemplate}
          columns={columns}
          loadData={loadData}
          v-slots={{
            // 默认插槽名示例：search-item-${key}
            'search-item-status': ({ value, setValue }: any) => (
              <ElTag
                type={value === 'active' ? 'success' : value === 'inactive' ? 'danger' : 'info'}
                style="cursor: pointer"
                onClick={() => setValue(value === 'active' ? 'inactive' : 'active')}
              >
                点击切换: {value || '未选择'}
              </ElTag>
            ),
            // 自定义插槽名示例
            'my-range': ({ value, setValue }: any) => (
              <ElSlider
                modelValue={value}
                range
                max={100}
                onUpdate:modelValue={setValue}
              />
            ),
          }}
        />

        <div style={{ padding: '16px', background: '#f5f7fa', borderRadius: '6px', marginTop: '16px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>测试说明</h3>
          <ul style={{ lineHeight: '2', color: '#606266' }}>
            <li><strong>component:</strong> 直接传入组件（如 ElInput、ElSelect、ElCascader、ElTreeSelect）</li>
            <li><strong>render:</strong> 使用渲染函数自定义（支持 prefixIcon 等自定义属性）</li>
            <li><strong>slot:</strong> 使用插槽自定义（支持默认插槽名 search-item-${'{key}'} 和自定义插槽名）</li>
            <li><strong>showLabel:</strong> 控制是否显示 label</li>
            <li><strong>labelWidth:</strong> 单项 labelWidth 覆盖全局设置</li>
            <li><strong>componentWidth:</strong> 单项组件宽度（如日期范围选择器需要更宽）</li>
          </ul>
        </div>
      </MfwPageWrapper>
    );
  },
});

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
});

const app = createApp(TestApp);
app.use(createPinia());
app.use(router);
router.push('/');
app.mount('#app');
