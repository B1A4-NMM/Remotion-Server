export class SentenceDto {
  id: number;
  text: string;
}

export class MakeClusterDto {
  sentences: SentenceDto[] = [];
}
