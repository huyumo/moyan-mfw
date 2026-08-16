/**
 * @fileoverview 扫码扩展包后端入口
 * @description 导出 ScanCodeModule、纯 TS 层、配置管理层、服务层与 DTO
 */

export { ScanCodeModule, ScanCodeModule as default } from './scan-code.module';

// 纯 TS 层（核心校验逻辑，可脱离 NestJS 复用）
export { ScanCodeManager, DEFAULT_CODE_FORMAT, MAX_CODE_LENGTH } from './scan-code-manager';
export {
  ScanCodeType,
  ScanCodeStatus,
  type GenerateOptions,
  type GenerateResult,
  type ParseResult,
  type CodeFormatOptions,
} from './types';

// 实体
export { ScanCodeRecord, ScanCodeData, ScanCodeSetting } from './entities';

// 配置管理层（配置页面用）
export { ScanCodeConfigService } from './config/scan-code-config.service';
export { ScanCodeConfigController } from './config/controller/scan-code-config.controller';
export { SaveScanCodeSettingDto } from './config/dto';

// 服务层（业务方注入调用）
export { ScanCodeService } from './services/scan-code.service';

// 业务方复用 DTO
export {
  GenerateScanCodeDto,
  ParseScanCodeDto,
  UseScanCodeDto,
  GenerateScanCodeResDto,
  ParseScanCodeResDto,
} from './dto';

// 权限与常量（shared 透出）
export { SCAN_CODE_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-scan-code/shared';
