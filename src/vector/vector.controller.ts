import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { VectorService } from './vector.service';
import { CreateVectorDto } from './dto/create-vector.dto';

@Controller('vector')
export class VectorController {
  constructor(private readonly service: VectorService) {}

  @Post()
  create(@Body() dto: CreateVectorDto) {
    return this.service.create(dto);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.service.search(q);
  }
}
