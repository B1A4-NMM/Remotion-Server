import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AchievementClusterService } from './achievement-cluster.service';
import { CreateVectorDto } from '../vector/dto/create-vector.dto';
import { IsString } from 'class-validator';

class CreateVDTO {
  @IsString()
  text: string;
}

@Controller('acls')
export class AchievementClusterController {
  constructor(private readonly service: AchievementClusterService) {}

  @Post()
  create(@Body() text: CreateVDTO) {
    return this.service.createText(text.text);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.service.searchText(q);
  }

}
