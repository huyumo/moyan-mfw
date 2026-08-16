/**
 * @fileoverview 短信扩展包后端独立启动入口
 */
import { NestFactory } from '@nestjs/core';
import { SmsModule } from './sms.module';
import { createExtensionBackendApp } from 'moyan-mfw-base/backend';

async function bootstrap() {
  const startTime = Date.now();

  console.log('[Sms] ====== Bootstrap Start ======');
  console.log(`[Sms] Node.js: ${process.version}`);
  console.log(`[Sms] ENV: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`[Sms] PORT: ${process.env.PORT ?? '3001 (default)'}`);

  try {
    const app = await createExtensionBackendApp({
      name: 'sms',
      module: SmsModule,
    });

    const port = Number(process.env.PORT) || 3001;
    await app.listen(port);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[Sms] ✅ Server listening on http://localhost:${port} (${elapsed}s)`);
  } catch (error) {
    console.error('\n[Sms] ❌ Bootstrap failed:');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
