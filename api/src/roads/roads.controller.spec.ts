import { Test, TestingModule } from '@nestjs/testing';
import { RoadsController } from './roads.controller';
import { RoadsService } from './roads.service';

describe('RoadsController', () => {
  let controller: RoadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoadsController],
      providers: [RoadsService],
    }).compile();

    controller = module.get<RoadsController>(RoadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
