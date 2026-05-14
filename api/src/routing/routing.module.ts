import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { OsrmClient } from './osrm.client';
import { RoutingController } from './routing.controller';
import { RoutingService } from './routing.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [RoutingController],
  providers: [RoutingService, OsrmClient],
  exports: [RoutingService],
})
export class RoutingModule {}
