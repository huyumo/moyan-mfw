# 读取测试清单文件
$filePath = "e:\Moyan\moyan\moyan-mfw-workspace\workspace04\moyan-mfw\docs\04-项目实施\06-测试用例\2026-04-01-0045-API-集成测试 - 清单.md"
$content = Get-Content $filePath -Raw -Encoding UTF8
Write-Host $content
