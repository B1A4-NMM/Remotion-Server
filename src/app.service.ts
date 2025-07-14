import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';


@Injectable()
export class AppService implements OnModuleInit {
  
  private readonly logger = new Logger(AppService.name);

  constructor(private dataSource : DataSource) {}

  async onModuleInit() {
    const dbName =this.dataSource.options.database;
    try{
      if(!this.dataSource.isInitialized){
        await this.dataSource.initialize();
        console.log(`연결된 데이터베이스: ${dbName}`);
      }else{
        console.log(`연결된 데이터베이스: ${dbName}`);
      }
    }
    catch(error){
      console.error("MySQL 연결 실패: ", error)

    }      
  }

  getHello(): string {
    return 'Remotion';
  }
}
