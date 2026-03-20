import { Test, TestingModule } from '@nestjs/testing';
import { DigitalResourcesService } from './digital-resources.service';

describe('DigitalResourcesService', () => {
  let service: DigitalResourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DigitalResourcesService],
    }).compile();

    service = module.get<DigitalResourcesService>(DigitalResourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
