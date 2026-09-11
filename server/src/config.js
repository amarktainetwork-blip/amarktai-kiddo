import 'dotenv/config';

function required(name, min = 1) {
  const value = process.env[name]?.trim();
  if (!value || value.length < min) throw new Error(`${name} is required${min > 1 ? ` and must be at least ${min} characters` : ''}.`);
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  publicOrigin: process.env.PUBLIC_ORIGIN?.replace(/\/$/, '') || '',
  jwtSecret: process.env.NODE_ENV === 'production' ? required('JWT_SECRET', 32) : (process.env.JWT_SECRET || 'development-only-secret-change-me'),
  databaseUrl: required('DATABASE_URL'),
  mediaDir: process.env.MEDIA_DIR || '/data/media',
  aiProvider: (process.env.AI_PROVIDER || 'auto').toLowerCase(),
  genx: {
    key: process.env.GENX_API_KEY?.trim() || '',
    baseUrl: (process.env.GENX_BASE_URL || 'https://query.genx.sh').replace(/\/$/, ''),
    chatModel: process.env.GENX_CHAT_MODEL || 'gpt-5.6-luna',
    imageModel: process.env.GENX_IMAGE_MODEL || '',
    musicModel: process.env.GENX_MUSIC_MODEL || ''
  },
  openrouter: {
    key: process.env.OPENROUTER_API_KEY?.trim() || '',
    baseUrl: (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
    chatModel: process.env.OPENROUTER_CHAT_MODEL || 'openai/gpt-5.3-chat',
    imageModel: process.env.OPENROUTER_IMAGE_MODEL || 'openai/gpt-5.2'
  },
  credits: {
    starting: Number(process.env.STARTING_CREDITS || 100),
    chat: Number(process.env.CHAT_CREDIT_COST || 1),
    story: Number(process.env.STORY_CREDIT_COST || 3),
    image: Number(process.env.IMAGE_CREDIT_COST || 10),
    music: Number(process.env.MUSIC_CREDIT_COST || 15)
  },
  defaultDailyMessageLimit: Number(process.env.DEFAULT_DAILY_MESSAGE_LIMIT || 80)
};

if (!['auto', 'genx', 'openrouter'].includes(config.aiProvider)) throw new Error('AI_PROVIDER must be auto, genx, or openrouter.');
if (config.aiProvider === 'genx' && !config.genx.key) throw new Error('AI_PROVIDER=genx requires GENX_API_KEY.');
if (config.aiProvider === 'openrouter' && !config.openrouter.key) throw new Error('AI_PROVIDER=openrouter requires OPENROUTER_API_KEY.');
if (config.aiProvider === 'auto' && !config.genx.key && !config.openrouter.key) console.warn('No AI key configured. Add GENX_API_KEY or OPENROUTER_API_KEY to enable AI features.');
