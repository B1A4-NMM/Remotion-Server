export const DiaryResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 102 },
    writtenDate: { type: 'string', example: '2025-07-14' },
    photoPath: {
      type: 'array',
      items: { type: 'string' },
      example: [],
    },
    audiosPath: {
      type: 'string',
      nullable: true,
      example: null,
    },
    content: {
      type: 'string',
      example: '일기를 매일 쓰는거는 쉬운 일이 아니다...',
    },
    latitude: {
      type: 'number',
      nullable: true,
      example: null,
    },
    longitude: {
      type: 'number',
      nullable: true,
      example: null,
    },
    analysis: {
      type: 'object',
      properties: {
        activity_analysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string', example: '농구하기' },
              peoples: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: '도영' },
                    interactions: {
                      type: 'object',
                      properties: {
                        emotion: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                        emotion_intensity: {
                          type: 'array',
                          items: { type: 'number' },
                        },
                      },
                    },
                    name_intimacy: { type: 'string', example: '0.9' },
                  },
                },
              },
              self_emotions: {
                type: 'object',
                properties: {
                  emotion: { type: 'array', items: { type: 'string' } },
                  emotion_intensity: { type: 'array', items: { type: 'number' } },
                },
              },
              state_emotions: {
                type: 'object',
                properties: {
                  emotion: { type: 'array', items: { type: 'string' } },
                  emotion_intensity: { type: 'array', items: { type: 'number' } },
                },
              },
              problem: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    situation: { type: 'string' },
                    approach: { type: 'string' },
                    outcome: { type: 'string' },
                    decision_code: { type: 'string' },
                    conflict_response_code: { type: 'string' },
                  },
                },
              },
              strength: { type: 'string' },
            },
          },
        },
        reflection: {
          type: 'object',
          properties: {
            achievements: { type: 'array', items: { type: 'string' } },
            shortcomings: { type: 'array', items: { type: 'string' } },
            todo: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
};
