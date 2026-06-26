/**
 * @fileoverview MfwCardListPage 分页渲染独立测试入口
 * @description 不依赖路由系统，直接挂载组件验证 ElPagination 是否正确渲染
 */
import { createApp, defineComponent, h, ref } from 'vue';
import { createPinia } from 'pinia';
import { ElMessage } from 'element-plus';
import 'element-plus/dist/index.css';
import { MfwCardListPage } from 'moyan-mfw-base/frontend';
import type { SearchTemplateItem, LoadParams, TableData } from 'moyan-mfw-base/frontend';

interface LogEntry {
  time: string;
  source: string;
  message: string;
  type: 'render' | 'page-change' | 'size-change' | 'load' | 'search';
}

// 生成模拟数据
function generateMockData(page: number, pageSize: number): TableData {
  const total = 100;
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const list: any[] = [];
  for (let i = start; i < end; i++) {
    list.push({
      id: i + 1,
      name: `项目 ${i + 1}`,
      status: i % 3 === 0 ? '活跃' : i % 3 === 1 ? '待处理' : '已完成',
      createTime: new Date(Date.now() - i * 86400000).toLocaleDateString('zh-CN'),
    });
  }
  return { list, total };
}

const TestApp = defineComponent({
  name: 'TestApp',
  setup() {
    const logs = ref<LogEntry[]>([]);
    const now = () => new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const addLog = (source: string, message: string, type: LogEntry['type']) => {
      logs.value.unshift({ time: now(), source, message, type });
    };

    // 搜索模板
    const searchTemplate: SearchTemplateItem[] = [
      {
        key: 'name',
        label: '名称',
        type: 'input',
        placeholder: '请输入名称',
      },
      {
        key: 'status',
        label: '状态',
        type: 'select',
        placeholder: '请选择状态',
        elProps: {
          options: [
            { label: '活跃', value: '活跃' },
            { label: '待处理', value: '待处理' },
            { label: '已完成', value: '已完成' },
          ],
        },
      },
    ];

    // 模拟数据加载函数
    const loadData = async (params: LoadParams): Promise<TableData> => {
      addLog('loadData', `加载数据: page=${params.page}, pageSize=${params.pageSize}`, 'load');
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 300));
      const result = generateMockData(params.page || 1, params.pageSize || 20);
      addLog('loadData', `数据加载完成: ${result.list.length} 条，总计 ${result.total} 条`, 'load');
      return result;
    };

    // 事件处理
    const handleSearch = (formData: Record<string, any>) => {
      addLog('search', `搜索触发: ${JSON.stringify(formData)}`, 'search');
    };

    const handleReset = () => {
      addLog('search', '重置搜索', 'search');
    };

    const handlePageChange = (page: number, pageSize: number) => {
      addLog('page-change', `页码变化: page=${page}, pageSize=${pageSize}`, 'page-change');
    };

    // 卡片渲染函数
    const cardRender = (item: any, index: number) => {
      return h(
        'div',
        {
          style: {
            padding: '16px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #ebeef5',
          },
        },
        [
          h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } }, [
            h('span', { style: { fontWeight: 600, fontSize: '14px' } }, `#${item.id} ${item.name}`),
            h(
              'span',
              {
                style: {
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background:
                    item.status === '活跃'
                      ? '#e1f3d8'
                      : item.status === '待处理'
                        ? '#faecd8'
                        : '#d9ecff',
                  color:
                    item.status === '活跃'
                      ? '#67c23a'
                      : item.status === '待处理'
                        ? '#e6a23c'
                        : '#409eff',
                },
              },
              item.status
            ),
          ]),
          h('div', { style: { color: '#909399', fontSize: '12px' } }, `创建时间: ${item.createTime}`),
        ]
      );
    };

    return () => (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>MfwCardListPage 分页渲染测试</h2>
        <p style={{ marginBottom: '16px', color: '#909399', fontSize: '14px' }}>
          验证 <code style={{ padding: '2px 6px', background: '#f5f7fa', borderRadius: '3px' }}>ElPagination</code>{' '}
          是否正确渲染，以及分页事件（page-change / size-change）是否正常触发。
        </p>

        <div style={{ marginBottom: '20px', border: '1px solid #ebeef5', borderRadius: '8px', overflow: 'hidden' }}>
          <MfwCardListPage
            searchTemplate={searchTemplate}
            loadData={loadData}
            showSearch={true}
            showPagination={true}
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
            renderMode="card"
            cardRender={cardRender}
            cardGrid={{ minWidth: 280, gap: 16 }}
            emptyText="暂无数据"
            {...{
              onSearch: handleSearch,
              onReset: handleReset,
              onPageChange: handlePageChange,
            }}
          />
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h3 style={{ fontSize: '16px', margin: 0 }}>事件触发日志</h3>
            <button
              onClick={() => (logs.value = [])}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                border: '1px solid #dcdfe6',
                borderRadius: '4px',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              清空日志
            </button>
          </div>
          <div
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '12px',
              background: '#f5f7fa',
              borderRadius: '6px',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '13px',
            }}
          >
            {logs.value.length === 0 ? (
              <div style={{ color: '#c0c4cc', textAlign: 'center', padding: '24px' }}>
                暂无日志，请尝试操作分页或搜索
              </div>
            ) : (
              logs.value.map((log, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '6px 0',
                    borderBottom: '1px solid #ebeef5',
                    color:
                      log.type === 'page-change'
                        ? '#e6a23c'
                        : log.type === 'size-change'
                          ? '#f56c6c'
                          : log.type === 'load'
                            ? '#409eff'
                            : log.type === 'search'
                              ? '#67c23a'
                              : '#909399',
                  }}
                >
                  <span style={{ color: '#909399', flexShrink: 0 }}>{log.time}</span>
                  <span style={{ fontWeight: 600, flexShrink: 0 }}>[{log.source}]</span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  },
});

const app = createApp(TestApp);
app.use(createPinia());
app.mount('#app');
