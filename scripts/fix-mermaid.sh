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
    $(document).ready(function () {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
        });
        renderMermaidCharts();
    });

    gitbook.events.bind('page.change', function () {
        renderMermaidCharts();
    });

    function renderMermaidCharts() {
        setTimeout(function() {
            $('code.lang-mermaid').each(function (i, e) {
                const code = $(e);
                const pre = code.parent('pre');
                if (pre.find('svg').length > 0) return;
                let mermaidCode = code.text();
                const mermaidDiv = $('<div>').addClass('mermaid').text(mermaidCode);
                pre.replaceWith(mermaidDiv);
            });
            // Mermaid v9 uses contentLoaded()
            if (mermaid && mermaid.contentLoaded) {
                mermaid.contentLoaded();
            }
        }, 200);
    }
});
EOF

# Update mermaid.min.js to use the installed version (v9 for AMD support)
cp node_modules/mermaid/dist/mermaid.min.js "$PLUGIN_DIR/assets/mermaid.min.js"

echo "Fixed honkit-plugin-mermaid"
