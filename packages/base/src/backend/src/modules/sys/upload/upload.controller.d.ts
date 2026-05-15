/**
 * @fileoverview 上传文件控制器
 * @description 处理文件上传 HTTP 请求
 */
import { UploadFileService, UploadResult } from './upload.service';
export declare class UploadFileController {
    private uploadFileService;
    constructor(uploadFileService: UploadFileService);
    uploadFile(file: Express.Multer.File, businessType?: string): Promise<import("../../../common/types/api.types").ApiResponse<UploadResult>>;
    uploadFiles(files: Express.Multer.File[], businessType?: string): Promise<import("../../../common/types/api.types").ApiResponse<UploadResult[]>>;
}
