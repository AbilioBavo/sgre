import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RoadsController } from './roads.controller';
import { RoadsService } from './roads.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RoadsController],
  providers: [RoadsService],
})
export class RoadsModule {}
