"use strict";
/**
 * @fileoverview 上传文件模块
 * @description 提供文件上传功能，不涉及数据库存储
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadFileModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const upload_service_1 = require("./upload.service");
const upload_controller_1 = require("./upload.controller");
let UploadFileModule = class UploadFileModule {
};
exports.UploadFileModule = UploadFileModule;
exports.UploadFileModule = UploadFileModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.memoryStorage)(),
                limits: {
                    fileSize: 10 * 1024 * 1024,
                },
            }),
        ],
        providers: [upload_service_1.UploadFileService],
        controllers: [upload_controller_1.UploadFileController],
        exports: [upload_service_1.UploadFileService],
    })
], UploadFileModule);
//# sourceMappingURL=upload.module.js.map