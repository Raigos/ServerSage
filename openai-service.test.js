const OpenAIService = require('./openai-service');

// Mock the OpenAI library
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }]
        })
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mocked response' } }]
          })
        }
      }
    }))
  };
});


const OpenAIService = require('./openai-service');

describe('OpenAIService', () => {
  let openAIService;

  beforeEach(() => {
    openAIService = new OpenAIService();
  });

  test('normalizeL2 should correctly normalize a vector', () => {
    const vector = [3, 4];
    const normalizedVector = openAIService.normalizeL2(vector);
    expect(normalizedVector[0]).toBeCloseTo(0.6);
    expect(normalizedVector[1]).toBeCloseTo(0.8);
  });

  test('generateEmbedding should return a normalized embedding', async () => {
    const embedding = await openAIService.generateEmbedding('Test text');
    expect(embedding).toEqual([0.1, 0.2, 0.3]);
  });

  test('generateResponse should return a response', async () => {
    const messageHistory = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ];
    const response = await openAIService.generateResponse(messageHistory);
    expect(response).toBe('Mocked response');
  });
});