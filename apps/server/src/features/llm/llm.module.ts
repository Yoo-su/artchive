import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookModule } from '../book/book.module';
import { LlmController } from './controllers/llm.controller';
import { AiBookSummary } from './entities/ai-book-summary.entity';
import { LlmTalkLog } from './entities/llm-talk-log.entity';
import { LlmService } from './services/llm.service';

@Module({
  imports: [
    ConfigModule,
    BookModule,
    TypeOrmModule.forFeature([LlmTalkLog, AiBookSummary]),
  ],
  controllers: [LlmController],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
