import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { ArtController } from './controllers/art.controller';
import { ArtService } from './services/art.service';

@Module({
  imports: [HttpModule],
  controllers: [ArtController],
  providers: [ArtService],
  exports: [ArtService],
})
export class ArtModule {}
