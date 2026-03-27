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

REM Fix mermaid-load.js for Mermaid v9
echo require(['gitbook', 'jquery'], function (gitbook, $) { > %PLUGIN_DIR%\assets\mermaid-load.js
echo     $(document).ready(function () { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         mermaid.initialize({ >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             startOnLoad: false, >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             theme: 'default', >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             securityLevel: 'loose', >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         }); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         renderMermaidCharts(); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     }); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo. >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     gitbook.events.bind('page.change', function () { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         renderMermaidCharts(); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     }); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo. >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     function renderMermaidCharts() { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         setTimeout(function() { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             $('code.lang-mermaid').each(function (i, e) { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 const code = $(e); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 const pre = code.parent('pre'); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 if (pre.find('svg').length ^> 0) return; >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 let mermaidCode = code.text(); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 const mermaidDiv = $('<div>').addClass('mermaid').text(mermaidCode); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 pre.replaceWith(mermaidDiv); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             }); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             if (mermaid ^&^& mermaid.contentLoaded) { >> %PLUGIN_DIR%\assets\mermaid-load.js
echo                 mermaid.contentLoaded(); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo             } >> %PLUGIN_DIR%\assets\mermaid-load.js
echo         }, 200); >> %PLUGIN_DIR%\assets\mermaid-load.js
echo     } >> %PLUGIN_DIR%\assets\mermaid-load.js
echo }); >> %PLUGIN_DIR%\assets\mermaid-load.js

REM Update mermaid.min.js to use the installed version (v9)
copy /Y node_modules\mermaid\dist\mermaid.min.js %PLUGIN_DIR%\assets\mermaid.min.js

echo Fixed honkit-plugin-mermaid
