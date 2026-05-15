import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  PrimaryColumn,
} from 'typeorm';

@Entity('sys_permission_values')
@Unique(['name'])
@Unique(['bitPosition'])
export class PermissionValue {
  @PrimaryColumn({ name: 'bit_value', type: 'bigint' })
  bitValue: bigint;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ name: 'bit_position', type: 'int' })
  bitPosition: number;

  @Column({ type: 'tinyint', default: 1 })
  status: number;
}
