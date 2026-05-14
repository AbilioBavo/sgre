import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppService } from './app.service';
import { AppController } from './app.controller';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SheltersModule } from './shelters/shelters.module';
import { IncidentsModule } from './incidents/incidents.module';
import { WeatherModule } from './weather/weather.module';
import { RiskZonesModule } from './risk-zones/risk-zones.module';
import { RoadsModule } from './roads/roads.module';
import { RoutingModule } from './routing/routing.module';
import { AlertsModule } from './alerts/alerts.module';
import { EventsModule } from './events/events.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RealtimeModule,
    UsersModule,
    SheltersModule,
    IncidentsModule,
    WeatherModule,
    RiskZonesModule,
    RoadsModule,
    RoutingModule,
    AlertsModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
