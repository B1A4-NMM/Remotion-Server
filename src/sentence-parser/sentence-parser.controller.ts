import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post, Query,
  UseGuards,
} from '@nestjs/common';
import { SentenceParserService } from './sentence-parser.service';
import { IsString } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { ApiExcludeController } from '@nestjs/swagger';

class ParsingDTO {
  @IsString()
  text: string;
}

@Controller('parser')
@ApiExcludeController()
export class SentenceParserController {
  constructor(private readonly sentenceParserService: SentenceParserService) {}

  @Post()
  async parseSentence(@Body() dto: ParsingDTO) {
    return this.sentenceParserService.parsingText(dto.text);
  }

  @Delete()
  async deleteAll() {
    return this.sentenceParserService.deleteAllVector();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async searchSentence(@Query('q') q: string, @CurrentUser() user: any) {
    const userID = user.id;
    console.log("q : " + q);
    return this.sentenceParserService.searchSentenceByMember(q, userID);
  }
}
