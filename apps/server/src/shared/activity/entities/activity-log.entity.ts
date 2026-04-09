import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { ActivityType } from '../activity-type.enum';

@Entity({ name: 'activity_logs' })
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: number;

  @Column({ type: 'varchar' })
  activityType: ActivityType;

  @Column()
  method: string;

  @Column()
  path: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
