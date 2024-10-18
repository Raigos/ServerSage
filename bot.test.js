// bot.test.js
const { Client, GatewayIntentBits } = require('discord.js');
const OpenAIService = require('./openai-service');
const { createBot } = require('./bot');

jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    once: jest.fn(),
    login: jest.fn(),
    emit: jest.fn()
  })),
  GatewayIntentBits: {
    Guilds: 'Guilds',
    GuildMessages: 'GuildMessages',
    MessageContent: 'MessageContent'
  },
  Collection: jest.fn().mockImplementation(() => ({
    has: jest.fn(),
    get: jest.fn(),
    set: jest.fn()
  }))
}));
jest.mock('./openai-service');

describe('Discord Bot', () => {
  let client;
  let message;
  let openAIService;

  beforeEach(() => {
    openAIService = {
      generateResponse: jest.fn().mockResolvedValue('I am fine, thank you!')
    };
    client = createBot(openAIService);
    message = {
      content: '!ask How are you?',
      author: { bot: false, id: '123' },
      channel: { id: '456' },
      reply: jest.fn()
    };

    // Mock the messageHistories Collection
    client.messageHistories = new Map();
    client.messageHistories.set(message.channel.id, []);
  });

  test('bot should respond to !ask command', async () => {
    await client.emit('messageCreate', message);
    expect(openAIService.generateResponse).toHaveBeenCalled();
    expect(message.reply).toHaveBeenCalledWith('I am fine, thank you!');
  });
});