import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Tickets health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health/live (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect({ service: 'tickets-service', status: 'ok' });
  });

  it('protege la emisión interna sin API key', () => {
    return request(app.getHttpServer())
      .post('/internal/tickets/issue')
      .send({})
      .expect(401);
  });

  it('protege la descarga interna de PDF sin API key', () => {
    return request(app.getHttpServer())
      .get('/internal/tickets/30000000-0000-4000-8000-000000000001/pdf')
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
