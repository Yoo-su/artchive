import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Wishlist } from '@/features/user/entities/wishlist.entity';

import { WishlistController } from './controllers/wishlist.controller';
import { WishlistService } from './services/wishlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist])],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
