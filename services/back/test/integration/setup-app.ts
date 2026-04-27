import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { DomainExceptionFilter } from '../../src/controllers/filters/domain-exception.filter';
import { Clock } from '../../src/core/application/clock';

export interface BackTestApp {
  app: INestApplication;
  setNow: (iso: string) => void;
  close: () => Promise<void>;
}

export const createTestApp = async (
  initialNow = '2026-04-27T08:00:00.000Z',
): Promise<BackTestApp> => {
  let nowIso = initialNow;
  const clock: Clock = { now: () => new Date(nowIso) } as Clock;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(Clock)
    .useValue(clock)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
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
  await app.init();

  return {
    app,
    setNow: (iso: string) => {
      nowIso = iso;
    },
    close: () => app.close(),
  };
};
