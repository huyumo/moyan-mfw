@echo off
REM Fix honkit-plugin-mermaid loading order and rendering issues

SET PLUGIN_DIR=node_modules\honkit-plugin-mermaid

REM Fix index.js
echo module.exports = { > %PLUGIN_DIR%\index.js
echo     book: { >> %PLUGIN_DIR%\index.js
echo         assets: './assets', >> %PLUGIN_DIR%\index.js
echo         js: ['mermaid.min.js', 'mermaid-load.js'], >> %PLUGIN_DIR%\index.js
echo         css: ['mermaid.css'] >> %PLUGIN_DIR%\index.js
echo     }, >> %PLUGIN_DIR%\index.js
echo     blocks: { >> %PLUGIN_DIR%\index.js
echo         code: (block) =^> { >> %PLUGIN_DIR%\index.js
echo             const lang = block.kwargs.language; >> %PLUGIN_DIR%\index.js
echo             if (lang !== 'mermaid') { >> %PLUGIN_DIR%\index.js
echo                 return block; >> %PLUGIN_DIR%\index.js
echo             } >> %PLUGIN_DIR%\index.js
echo             return block; >> %PLUGIN_DIR%\index.js
echo         } >> %PLUGIN_DIR%\index.js
echo     }, >> %PLUGIN_DIR%\index.js
echo     hooks: { >> %PLUGIN_DIR%\index.js
echo         "page:before": page =^> { >> %PLUGIN_DIR%\index.js
echo             page.content = page.content.replace(/```http request/g, "```"); >> %PLUGIN_DIR%\index.js
echo             return page; >> %PLUGIN_DIR%\index.js
echo         } >> %PLUGIN_DIR%\index.js
echo     } >> %PLUGIN_DIR%\index.js
echo }; >> %PLUGIN_DIR%\index.js

REM Fix mermaid-load.js - 不使用 AMD/RequireJS
echo // Mermaid v9 渲染脚本 - 不使用 AMD/RequireJS > %PLUGIN_DIR%\assets\mermaid-load.js
echo (function() { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     function init() { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         if (!window.mermaid) { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             console.log('Mermaid not loaded yet, retrying...'); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             setTimeout(init, 100); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             return; >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         } >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         mermaid.initialize({ >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             startOnLoad: false, >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             theme: 'default', >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             securityLevel: 'loose', >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         }); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         renderMermaidCharts(); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     } >> %PLUGIN_DIR%\assets\mermaid-load.js
echo. >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     function renderMermaidCharts() { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         setTimeout(function() { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             var codeBlocks = document.querySelectorAll('code.lang-mermaid'); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             for (var i = 0; i ^< codeBlocks.length; i++) { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 var code = codeBlocks[i]; >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 var pre = code.parentNode; >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 if (pre.querySelector('svg')) continue; >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 var mermaidCode = code.textContent; >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 var mermaidDiv = document.createElement('div'); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 mermaidDiv.className = 'mermaid'; >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 mermaidDiv.textContent = mermaidCode; >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 pre.parentNode.replaceChild(mermaidDiv, pre); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             } >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             if (mermaid ^&^& typeof mermaid.contentLoaded === 'function') { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 mermaid.contentLoaded(); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             } >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         }, 300); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     } >> %PLUGIN_DIR%\assets\mermaid-load.js
echo. >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     if (document.readyState === 'loading') { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         document.addEventListener('DOMContentLoaded', init); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     } else { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         init(); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     } >> %PLUGIN_DIR%\assets\mermaid-load.js
echo. >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     document.addEventListener('gitbook.page.change', function() { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         renderMermaidCharts(); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     }); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo })(); >> %PLUGIN_DIR%\assets\mermaid-load.js

REM Update mermaid.min.js to use the installed version (v9)
copy /Y node_modules\mermaid\dist\mermaid.min.js %PLUGIN_DIR%\assets\mermaid.min.js

echo Fixed honkit-plugin-mermaid
