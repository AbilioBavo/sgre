import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppService } from './app.service';
import { AppController } from './app.controller';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { AlertsModule } from './alerts/alerts.module';
import { RoutingModule } from './routing/routing.module';
import { RoadsModule } from './roads/roads.module';
import { RiskZonesModule } from './risk-zones/risk-zones.module';
import { WeatherModule } from './weather/weather.module';
import { IncidentsModule } from './incidents/incidents.module';
import { SheltersModule } from './shelters/shelters.module';
import { ProductImagesModule } from './product-images/product-images.module';
import { ProductVariantsModule } from './product-variants/product-variants.module';
import { ClubCardsModule } from './club-cards/club-cards.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { PosModule } from './pos/pos.module';
import { OrdersModule } from './orders/orders.module';
import { CartsModule } from './carts/carts.module';
import { ContactModule } from './contact/contact.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    AuthModule,
    ProductVariantsModule,
    ProductImagesModule,
    ClubCardsModule,
    NewsletterModule,
    PosModule,
    OrdersModule,
    CartsModule,
    ContactModule,
    AdminModule,
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
