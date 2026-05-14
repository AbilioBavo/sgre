import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RiskZonesController } from './risk-zones.controller';
import { RiskZonesService } from './risk-zones.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RiskZonesController],
  providers: [RiskZonesService],
})
export class RiskZonesModule {}
