import { Test, TestingModule } from '@nestjs/testing';
import { RiskZonesController } from './risk-zones.controller';
import { RiskZonesService } from './risk-zones.service';

describe('RiskZonesController', () => {
  let controller: RiskZonesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskZonesController],
      providers: [RiskZonesService],
    }).compile();

    controller = module.get<RiskZonesController>(RiskZonesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
