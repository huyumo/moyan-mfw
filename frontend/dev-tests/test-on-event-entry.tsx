/**
 * @fileoverview MfwFormCard on 事件监听独立测试入口
 * @description 不依赖路由系统，直接挂载组件测试 on 配置是否生效
 */
import { createApp, ref, reactive, h, defineComponent } from 'vue';
import { ElButton, ElDivider, ElMessage, ElInput } from 'element-plus';
import 'element-plus/dist/index.css';
import { MfwFormCard } from 'moyan-mfw-base/frontend';
import type { FormItemConfig } from 'moyan-mfw-base/frontend';

/**
 * 模拟自定义组件（类似 ProductSpecDimensionEditor）
 * 通过 emit('generate') 发射自定义事件
 */
const DemoEditor = defineComponent({
  name: 'DemoEditor',
  props: {
    modelValue: { type: [String, Number, Object], default: '' },
  },
  emits: ['update:modelValue', 'generate'],
  setup(props, { emit }) {
    const innerValue = ref<string | number>(
      typeof props.modelValue === 'number' ? props.modelValue : String(props.modelValue ?? '')
    );

    const handleGenerate = () => {
      emit('generate', innerValue.value);
    };

    return () => (
      <div style={{ padding: '12px', border: '1px dashed #dcdfe6', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 8px', color: '#909399', fontSize: '12px' }}>
          模拟自定义组件（类似 ProductSpecDimensionEditor）
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ElInput
            modelValue={innerValue.value}
            {...{
              'onUpdate:modelValue': (val: string | number) => {
                innerValue.value = val;
                emit('update:modelValue', val);
              },
            }}
            placeholder="输入内容会触发 update:modelValue"
            style="width: 240px"
          />
          <ElButton type="primary" onClick={handleGenerate}>
            触发 generate 事件
          </ElButton>
        </div>
      </div>
    );
  },
});

interface LogEntry {
  time: string;
  source: string;
  message: string;
  type: 'on' | 'change' | 'elProps' | 'form-emit';
}

const TestApp = defineComponent({
  name: 'TestApp',
  setup() {
    const formData = reactive<Record<string, any>>({
      demoField: '',
    });
    const logs = ref<LogEntry[]>([]);

    const now = () => new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const addLog = (source: string, message: string, type: LogEntry['type']) => {
      logs.value.unshift({ time: now(), source, message, type });
    };

    // 1. on 配置（待验证的方式）
    const onGenerateHandler = (value: any) => {
      addLog('on.generate', `✅ on 配置触发了！value=${JSON.stringify(value)}`, 'on');
      ElMessage.success('on.generate 触发了！');
    };

    // 2. change 回调（已知生效的方式）
    const changeHandler = (scope: { value: any; key: string; formData: any }) => {
      addLog('change', `change 回调触发，key=${scope.key}, value=${JSON.stringify(scope.value)}`, 'change');
    };

    // 3. elProps.onGenerate（备选方案）
    const elPropsGenerateHandler = (value: any) => {
      addLog('elProps.onGenerate', `✅ elProps.onGenerate 触发了！value=${JSON.stringify(value)}`, 'elProps');
      ElMessage.success('elProps.onGenerate 触发了！');
    };

    // 表单 @change 事件
    const onFormChange = (scope: { value: any; key: string; formData: any }) => {
      addLog('@change', `表单 emit change 事件，key=${scope.key}`, 'form-emit');
    };

    const template: FormItemConfig[] = [
      {
        key: 'demoField',
        label: '演示字段',
        component: DemoEditor,
        span: 24,
        change: changeHandler,
        on: {
          generate: onGenerateHandler,
        },
        elProps: {
          onGenerate: elPropsGenerateHandler,
        },
      },
    ];

    return () => (
      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>MfwFormCard on 事件监听测试</h2>
        <p style={{ marginBottom: '16px', color: '#909399', fontSize: '14px' }}>
          本页面验证 <code style={{ padding: '2px 6px', background: '#f5f7fa', borderRadius: '3px' }}>FormItemConfig.on</code> 配置是否能正确监听自定义组件 emit 的事件。
        </p>

        <div style={{ marginBottom: '20px' }}>
          <MfwFormCard
            formData={formData}
            template={template}
            {...{ onChange: onFormChange }}
          />
        </div>

        <ElDivider />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', margin: 0 }}>事件触发日志</h3>
            <ElButton size="small" onClick={() => (logs.value = [])}>
              清空日志
            </ElButton>
          </div>
          <div
            style={{
              maxHeight: '360px',
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
                暂无日志，请点击上方"触发 generate 事件"按钮
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
                      log.type === 'on'
                        ? '#67c23a'
                        : log.type === 'change'
                          ? '#409eff'
                          : log.type === 'elProps'
                            ? '#e6a23c'
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

createApp(TestApp).mount('#app');
