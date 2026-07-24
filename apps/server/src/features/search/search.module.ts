import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SearchController } from './controllers/search.controller';
import { EmbeddingService } from './services/embedding.service';
import { RagService } from './services/rag.service';
import { SearchService } from './services/search.service';
import { VectorSearchService } from './services/vector-search.service';

@Module({
  imports: [ConfigModule],
  controllers: [SearchController],
  providers: [EmbeddingService, VectorSearchService, RagService, SearchService],
  exports: [SearchService],
})
export class SearchModule {}
