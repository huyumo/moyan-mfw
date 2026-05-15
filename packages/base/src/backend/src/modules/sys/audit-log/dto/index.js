"use strict";
/**
 * @fileoverview 审计日志 DTO 统一导出
 * @description 导出审计日志模块的所有 DTO
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogResponseDto = exports.QueryAuditLogDto = void 0;
// Request DTOs
var query_audit_log_dto_1 = require("./req/query-audit-log.dto");
Object.defineProperty(exports, "QueryAuditLogDto", { enumerable: true, get: function () { return query_audit_log_dto_1.QueryAuditLogDto; } });
// Response DTOs
var audit_log_response_dto_1 = require("./res/audit-log-response.dto");
Object.defineProperty(exports, "AuditLogResponseDto", { enumerable: true, get: function () { return audit_log_response_dto_1.AuditLogResponseDto; } });
//# sourceMappingURL=index.js.map