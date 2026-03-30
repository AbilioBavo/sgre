import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origins = process.env.ORIGINS ? process.env.ORIGINS.split(',') : [];
  const port = process.env.PORT ?? 3000;
  app.enableCors({
  origin: origins,
  credentials: true,
});

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());


  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}/api`);
  console.log(`📚 API Documentation available at http://localhost:${port}/api/docs`);
  // console.log(`Url: ${process.env.DATABASE_URL}`);
}

bootstrap();
