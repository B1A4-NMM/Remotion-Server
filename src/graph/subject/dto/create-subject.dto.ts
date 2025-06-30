import { SubjectType } from '../../../enums/subject-type.enum';
import { RelationType } from '../../../enums/relation-type.enum';
import { IsEnum, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  memberId: string;
  @IsString()
  name: string;
  @IsEnum(SubjectType)
  type: SubjectType;
  @IsEnum(RelationType)
  relation: RelationType;
}
