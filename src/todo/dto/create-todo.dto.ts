import { IsArray,IsString,IsBoolean, IsOptional }from 'class-validator'

export class CreateTodoDto {

    //userId는 @CurrentUser() 같은 방식으로 controller 에서 처리해주기

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    date : string;

    @IsOptional()
    @IsBoolean()
    isRepeat?: boolean;

    @IsOptional()
    @IsString()
    repeatRule?: string;

    @IsOptional()
    @IsString()
    repeatEndDate?: string;


    
}