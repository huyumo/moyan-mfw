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

echo Fixed honkit-plugin-mermaid
