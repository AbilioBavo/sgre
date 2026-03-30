import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SheltersController } from './shelters.controller';
import { SheltersService } from './shelters.service';

@Module({
  imports: [PrismaModule],
  controllers: [SheltersController],
  providers: [SheltersService],
})
export class SheltersModule {}
