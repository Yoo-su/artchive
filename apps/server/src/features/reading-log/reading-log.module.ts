import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingLog } from './entities/reading-log.entity';
import { ReadingLogService } from './services/reading-log.service';
import { ReadingLogController } from './controllers/reading-log.controller';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReadingLog, User])],
  controllers: [ReadingLogController],
  providers: [ReadingLogService],
})
export class ReadingLogModule {}
