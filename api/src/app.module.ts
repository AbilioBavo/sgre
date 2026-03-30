import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { AlertsModule } from './alerts/alerts.module';
import { RoutingModule } from './routing/routing.module';
import { RoadsModule } from './roads/roads.module';
import { RiskZonesModule } from './risk-zones/risk-zones.module';
import { WeatherModule } from './weather/weather.module';
import { IncidentsModule } from './incidents/incidents.module';
import { SheltersModule } from './shelters/shelters.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
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
