import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { winstonLogger } from './logger/winston-logger.service';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // CORS 설정 보강 (쿠키 전송을 위해 필수)
  app.enableCors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'], // 프론트엔드 주소 허용
    credentials: true, // 쿠키 허용
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
