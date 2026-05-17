import 'dotenv/config';
import { createBaseBackendApp, SwaggerGroupConfig } from 'moyan-mfw-base/backend';
import { appTypesConfig } from './app-types.config';
import { AppModule } from './app.modules';

const swaggerGroups: SwaggerGroupConfig[] = [];

async function bootstrap() {
  const startTime = Date.now();
  console.log('[TestShop] ====== Bootstrap Start ======');

  try {
    const app = await createBaseBackendApp({
      name: 'TestShop',
      appTypes: appTypesConfig,
      syncAppTypes: true,
      modules: [AppModule],
      swagger: swaggerGroups,
      permissionValues: [],
      hooks: {
        onAppInit: async (ctx) => {
          console.log('[TestShop] 应用初始化完成');
        },
      },
    });

    const port = Number(process.env.PORT) || 3000;
    await app.listen(port);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[TestShop] ✅ Server listening on http://localhost:${port} (${elapsed}s)`);
    console.log(`[TestShop] 📖 Swagger: http://localhost:${port}/api-docs/sys`);
  } catch (error) {
    console.error('\n[TestShop] ❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
