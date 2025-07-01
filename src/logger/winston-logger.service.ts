// src/logger/winston-logger.service.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, context }) => {
          return `[${timestamp}] ${level} ${context ? '[' + context + ']' : ''}: ${message}`;
        })
      ),
    }),
    // info 로그 파일 저장
    new winston.transports.File({
      filename: 'logs/info.log',
      level: 'info',
      format: winston.format.json(),
    }),
    // error 로그 파일 저장
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
  ],
});
