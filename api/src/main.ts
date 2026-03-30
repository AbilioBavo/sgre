import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function parseCorsOrigins() {
  const source = process.env.CORS_ORIGINS ?? process.env.ORIGINS;
  if (!source) return true;
  return source.split(',').map((item) => item.trim()).filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;

  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: (process.env.CORS_CREDENTIALS ?? 'true') === 'true',
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}/api`);
}

bootstrap();
