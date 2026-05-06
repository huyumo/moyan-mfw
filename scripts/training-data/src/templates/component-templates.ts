import type { QAPair } from '../types.js';

interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
}

interface ComponentInfo {
  name: string;
  category: string;
  props: ComponentProp[];
  emits: Array<{ name: string; params: string }>;
  slots: Array<{ name: string; description: string }>;
  expose: Array<{ name: string; description: string }>;
  sourcePath: string;
}

export function generateComponentQAs(info: ComponentInfo): QAPair[] {
  const pairs: QAPair[] = [];

  pairs.push({
    conversations: [
      { role: 'user', content: `moyan-mfw 中 ${info.name} 组件是什么？有什么功能？` },
      { role: 'assistant', content: `${info.name} 是 moyan-mfw 框架的${info.category}组件。\n\nProps 属性：\n${info.props.length > 0 ? info.props.map(p => `- \`${p.name}\` (${p.type})${p.required ? ' 必填' : ' 可选'}${p.description ? ' — ' + p.description : ''}`).join('\n') : '无'}\n\nEvents 事件：\n${info.emits.length > 0 ? info.emits.map(e => `- \`${e.name}\` ${e.params}`).join('\n') : '无'}\n\nSlots 插槽：\n${info.slots.length > 0 ? info.slots.map(s => `- \`${s.name}\` — ${s.description}`).join('\n') : '无'}\n\nExpose 方法：\n${info.expose.length > 0 ? info.expose.map(e => `- \`${e.name}\` — ${e.description}`).join('\n') : '无'}` },
    ],
  });

  for (const prop of info.props) {
    pairs.push({
      conversations: [
        { role: 'user', content: `moyan-mfw ${info.name} 组件的 ${prop.name} 属性怎么用？` },
        { role: 'assistant', content: `${info.name} 的 \`${prop.name}\` 属性：\n\n类型：\`${prop.type}\`\n${prop.required ? '必填' : '可选'}${prop.defaultValue ? `，默认值：\`${prop.defaultValue}\`` : ''}${prop.description ? `\n说明：${prop.description}` : ''}\n\n使用示例：\n\`\`\`vue\n<${info.name} :${prop.name}="value" />\n\`\`\`` },
      ],
    });
  }

  for (const emit of info.emits) {
    pairs.push({
      conversations: [
        { role: 'user', content: `moyan-mfw ${info.name} 组件的 ${emit.name} 事件什么时候触发？` },
        { role: 'assistant', content: `${info.name} 的 \`${emit.name}\` 事件：\n\n参数：${emit.params}\n\n使用示例：\n\`\`\`vue\n<${info.name} @${emit.name}="handle${emit.name.charAt(0).toUpperCase() + emit.name.slice(1)}" />\n\`\`\`` },
      ],
    });
  }

  for (const slot of info.slots) {
    pairs.push({
      conversations: [
        { role: 'user', content: `moyan-mfw ${info.name} 组件的 ${slot.name} 插槽如何使用？` },
        { role: 'assistant', content: `${info.name} 的 \`${slot.name}\` 插槽：\n${slot.description}\n\n使用示例：\n\`\`\`vue\n<${info.name}>\n  <template #${slot.name}>\n    <!-- 自定义内容 -->\n  </template>\n</${info.name}>\n\`\`\`` },
      ],
    });
  }

  for (const exp of info.expose) {
    pairs.push({
      conversations: [
        { role: 'user', content: `moyan-mfw ${info.name} 组件的 ${exp.name} 方法怎么调用？` },
        { role: 'assistant', content: `${info.name} 的 \`${exp.name}\` 暴露方法：\n${exp.description}\n\n通过 ref 调用：\n\`\`\`vue\n<script setup>\nconst ref_${info.name.replace('Mfw', '').toLowerCase()} = ref();\nref_${info.name.replace('Mfw', '').toLowerCase()}.value?.${exp.name}();\n</script>\n\n<${info.name} ref="ref_${info.name.replace('Mfw', '').toLowerCase()}" />\n\`\`\`` },
      ],
    });
  }

  return pairs;
}

export type { ComponentProp, ComponentInfo };
