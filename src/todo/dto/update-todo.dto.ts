import { IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateTodoDto{

    @IsOptional()
    @IsDateString()
    date?: string;

    @IsOptional()
    @IsBoolean()
    isRepeat?:boolean;

    
}