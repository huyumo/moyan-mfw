/**
 * @fileoverview 上传文件服务
 * @description 处理文件上传，返回可访问的 URL
 */
import { ConfigService } from '@nestjs/config';
export interface UploadResult {
    url: string;
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}
export declare class UploadFileService {
    private configService;
    private uploadDir;
    private baseUrl;
    constructor(configService: ConfigService);
    private ensureUploadDir;
    upload(file: Express.Multer.File, businessType?: string): Promise<UploadResult>;
    uploadBatch(files: Express.Multer.File[], businessType?: string): Promise<UploadResult[]>;
}
