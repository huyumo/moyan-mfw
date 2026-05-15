"use strict";
/**
 * @fileoverview 通用资源类型定义
 * @description 定义图片、媒体、文件三种资源格式，供业务模块使用
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceType = exports.FileResourceDto = exports.MediaResourceDto = exports.ImageResourceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * 图片资源 DTO
 * @description 用于存储图片类型资源，包含尺寸信息
 */
class ImageResourceDto {
    src;
    width;
    height;
}
exports.ImageResourceDto = ImageResourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图片 URL', example: 'http://localhost:3000/uploads/avatar/uuid.jpg' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImageResourceDto.prototype, "src", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图片宽度（像素）', example: 800 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ImageResourceDto.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图片高度（像素）', example: 600 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ImageResourceDto.prototype, "height", void 0);
/**
 * 媒体资源 DTO
 * @description 用于存储视频、音频等媒体资源
 */
class MediaResourceDto {
    url;
    name;
    type;
    size;
    duration;
}
exports.MediaResourceDto = MediaResourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '媒体 URL', example: 'http://localhost:3000/uploads/video/uuid.mp4' }),
    __metadata("design:type", String)
], MediaResourceDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '原始文件名', example: '宣传片.mp4' }),
    __metadata("design:type", String)
], MediaResourceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'MIME 类型', example: 'video/mp4' }),
    __metadata("design:type", String)
], MediaResourceDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '文件大小（字节）', example: 10240000, required: false }),
    __metadata("design:type", Number)
], MediaResourceDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '时长（秒）', example: 120, required: false }),
    __metadata("design:type", Number)
], MediaResourceDto.prototype, "duration", void 0);
/**
 * 文件资源 DTO
 * @description 用于存储普通文件资源
 */
class FileResourceDto {
    url;
    name;
    type;
    size;
}
exports.FileResourceDto = FileResourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '文件 URL', example: 'http://localhost:3000/uploads/doc/uuid.pdf' }),
    __metadata("design:type", String)
], FileResourceDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '原始文件名', example: '合同.pdf' }),
    __metadata("design:type", String)
], FileResourceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'MIME 类型', example: 'application/pdf' }),
    __metadata("design:type", String)
], FileResourceDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '文件大小（字节）', example: 102400, required: false }),
    __metadata("design:type", Number)
], FileResourceDto.prototype, "size", void 0);
/**
 * 资源类型枚举
 */
var ResourceType;
(function (ResourceType) {
    ResourceType["IMAGE"] = "image";
    ResourceType["MEDIA"] = "media";
    ResourceType["FILE"] = "file";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
//# sourceMappingURL=resource.types.js.map