/**
 * @fileoverview 全局异常过滤器
 * @description 统一处理所有未被捕获的异常，返回标准错误响应格式
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { NotFoundError } from '../../exceptions/not-found.exception';
import { Request, Response } from 'express';

/**
 * 获取 HTTP 状态码（确保在有效范围内）
 */
function getValidHttpStatus(status: number): number {
  // HTTP 状态码有效范围：100-599
  if (status >= 100 && status <= 599) {
    return status;
  }
  // 自定义错误码映射到标准 HTTP 状态码
  if (status >= 40000 && status < 41000) return HttpStatus.UNAUTHORIZED;
  if (status >= 42000 && status < 43000) return HttpStatus.BAD_REQUEST;
  if (status >= 43000 && status < 44000) return HttpStatus.FORBIDDEN;
  if (status >= 44000 && status < 45000) return HttpStatus.NOT_FOUND;
  return HttpStatus.BAD_REQUEST;
}

/**
 * 全局异常过滤器
 * @description 统一处理所有异常，记录日志并返回标准错误响应
 *
 * @example
 * ```typescript
 * // 在 main.ts 中全局注册
 * app.useGlobalFilters(new AllExceptionsFilter());
 * ```
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 判断异常类型
    let httpStatus: number; // HTTP 状态码（用于 response.status()）
    let code: number; // 业务错误码（用于返回给客户端）
    let message: string | bigint; // 错误消息（可能是 bigint）
    let details: any;

    if (exception instanceof HttpException) {
      // HTTP 异常（包括 BusinessException）
      const exceptionStatus = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      // 如果是验证错误 (BadRequestException)，提取 details
      if (exception instanceof BadRequestException && exceptionResponse?.message) {
        httpStatus = HttpStatus.BAD_REQUEST;
        code = 10001; // 参数验证错误码
        message = '参数验证失败';

        // 处理验证错误消息数组
        if (Array.isArray(exceptionResponse.message)) {
          details = exceptionResponse.message.map((msg: string) => {
            // 尝试验证错误格式："property must be a string" 或 "password must be a string"
            const match = msg.match(/^(\w+)\s+must\s+/i);
            if (match) {
              return { field: match[1], message: msg };
            }
            // 中文错误格式：尝试提取字段名
            const zhMatch = msg.match(/^([\u4e00-\u9fa5]+[a-zA-Z]*[0-9]*)[ 长度]/);
            if (zhMatch) {
              return { field: zhMatch[1], message: msg };
            }
            // 无法提取字段名，使用 message 作为 field
            return { field: 'password', message: msg };
          });
        } else {
          details = [exceptionResponse.message];
        }
      } else if (exception instanceof ConflictException) {
        // 冲突错误（如用户名已存在、应用编码已存在）
        httpStatus = HttpStatus.CONFLICT;
        code = 10002; // 资源冲突错误码
        message = exceptionResponse.message || '资源冲突';
      } else if (exception instanceof NotFoundError) {
        // 资源未找到错误（自定义 NotFoundError）
        httpStatus = HttpStatus.NOT_FOUND;
        code = 10004; // 资源未找到错误码
        message = exceptionResponse.message || '资源不存在';
      } else if (exception instanceof NotFoundException) {
        // 未找到资源
        httpStatus = HttpStatus.NOT_FOUND;
        code = 10004; // 资源未找到错误码
        message = exceptionResponse.message || '资源不存在';
      } else if (exception instanceof ForbiddenException) {
        // 禁止访问
        httpStatus = HttpStatus.FORBIDDEN;
        code = 10003; // 禁止访问错误码
        message = exceptionResponse.message || '无权限访问';
      } else if (exception instanceof UnauthorizedException) {
        // 未授权
        httpStatus = HttpStatus.UNAUTHORIZED;
        code = 401; // 未授权错误码（与 HTTP 状态码一致）
        message = exceptionResponse.message || '未授权访问';
      } else {
        // 其他 HTTP 异常（包括 BusinessException）
        httpStatus = getValidHttpStatus(exceptionStatus);
        code = exceptionResponse.code || exceptionStatus;
        message = exceptionResponse.message || exception.message;
        details = exceptionResponse.details;
      }
    } else if (exception instanceof Error) {
      // 普通错误
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 50000;
      message = exception.message;
    } else {
      // 未知错误
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 50000;
      message = '服务器内部错误';
    }

    // 记录错误日志
    if (httpStatus >= 500) {
      // 服务器错误，记录完整堆栈
      this.logger.error(
        `[${request.method}] ${request.url} - ${httpStatus}: ${message}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      // 客户端错误，记录简要信息
      this.logger.warn(
        `[${request.method}] ${request.url} - ${httpStatus}: ${message}`,
      );
    }

    // 处理异常中的 bigint 值（避免 JSON 序列化错误）
    let safeMessage = message;
    let safeDetails = details;
    if (typeof message === 'bigint') {
      safeMessage = message.toString();
    }
    if (safeDetails && typeof safeDetails === 'object') {
      try {
        safeDetails = JSON.parse(JSON.stringify(safeDetails, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        ));
      } catch {
        safeDetails = null;
      }
    }

    // 返回统一错误响应格式
    const errorResponse: any = {
      code,
      message: safeMessage,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 如果有 details，添加到响应中
    if (safeDetails) {
      errorResponse.details = safeDetails;
    }

    response.status(httpStatus).json(errorResponse);
  }
}
