"use strict";
/**
 * @fileoverview Swagger 多文档分组配置工具
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwaggerGroups = setupSwaggerGroups;
const swagger_1 = require("@nestjs/swagger");
const auth_module_1 = require("../modules/sys/auth/auth.module");
const user_module_1 = require("../modules/sys/user/user.module");
const role_module_1 = require("../modules/sys/role/role.module");
const permission_module_1 = require("../modules/sys/permission/permission.module");
const app_type_module_1 = require("../modules/sys/app-type/app-type.module");
const app_module_1 = require("../modules/sys/app/app.module");
const audit_log_module_1 = require("../modules/sys/audit-log/audit-log.module");
const install_module_1 = require("../modules/sys/install/install.module");
const upload_module_1 = require("../modules/sys/upload/upload.module");
const SYS_SWAGGER_MODULES = [
    auth_module_1.AuthModule,
    user_module_1.UserModule,
    role_module_1.RoleModule,
    permission_module_1.PermissionModule,
    app_type_module_1.AppTypeModule,
    app_module_1.AppModule,
    audit_log_module_1.AuditLogModule,
    install_module_1.InstallModule,
    upload_module_1.UploadFileModule,
];
const SYS_SWAGGER_CONFIG = {
    name: 'sys',
    title: '核心API文档',
    description: 'moyan-base backend built-in module API',
    include: SYS_SWAGGER_MODULES,
};
/**
 * 设置 Swagger 多文档分组
 */
function setupSwaggerGroups(app, groups = [], appName = 'Moyan MFW Backend', appVersion = '1.0.0') {
    setupSwaggerDocument(app, SYS_SWAGGER_CONFIG, appName, appVersion);
    for (const group of groups) {
        setupSwaggerDocument(app, group, appName, appVersion);
    }
}
/**
 * 设置单个 Swagger 文档
 */
function setupSwaggerDocument(app, config, appName, appVersion) {
    const builder = new swagger_1.DocumentBuilder()
        .setTitle(config.title)
        .setDescription(config.description || `${appName} - ${config.title}`)
        .setVersion(appVersion)
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '请输入 JWT Token',
    }, 'Authorization');
    const documentConfig = builder.build();
    const document = swagger_1.SwaggerModule.createDocument(app, documentConfig, {
        include: config.include,
        operationIdFactory: (controllerKey, methodKey) => {
            const controllerName = controllerKey.replace(/Controller$/, '');
            const methodName = methodKey.charAt(0).toUpperCase() + methodKey.slice(1);
            return `${controllerName}${methodName}`;
        },
    });
    swagger_1.SwaggerModule.setup(`api-docs/${config.name}`, app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    console.log(`[Swagger] Document "${config.name}" available at /api-docs/${config.name}`);
}
//# sourceMappingURL=swagger-setup.js.map