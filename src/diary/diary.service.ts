import { Injectable } from '@nestjs/common';
import { AnalysisDiaryService } from '../analysis/analysis-diary.service';

@Injectable()
export class DiaryService {

  constructor(private readonly analysisDiaryService: AnalysisDiaryService) {
  }

  async createDiary(content: string) {
    return this.analysisDiaryService.analysisDiary(content)
  }

}