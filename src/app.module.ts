import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ClaudeModule } from './claude/claude.module';
import { VectorModule } from './vector/vector.module';
import { GraphModule } from './graph/graph.module';
import { CommonUtilModule } from './util/common-util.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    ClaudeModule,
    VectorModule,
    GraphModule,
    CommonUtilModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
