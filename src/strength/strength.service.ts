import { Injectable,NotFoundException,Logger  } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberService } from '../member/member.service';
import { EmotionService } from '../emotion/emotion.service';
import { DiaryService } from '../diary/diary.service';

import { Diary } from '../entities/Diary.entity'; 
import { Activity } from '../entities/Activity.entity';
import { StrengthType, strengthCategoryMap } from 'src/enums/strength-type.enum';
import { GetStrengthsResponseDto } from './dto/get-strengths-response.dto';

@Injectable()
export class StrengthService {

    private readonly logger = new Logger(StrengthService.name);

    constructor(

        private readonly memberService : MemberService,
        private readonly emotionService : EmotionService,
        private readonly diaryService : DiaryService,


        @InjectRepository(Diary) private readonly diaryRepository : Repository<Diary>,
        @InjectRepository(Activity) private readonly activityRepository : Repository<Activity>,

    ){}


    async getStrengthsSummaryByMember(memberId : string):Promise<GetStrengthsResponseDto>{
        
        //DB조회는 비동기 처리(not 병렬)
        const activities =await this.activityRepository.find({
            where: {diary: { author: { id: memberId }}},
            relations : ['diary'],
        });

        const typeCount: Record<string,number> = {};
        const detailCount: Record<string, Record<string,number>> = {};

        for(const activity of activities){
            
            /*
            -메모리 상에 있는 배열(activities) 반복
            -activity의 strength를 꺼낸다 
            */
            if (!activity.strength) continue;

            const strength = activity.strength as StrengthType;
            const type = strengthCategoryMap[strength];

            //for문 돌면서 카운트 +1 해준다. 

            //typeCount(유형별 총 개수)
            if(type){

                //1.유형별 상세 카운트 초기화 및 증가
                if(!detailCount[type]){
                    detailCount[type] = {};
                }
                detailCount[type][strength] =(detailCount[type][strength] || 0) + 1;

            }
            typeCount[type] = (typeCount[type] || 0) +1;
            
        }

       return new GetStrengthsResponseDto(typeCount,detailCount);
    }

}
