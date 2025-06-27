import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [CommonUtilModule],
  exports: [CommonUtilModule]
})
export class CommonUtilModule {
  
}