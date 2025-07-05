import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiExcludeController } from '@nestjs/swagger';
import { CommonUtilService } from './util/common-util.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly util: CommonUtilService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  getWeekDay(): string {
    return this.util.getWeekDay(new Date());
  }
}
