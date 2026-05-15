"use strict";
/**
 * @fileoverview 应用入口文件
 * @description NestJS 应用启动入口（兼容模式）
 */
Object.defineProperty(exports, "__esModule", { value: true });
const create_base_backend_app_1 = require("./create-base-backend-app");
async function bootstrap() {
    const app = await (0, create_base_backend_app_1.createBaseBackendApp)();
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map