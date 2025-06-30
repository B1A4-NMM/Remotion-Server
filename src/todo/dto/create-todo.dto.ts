import { IsArray,IsString,IsNumber }from 'class-validator'

export class CreateTodoDto {

    //userId는 @CurrentUser() 같은 방식으로 controller 에서 처리해주기

    @IsArray()
    @IsString( { each : true })
    todo: string[] //클라이언트가 보내주는 형식과 same하게 맞춰주기
}