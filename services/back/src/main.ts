import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './controllers/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const message = errors
          .map((e) => Object.values(e.constraints ?? {}).join('; '))
          .filter(Boolean)
          .join('; ') || 'Validation failed';
        return new BadRequestException({
          error: { code: 'VALIDATION_ERROR', message },
        });
      },
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.listen(3000);
}

bootstrap();
