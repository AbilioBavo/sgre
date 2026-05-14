import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}
