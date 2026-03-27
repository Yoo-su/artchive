import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SearchKeywordController } from './controllers/search-keyword.controller';
import { SearchKeyword } from './entities/search-keyword.entity';
import { SearchKeywordService } from './services/search-keyword.service';

/**
 * 인기 검색어 모듈
 * - 도서 검색 시 검색어를 수집하여 인기 검색어를 제공
 * - 독립적인 도메인으로 분리하여 관심사 분리
 */
@Module({
  imports: [TypeOrmModule.forFeature([SearchKeyword])],
  controllers: [SearchKeywordController],
  providers: [SearchKeywordService],
  exports: [SearchKeywordService], // 다른 모듈에서 사용 가능하도록 export
})
export class SearchKeywordModule {}
