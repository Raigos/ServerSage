require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const OpenAIService = require('./openai-service');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.on('debug', console.log);
client.on('warn', console.log);
client.on('error', console.error);

const openAIService = new OpenAIService();
const prefix = '!';

// Store message history for each channel
const messageHistories = new Collection();
const MAX_HISTORY = 1000; // Store up to 1000 messages per channel

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

async function fetchChannelHistory(channel) {
  let history = [];
  let lastId;

  while (history.length < MAX_HISTORY) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) break;

    history = history.concat(Array.from(messages.values()));
    lastId = messages.last().id;

    if (messages.size < 100) break;
  }

  return history.reverse().slice(-MAX_HISTORY).map(msg => ({
    role: msg.author.bot ? 'assistant' : 'user',
    content: msg.content
  }));
}

client.on('messageCreate', async message => {
console.log(`Received message: ${message.content}`);
  // Update message history
  if (!messageHistories.has(message.channel.id)) {
    messageHistories.set(message.channel.id, await fetchChannelHistory(message.channel));
  }
  let channelHistory = messageHistories.get(message.channel.id);
  channelHistory.push({
    role: message.author.bot ? 'assistant' : 'user',
    content: message.content
  });
  if (channelHistory.length > MAX_HISTORY) {
    channelHistory = channelHistory.slice(-MAX_HISTORY);
  }
  messageHistories.set(message.channel.id, channelHistory);

  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'ask') {
    const question = args.join(' ');
    if (!question) {
      return message.reply('Please provide a question after !ask');
    }

    try {
      // Use the stored channel history
      const history = [...channelHistory];
      // Add the current question to the history
      history.push({ role: 'user', content: question });

      const response = await openAIService.generateResponse(history);
      message.reply(response);

      // Add bot's response to the history
      channelHistory.push({ role: 'assistant', content: response });
      if (channelHistory.length > MAX_HISTORY) {
        channelHistory = channelHistory.slice(-MAX_HISTORY);
      }
      messageHistories.set(message.channel.id, channelHistory);
    } catch (error) {
      console.error('Error generating response:', error);
      message.reply('Sorry, I encountered an error while processing your request.');
    }
  }
});
console.log('Attempting to log in...');
client.login(process.env.DISCORD_TOKEN);