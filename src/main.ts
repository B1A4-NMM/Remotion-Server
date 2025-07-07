import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { winstonLogger } from './logger/winston-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // app.useGlobalInterceptors(
  //   new ClassSerializerInterceptor(app.get(Reflector), {
  //     excludeExtraneousValues: true, // 핵심 설정
  //   }),
  // );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Remotion API')
    .setDescription('Remotion API 문서입니다')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
