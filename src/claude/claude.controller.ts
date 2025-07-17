import { Controller, Post, Body } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('claude')
@ApiExcludeController()
export class ClaudeController {
  constructor(private readonly claudeService: ClaudeService) {}

  @Post()
  async askClaude(@Body('prompt') prompt: string) {
    const response = await this.claudeService.queryClaude(prompt);
    return { response };
  }

  @Post('summary')
  async askSummary(@Body('prompt') prompt: string) {
    const response = await this.claudeService.querySummary(prompt);
    return { response };
  }

  @Post('detail')
  async askDetail(@Body('prompt') prompt: string) {
    try {
      const response = await this.claudeService.queryDiaryPatterns(prompt);
      return { response };
    } catch (error) {
      throw new Error(`Detail analysis failed: ${error.message}`);
    }
  }

  @Post('serial')
  async askSerial(@Body('prompt') prompt: string) {
    try {
      const response = await this.claudeService.serializeAnalysis(prompt);
      return { response };
    } catch (error) {
      throw new Error(`Detail analysis failed: ${error.message}`);
    }
  }

  @Post('routine')
  async askRoutine(@Body('prompt') prompt: string) {
    try {
      const response = await this.claudeService.serializeRoutine(prompt);
      return { response };
    } catch (error) {
      throw new Error(`Routine analysis failed: ${error.message}`);
    }
  }

  @Post('tag')
  async getTagging(@Body('prompt') prompt: string) {
    try {
      const response = await this.claudeService.getTaggingDiary(prompt);
      return { response };
    } catch (error) {
      throw new Error(`Routine analysis failed: ${error.message}`);
    }
  }

}
