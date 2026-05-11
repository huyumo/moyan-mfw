/**
 * @fileoverview 业务异常基类
 * @description 所有业务异常的基类，继承自 HttpException，用于统一异常处理
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常基类
 * @description 用于统一业务异常的格式和状态码
 *
 * @example
 * ```typescript
 * throw new BusinessException('操作失败', HttpStatus.BAD_REQUEST);
 * throw new BusinessException('资源不存在', 40004); // 自定义错误码
 * ```
 */
export class BusinessException extends HttpException {
  /**
   * 创建业务异常实例
   * @param message - 异常消息
   * @param status - HTTP 状态码或自定义错误码，默认为 400
   */
  constructor(message: string, status: HttpStatus | number = HttpStatus.BAD_REQUEST) {
    super(
      {
        code: status,
        message,
        data: null,
        timestamp: new Date().toISOString(),
      },
      typeof status === 'number' ? status : HttpStatus.BAD_REQUEST,
    );
  }
}
