import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SheltersController } from './shelters.controller';
import { SheltersService } from './shelters.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SheltersController],
  providers: [SheltersService],
  exports: [SheltersService],
})
export class SheltersModule {}
