// src/docs/swagger-schema.ts

export const DiaryAnalysisSchema = {
  type: 'object',
  properties: {
    activity_analysis: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          activity: { type: 'string', example: '외식하기' },
          peoples: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', example: '엄마' },
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
                name_similarity: { type: 'number' },
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
                cause: { type: 'string' },
                approach: { type: 'string' },
                outcome: { type: 'string' },
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
        tomorrow_mindset: { type: 'string' },
        todo: { type: 'array', items: { type: 'string' } },
      },
    },
  },
};
