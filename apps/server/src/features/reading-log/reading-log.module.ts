import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user/entities/user.entity';
import { ReadingLogController } from './controllers/reading-log.controller';
import { ReadingLog } from './entities/reading-log.entity';
import { ReadingLogService } from './services/reading-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReadingLog, User])],
  controllers: [ReadingLogController],
  providers: [ReadingLogService],
})
export class ReadingLogModule {}
