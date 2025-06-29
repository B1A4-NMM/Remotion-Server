import { Injectable } from '@nestjs/common';
import { AnalysisDiaryService } from '../analysis/analysis-diary.service';
import { MemberService } from '../member/member.service';
import { Diary } from '../entities/Diary.entity';
import { CreateDiaryDto } from './dto/create-diary.dto';

@Injectable()
export class DiaryService {

  constructor(
    private readonly analysisDiaryService: AnalysisDiaryService,
    private readonly memberService: MemberService,
  ) {
  }

  async createDiary(id:string ,dto: CreateDiaryDto) {
    this.analysisDiaryService.analysisDiary(dto.content)

    const member = await this.memberService.findOne(id)
    const diary = new Diary()
    diary.author = member
    diary.written_date = dto.writtenDate
    diary.



  }

}