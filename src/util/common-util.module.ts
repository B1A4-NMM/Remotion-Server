import { Global, Module } from '@nestjs/common';
import { CommonUtilService } from './common-util.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [CommonUtilService],
  exports: [CommonUtilService]
})
export class CommonUtilModule {
  
}