"use strict";
/**
 * @fileoverview 审计日志服务
 * @description 处理审计日志相关业务逻辑
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
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const common_2 = require("../../../common");
/**
 * 审计日志服务
 */
let AuditLogService = class AuditLogService {
    auditLogRepository;
    dataSource;
    constructor(auditLogRepository, dataSource) {
        this.auditLogRepository = auditLogRepository;
        this.dataSource = dataSource;
    }
    /**
     * 创建审计日志
     * @param log - 审计日志数据
     * @returns 创建的审计日志
     */
    async create(log) {
        const auditLog = this.auditLogRepository.create(log);
        return this.auditLogRepository.save(auditLog);
    }
    /**
     * 批量创建审计日志
     * @param logs - 审计日志数据列表
     * @returns 创建的审计日志列表
     */
    async batchCreate(logs) {
        return this.auditLogRepository.save(logs.map(log => this.auditLogRepository.create(log)));
    }
    /**
     * 根据 ID 查询审计日志
     * @param id - 审计日志 ID
     * @returns 审计日志信息
     */
    async findById(id) {
        const auditLog = await this.auditLogRepository.findOne({
            where: { id },
        });
        if (!auditLog) {
            throw new common_1.NotFoundException('审计日志不存在');
        }
        return auditLog;
    }
    /**
     * 查询审计日志列表（分页）
     * @param query - 查询参数
     * @returns 分页结果
     */
    async findAll(query) {
        const { module, event, operatorId, targetId, startTime, endTime } = query;
        const whereBuilder = new common_2.WhereBuilder();
        whereBuilder
            .eq('auditLog.module', module)
            .like('auditLog.event', event)
            .eq('auditLog.operatorId', operatorId)
            .eq('auditLog.targetId', targetId)
            .gte('auditLog.createAt', startTime)
            .lte('auditLog.createAt', endTime);
        const pager = new common_2.PaginationX(this.dataSource, query);
        return await pager
            .where('main', whereBuilder)
            .sql(({ select, wheres, orderBy, limit }) => {
            const whereClause = wheres?.main || '';
            return `SELECT ${select} FROM sys_audit_logs auditLog ${whereClause} ${orderBy} ${limit}`;
        })
            .select('auditLog.*')
            .defaultOrderBy('auditLog.createAt DESC')
            .getData();
    }
    /**
     * 根据目标 ID 查询审计日志列表
     * @param targetId - 目标 ID
     * @returns 审计日志列表
     */
    async findByTargetId(targetId) {
        return this.auditLogRepository.find({
            where: { targetId },
            order: {
                createAt: 'DESC',
            },
        });
    }
    /**
     * 根据操作人 ID 查询审计日志列表
     * @param operatorId - 操作人 ID
     * @returns 审计日志列表
     */
    async findByOperatorId(operatorId) {
        return this.auditLogRepository.find({
            where: { operatorId },
            order: {
                createAt: 'DESC',
            },
        });
    }
    /**
     * 删除指定时间之前的审计日志
     * @param beforeDate - 删除该日期之前的日志
     * @returns 删除的数量
     */
    async deleteBeforeDate(beforeDate) {
        const result = await this.auditLogRepository
            .createQueryBuilder('auditLog')
            .delete()
            .where('createAt < :beforeDate', { beforeDate })
            .execute();
        return result.affected || 0;
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map