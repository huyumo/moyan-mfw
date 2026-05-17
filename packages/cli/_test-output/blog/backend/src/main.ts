/**
 * @fileoverview 扩展包后端独立启动入口
 */
import { NestFactory } from '@nestjs/core';
import { BlogModule } from './blog.module';
import { createExtensionBackendApp } from 'moyan-mfw-base/backend';

async function bootstrap() {
  const startTime = Date.now();

  console.log('[Blog] ====== Bootstrap Start ======');
  console.log(`[Blog] Node.js: ${process.version}`);
  console.log(`[Blog] ENV: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`[Blog] PORT: ${process.env.PORT ?? '3001 (default)'}`);

  try {
    const app = await createExtensionBackendApp({
      name: 'blog',
      module: BlogModule,
    });

    const port = Number(process.env.PORT) || 3001;
    await app.listen(port);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[Blog] ✅ Server listening on http://localhost:${port} (${elapsed}s)`);
  } catch (error) {
    console.error('\n[Blog] ❌ Bootstrap failed:');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
