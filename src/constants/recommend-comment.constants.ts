const RECOMMEND_COMMENT_REPOSITORY = [
  '긍정적인 요일이네요. 오늘도 좋은 하루가 되었으면 좋겠습니다.',
  '이번 요일은 항상 기분이 좋으시네요. 항상 지금같길 바래요',
  '나쁘지 않은 요일이에요. 오늘도 일기 한번 써보시는건 어때요?'
];

export function getRandomComment(): string {
  const index = Math.floor(Math.random() * RECOMMEND_COMMENT_REPOSITORY.length);
  return RECOMMEND_COMMENT_REPOSITORY[index];
}