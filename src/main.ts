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
        httpOnly: true,
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

  // CORS 설정 수정 (가장 확실한 방법)
  app.enableCors({
    // true로 설정하면 요청을 보낸 Origin을 그대로 "Access-Control-Allow-Origin" 헤더에 넣어줍니다.
    origin: true, 
    credentials: true, // 쿠키 허용
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
