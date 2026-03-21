import { Test, TestingModule } from '@nestjs/testing';
import { DigitalResourcesController } from './digital-resources.controller';

describe('DigitalResourcesController', () => {
  let controller: DigitalResourcesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DigitalResourcesController],
    }).compile();

    controller = module.get<DigitalResourcesController>(DigitalResourcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
