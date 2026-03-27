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

# Fix mermaid-load.js - 不使用 AMD/RequireJS
cat > "$PLUGIN_DIR/assets/mermaid-load.js" << 'EOF'
// Mermaid v9 渲染脚本 - 不使用 AMD/RequireJS
(function() {
    function init() {
        if (!window.mermaid) {
            console.log('Mermaid not loaded yet, retrying...');
            setTimeout(init, 100);
            return;
        }
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
        });
        renderMermaidCharts();
    }

    function renderMermaidCharts() {
        setTimeout(function() {
            var codeBlocks = document.querySelectorAll('code.lang-mermaid');
            for (var i = 0; i < codeBlocks.length; i++) {
                var code = codeBlocks[i];
                var pre = code.parentNode;
                if (pre.querySelector('svg')) continue;
                var mermaidCode = code.textContent;
                var mermaidDiv = document.createElement('div');
                mermaidDiv.className = 'mermaid';
                mermaidDiv.textContent = mermaidCode;
                pre.parentNode.replaceChild(mermaidDiv, pre);
            }
            if (mermaid && typeof mermaid.contentLoaded === 'function') {
                mermaid.contentLoaded();
            }
        }, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    document.addEventListener('gitbook.page.change', function() {
        renderMermaidCharts();
    });
})();
EOF

# Update mermaid.min.js to use the installed version (v9 for AMD support)
cp node_modules/mermaid/dist/mermaid.min.js "$PLUGIN_DIR/assets/mermaid.min.js"

echo "Fixed honkit-plugin-mermaid"
