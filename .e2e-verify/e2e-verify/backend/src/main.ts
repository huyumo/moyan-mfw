import 'dotenv/config';
import { createBaseBackendApp, SwaggerGroupConfig } from 'moyan-mfw-base/backend';
import { appTypesConfig } from './app-types.config';
import { AppModule } from './app.modules';
import { AdModule, AD_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ad/backend';

const swaggerGroups: SwaggerGroupConfig[] = [
  {
    name: 'ad-extension',
    title: '广告管理API文档',
    description: '广告位类型、广告位、广告内容管理 API',
    include: [AdModule],
  },
];

async function bootstrap() {
  const startTime = Date.now();
  console.log('[E2eVerify] ====== Bootstrap Start ======');

  try {
    const app = await createBaseBackendApp({
      name: 'E2eVerify',
      appTypes: appTypesConfig,
      syncAppTypes: true,
      modules: [AppModule],
      swagger: swaggerGroups,
      permissionValues: [...AD_EXTENSION_PERMISSION_VALUES],
      hooks: {
        onAppInit: async (ctx) => {
          console.log('[E2eVerify] 应用初始化完成');
        },
      },
    });

    const port = Number(process.env.PORT) || 3000;
    await app.listen(port);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[E2eVerify] ✅ Server listening on http://localhost:${port} (${elapsed}s)`);
    console.log(`[E2eVerify] 📖 Swagger: http://localhost:${port}/api-docs/sys`);
  } catch (error) {
    console.error('\n[E2eVerify] ❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
