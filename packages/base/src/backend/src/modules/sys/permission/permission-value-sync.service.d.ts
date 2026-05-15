import { Repository, DataSource } from 'typeorm';
import { PermissionValue } from './entities/permission-value.entity';
export declare class PermissionValueSyncService {
    private repo;
    private readonly logger;
    constructor(repo: Repository<PermissionValue>);
    sync(dataSource: DataSource): Promise<void>;
}
