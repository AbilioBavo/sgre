import { Test, TestingModule } from '@nestjs/testing';
import { RiskZonesService } from './risk-zones.service';

describe('RiskZonesService', () => {
  let service: RiskZonesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskZonesService],
    }).compile();

    service = module.get<RiskZonesService>(RiskZonesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
