import { IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateTodoDto{

    // ?.붙여서 선택적 필드로 만들면 , date만 보낼수도 isRepeat만 보낼수도 

    @IsOptional()
    @IsDateString()
    date?: string;

    @IsOptional()
    @IsBoolean()
    isRepeat?:boolean;


}