import { Injectable } from '@nestjs/common';
import { ClaudeService } from '../claude/claude.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Diary } from 'src/entities/Diary.entity';
import { AnalysisSer}

@Injectable()
export class DiaryService {
    //Claude서비스 호출가능하게 
    constructor(
        private readonly claudeService : ClaudeService,
        private readonly analysisService : AnalysisService,
    ){}
    
    //실제 처리 로직
    async createDiary(dto : CreateDiaryDto){

        const{ text } = dto;

        //1.요약 + 감정 추출 (인물/장소별 감정)
        const summaryRaw = await this.claudeService.querySummary(text);

        //2.Claude에 전체 분석 요청 
        const patternResult = await this.claudeService.queryDiaryPatterns(text);
        
        //3.분석 결과 저장 및 응답 생성
        return await this.analysisService.processaAndSave({
            text,
            summaryRaw,
            pattern: patternResult,
        })
        



    }

}