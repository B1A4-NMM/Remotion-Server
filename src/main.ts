import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // 제네릭으로 NestExpressApplication 타입을 명시하여 Express 전용 기능 사용 가능하게 함
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ 프록시 신뢰 설정 (Cloudflare Tunnel, Nginx 사용 시 필수)
  // 이걸 안 하면 https 프로토콜을 인식 못해서 secure 쿠키가 안 구워짐
  app.set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'super-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // 프로덕션에서는 true (HTTPS 필요)
        httpOnly: true,
        // Cloudflare Tunnel 사용 시 프록시 설정이 되어 있어야 secure: true가 먹힘
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Remotion API')
    .setDescription('Remotion API 문서입니다')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: true, // 요청한 Origin을 그대로 반사 (가장 확실한 방법)
    credentials: true, // 쿠키 허용
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
