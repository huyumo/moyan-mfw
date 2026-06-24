/**
 * @fileoverview 文档管理后端入口
 */

export * from './document.module';
export * from './service/document.service';
export * from './service/document-ext.service';
export * from './dto';
export * from './entities/document.entity';
export * from './entities/document-ext.entity';

// 导出权限定义，供业务层收集
export { DOCUMENT_PERMISSION_VALUES } from 'moyan-mfw-extension-document/shared';
