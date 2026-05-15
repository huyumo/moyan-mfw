"use strict";
/**
 * @fileoverview 上传文件控制器
 * @description 处理文件上传 HTTP 请求
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadFileController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const upload_service_1 = require("./upload.service");
const auth_guard_1 = require("../../../common/guards/auth.guard");
const audit_log_decorator_1 = require("../../../common/decorators/audit-log.decorator");
const skip_permission_decorator_1 = require("../../../common/decorators/skip-permission.decorator");
const api_types_1 = require("../../../common/types/api.types");
let UploadFileController = class UploadFileController {
    uploadFileService;
    constructor(uploadFileService) {
        this.uploadFileService = uploadFileService;
    }
    async uploadFile(file, businessType) {
        const result = await this.uploadFileService.upload(file, businessType);
        return api_types_1.ApiResponseUtil.success(result, '上传成功');
    }
    async uploadFiles(files, businessType) {
        const results = await this.uploadFileService.uploadBatch(files, businessType);
        return api_types_1.ApiResponseUtil.success(results, '批量上传成功');
    }
};
exports.UploadFileController = UploadFileController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '上传单个文件', description: '上传单个文件，返回可访问的 URL' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiResponse)({ status: 201, description: '上传成功' }),
    (0, audit_log_decorator_1.AuditLog)({ module: 'UPLOAD', event: 'UPLOAD_FILE', description: '上传文件' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Query)('businessType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadFileController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '批量上传文件', description: '批量上传多个文件（最多10个）' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiResponse)({ status: 201, description: '上传成功' }),
    (0, audit_log_decorator_1.AuditLog)({ module: 'UPLOAD', event: 'BATCH_UPLOAD_FILE', description: '批量上传文件' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Query)('businessType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], UploadFileController.prototype, "uploadFiles", null);
exports.UploadFileController = UploadFileController = __decorate([
    (0, swagger_1.ApiTags)('upload', '文件上传相关接口'),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, skip_permission_decorator_1.SkipPermission)(),
    (0, common_1.Controller)('upload-files'),
    __metadata("design:paramtypes", [upload_service_1.UploadFileService])
], UploadFileController);
//# sourceMappingURL=upload.controller.js.map