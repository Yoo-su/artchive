import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { Review } from '@/features/review/entities/review.entity';
import { ReviewReaction } from '@/features/review/entities/review-reaction.entity';
import { Tag } from '@/features/review/entities/tag.entity';

import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsedBookSale, Review, ReviewReaction, Tag]),
  ],
  controllers: [InsightsController],
  providers: [InsightsService],
})
export class InsightsModule {}
