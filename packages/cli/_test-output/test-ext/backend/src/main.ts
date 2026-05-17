/**
 * @fileoverview 扩展包后端独立启动入口
 */
import { NestFactory } from '@nestjs/core';
import { TestExtModule } from './test-ext.module';
import { createExtensionBackendApp } from 'moyan-mfw-base/backend';

async function bootstrap() {
  const startTime = Date.now();

  console.log('[TestExt] ====== Bootstrap Start ======');
  console.log(`[TestExt] Node.js: ${process.version}`);
  console.log(`[TestExt] ENV: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`[TestExt] PORT: ${process.env.PORT ?? '3001 (default)'}`);

  try {
    const app = await createExtensionBackendApp({
      name: 'test-ext',
      module: TestExtModule,
    });

    const port = Number(process.env.PORT) || 3001;
    await app.listen(port);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[TestExt] ✅ Server listening on http://localhost:${port} (${elapsed}s)`);
  } catch (error) {
    console.error('\n[TestExt] ❌ Bootstrap failed:');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
