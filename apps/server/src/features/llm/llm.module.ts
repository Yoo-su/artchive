import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BookModule } from '../book/book.module';
import { LlmController } from './controllers/llm.controller';
import { LlmService } from './services/llm.service';
import { LlmTalkLog } from './entities/llm-talk-log.entity';

@Module({
  imports: [ConfigModule, BookModule, TypeOrmModule.forFeature([LlmTalkLog])],
  controllers: [LlmController],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
