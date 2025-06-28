import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ClaudeModule } from './claude/claude.module';
import { VectorModule } from './vector/vector.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import *as typeormconfig from '../typeorm.config';


@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeormconfig),
    AuthModule,
    ClaudeModule,
    VectorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
