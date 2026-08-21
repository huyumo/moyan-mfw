/**
 * @fileoverview 借贷记账扩展包动态模块
 * @description forRoot(options) 装配 SPI（接口 + Symbol Token + 默认实现可替换），对齐 extension-scheduler 模式
 *
 * 装配点：
 *   { provide: LEDGER_STORAGE, useClass: options?.storageImpl ?? TypeOrmLedgerStorage }
 *   ...（5 个 SPI + OPTIONS）
 *
 * 实体：forFeature 注入动态 accountEntity（默认 DefaultLedgerAccount）+ transfer/entry/report
 */

import { Module, DynamicModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RouterModule } from '@nestjs/core'
import {
  LEDGER_STORAGE,
  LEDGER_LOCK,
  LEDGER_QUEUE,
  LEDGER_NOTIFIER,
  LEDGER_FIELD_EXTENSION,
  LEDGER_OPTIONS,
  type LedgerModuleOptions,
} from './spi/interfaces'
import {
  TypeOrmLedgerStorage,
  DbLock,
  InProcessQueue,
  EventNotifier,
  DefaultFieldExtension,
} from './spi/impl'
import { DefaultLedgerAccount, LedgerTransfer, LedgerEntry, LedgerReconcileReport, LedgerReversal } from './entities'
import {
  LedgerAccountService,
  LedgerTransferService,
  LedgerWithdrawService,
  PostingConsumerService,
  ScavengerService,
  LedgerReconcileService,
} from './services'
import {
  LedgerAccountController,
  LedgerTransferController,
  LedgerEntryController,
  LedgerReconcileController,
  LedgerMetaController,
  LedgerReversalController,
} from './controller'

@Module({})
export class LedgerModule {
  static forRoot(options?: LedgerModuleOptions): DynamicModule {
    const accountEntity = options?.accountEntity ?? DefaultLedgerAccount

    return {
      module: LedgerModule,
      imports: [
        TypeOrmModule.forFeature([accountEntity, LedgerTransfer, LedgerEntry, LedgerReconcileReport, LedgerReversal]),
        RouterModule.register([{ path: 'ext/ledger', module: LedgerModule }]),
      ],
      controllers: [
        LedgerAccountController,
        LedgerTransferController,
        LedgerEntryController,
        LedgerReconcileController,
        LedgerMetaController,
        LedgerReversalController,
      ],
      providers: [
        // SPI 绑定（可被 options 替换）
        { provide: LEDGER_STORAGE, useClass: options?.storageImpl ?? TypeOrmLedgerStorage },
        { provide: LEDGER_LOCK, useClass: options?.lockImpl ?? DbLock },
        { provide: LEDGER_QUEUE, useClass: options?.queueImpl ?? InProcessQueue },
        { provide: LEDGER_NOTIFIER, useClass: options?.notifierImpl ?? EventNotifier },
        { provide: LEDGER_FIELD_EXTENSION, useClass: options?.fieldExtensionImpl ?? DefaultFieldExtension },
        // 模块配置
        { provide: LEDGER_OPTIONS, useValue: options ?? {} },
        // 核心服务
        LedgerAccountService,
        LedgerTransferService,
        LedgerWithdrawService,
        PostingConsumerService,
        ScavengerService,
        LedgerReconcileService,
      ],
      exports: [
        LedgerAccountService,
        LedgerTransferService,
        LedgerWithdrawService,
        LedgerReconcileService,
        // SPI token 导出：业务层可注入任意 SPI（注册 notifier 监听器、查队列长度、直接用锁/存储/字段校验）
        LEDGER_STORAGE,
        LEDGER_LOCK,
        LEDGER_QUEUE,
        LEDGER_NOTIFIER,
        LEDGER_FIELD_EXTENSION,
        LEDGER_OPTIONS,
      ],
    }
  }
}
