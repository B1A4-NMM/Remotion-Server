import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AchievementClusterService } from './achievement-cluster.service';
import { CreateVectorDto } from '../vector/dto/create-vector.dto';
import { IsString } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { QdrantService } from '../vector/qdrant.service';
import { CurrentUser } from '../auth/user.decorator';
import { ApiExcludeController } from '@nestjs/swagger';

class CreateVDTO {
  @IsString()
  text: string;
}

@Controller('acls')
@ApiExcludeController()
export class AchievementClusterController {
  constructor(
    private readonly service: AchievementClusterService,
    private readonly qdrantService: QdrantService,
  ) {}

  @Post()
  create(@Body() text: CreateVDTO) {
    return this.service.createText(text.text);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.service.searchText(q);
  }

  @Delete()
  deleteAll() {
    return this.service.deleteAllVector();
  }

  @Get('search/top')
  searchTop(@Query('q') q: string) {
    return this.service.searchTopVector(q);
  }

  @Get('cluster')
  @UseGuards(AuthGuard('jwt'))
  searchCluster(@Query('q') q: string, @CurrentUser() user: any) {
    return this.service.searchTextByMember(q, user.id);
  }

}
