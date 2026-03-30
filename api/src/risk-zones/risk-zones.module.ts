import { Module } from '@nestjs/common';
import { RiskZonesService } from './risk-zones.service';
import { RiskZonesController } from './risk-zones.controller';

@Module({
  controllers: [RiskZonesController],
  providers: [RiskZonesService],
})
export class RiskZonesModule {}
