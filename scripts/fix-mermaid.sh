#!/bin/bash
# Fix honkit-plugin-mermaid loading order and rendering issues

PLUGIN_DIR="node_modules/honkit-plugin-mermaid"

# Fix index.js - disable HTML escaping for mermaid code
cat > "$PLUGIN_DIR/index.js" << 'EOF'
module.exports = {
    book: {
        assets: './assets',
        js: ['mermaid.min.js', 'mermaid-load.js'],
        css: ['mermaid.css']
    },
    blocks: {
        code: (block) => {
            const lang = block.kwargs.language;
            if (lang !== 'mermaid') {
                return block;
            }
            return block;
        }
    },
    hooks: {
        "page:before": page => {
            page.content = page.content.replace(/```http request/g, "```");
            return page;
        }
    }
};
EOF

# Fix mermaid-load.js - proper rendering logic for Mermaid v9
cat > "$PLUGIN_DIR/assets/mermaid-load.js" << 'EOF'
require(['gitbook', 'jquery'], function (gitbook, $) {
    // 定义渲染函数
    function renderMermaidCharts() {
        setTimeout(function() {
            $('code.lang-mermaid').each(function (i, e) {
                const code = $(e);
                const pre = code.parent('pre');

                // 如果已经渲染成 SVG，跳过
                if (pre.find('svg').length > 0) return;

                // 获取 mermaid 代码（纯文本）
                let mermaidCode = code.text();

                // 创建 mermaid 容器
                const mermaidDiv = $('<div>').addClass('mermaid').text(mermaidCode);

                // 替换 pre 标签
                pre.replaceWith(mermaidDiv);
            });

            // Mermaid v9 uses contentLoaded()
            if (mermaid && typeof mermaid.contentLoaded === 'function') {
                mermaid.contentLoaded();
            }
        }, 300);
    }

    $(document).ready(function () {
        // 初始化 mermaid v9
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
        });

        // 渲染当前页面
        renderMermaidCharts();
    });

    gitbook.events.bind('page.change', function () {
        renderMermaidCharts();
    });
});
EOF

# Update mermaid.min.js to use the installed version (v9 for AMD support)
cp node_modules/mermaid/dist/mermaid.min.js "$PLUGIN_DIR/assets/mermaid.min.js"

echo "Fixed honkit-plugin-mermaid"
