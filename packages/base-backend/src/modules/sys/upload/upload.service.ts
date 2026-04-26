/**
 * @fileoverview 上传文件服务
 * @description 处理文件上传，返回可访问的 URL
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadResult {
  url: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

@Injectable()
export class UploadFileService {
  private uploadDir: string;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    this.baseUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File, businessType?: string): Promise<UploadResult> {
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${crypto.randomUUID()}${ext}`;
    
    const subDir = businessType || new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    const filePath = path.join(this.uploadDir, subDir);
    const fullPath = path.resolve(filePath, fileName);

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    fs.writeFileSync(fullPath, file.buffer);

    const url = `${this.baseUrl}/uploads/${subDir}/${fileName}`;

    return {
      url,
      originalName: file.originalname,
      fileName,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  async uploadBatch(files: Express.Multer.File[], businessType?: string): Promise<UploadResult[]> {
    return Promise.all(files.map(file => this.upload(file, businessType)));
  }
}