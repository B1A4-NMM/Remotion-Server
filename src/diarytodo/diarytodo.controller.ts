import { Controller } from '@nestjs/common';
import { DiarytodoService } from './diarytodo.service';

@Controller('diarytodo')
export class DiarytodoController {
  constructor(private readonly diarytodoService: DiarytodoService) {}
}
