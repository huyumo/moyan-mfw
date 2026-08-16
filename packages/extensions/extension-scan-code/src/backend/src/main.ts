/**
 * @fileoverview 扫码扩展包后端独立启动入口
 */
import { NestFactory } from '@nestjs/core';
import { ScanCodeModule } from './scan-code.module';
import { createExtensionBackendApp } from 'moyan-mfw-base/backend';

async function bootstrap() {
  const startTime = Date.now();

  console.log('[ScanCode] ====== Bootstrap Start ======');
  console.log(`[ScanCode] Node.js: ${process.version}`);
  console.log(`[ScanCode] ENV: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`[ScanCode] PORT: ${process.env.PORT ?? '3001 (default)'}`);

  try {
    const app = await createExtensionBackendApp({
      name: 'scan-code',
      module: ScanCodeModule,
    });

    const port = Number(process.env.PORT) || 3001;
    await app.listen(port);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[ScanCode] ✅ Server listening on http://localhost:${port} (${elapsed}s)`);
  } catch (error) {
    console.error('\n[ScanCode] ❌ Bootstrap failed:');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
