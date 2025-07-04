import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { AnalysisDiaryService } from '../analysis/analysis-diary.service';
import { MemberService } from '../member/member.service';
import { ActivityService } from '../activity/activity.service';
import { TargetService } from '../target/target.service';
import { CommonUtilService } from '../util/common-util.service';
import { EmotionService } from '../emotion/emotion.service';
import { TodoService } from '../todo/todo.service';

import { Diary } from '../entities/Diary.entity';
import { DiaryTodo } from '../entities/diary-todo.entity';
import { Member } from '../entities/Member.entity';

import {
  ActivityAnalysisDto,
  DiaryAnalysisDto,
  EmotionAnalysisDto,
  PeopleAnalysisDto,
  TodoAnalysisDto,
} from '../analysis/dto/diary-analysis.dto';
import { LocalDate } from 'js-joda';

@Injectable()
export class DiarytodoService {
    constructor(
        @InjectRepository(DiaryTodo)
        private readonly diaryTodoRepository: Repository<DiaryTodo>,   
    ) {}
    async createByDiary(result: DiaryAnalysisDto, diary: Diary, member: Member){

        if (result.todos.length === 0) return;

        const diaryTodos = result.todos.map(todoResDto =>{
            const dt = new DiaryTodo();
            dt.content =todoResDto.Todocontent;

            //어떤 회원의 일기에 의해 생성된 todo인지 저장해야함
            dt.createdAt = LocalDate.now()
            dt.diary = diary;
            dt.member =member;
            return dt;
    
          });

          await this.diaryTodoRepository.save(diaryTodos);

    }
}
