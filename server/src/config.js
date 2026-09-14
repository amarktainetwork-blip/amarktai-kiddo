import 'dotenv/config';

function required(name, min = 1) {
  const value = process.env[name]?.trim();
  if (!value || value.length < min) throw new Error(`${name} is required${min > 1 ? ` and must be at least ${min} characters` : ''}.`);
  return value;
}

const databaseUrl = process.env.DATABASE_URL?.trim() || '';
const postgresPassword = process.env.POSTGRES_PASSWORD?.trim() || '';
if (!databaseUrl && !postgresPassword) throw new Error('Set DATABASE_URL or POSTGRES_PASSWORD for the database connection.');

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  publicOrigin: process.env.PUBLIC_ORIGIN?.replace(/\/$/, '') || '',
  jwtSecret: process.env.NODE_ENV === 'production' ? required('JWT_SECRET', 32) : (process.env.JWT_SECRET || 'development-only-secret-change-me'),
  databaseUrl,
  db: {
    host: process.env.DB_HOST || 'db',
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME || 'kiddo',
    user: process.env.DB_USER || 'kiddo',
    password: postgresPassword
  },
  mediaDir: process.env.MEDIA_DIR || '/data/media',
  aiProvider: (process.env.AI_PROVIDER || 'auto').toLowerCase(),
  timeouts: {
    text: Number(process.env.AI_TEXT_TIMEOUT_MS || 45000),
    media: Number(process.env.AI_MEDIA_TIMEOUT_MS || 120000),
    health: Number(process.env.AI_HEALTH_TIMEOUT_MS || 10000)
  },
  genx: {
    key: process.env.GENX_API_KEY?.trim() || '',
    baseUrl: (process.env.GENX_BASE_URL || 'https://query.genx.sh').replace(/\/$/, ''),
    chatModel: process.env.GENX_CHAT_MODEL || 'gpt-5.6-luna',
    imageModel: process.env.GENX_IMAGE_MODEL || 'genxlm-pro-v1-img-fast',
    musicModel: process.env.GENX_MUSIC_MODEL || 'lyria-3-clip-preview',
    ttsModel: process.env.GENX_TTS_MODEL || 'grok-tts',
    transcriptionModel: process.env.GENX_TRANSCRIPTION_MODEL || 'genxlm-pro-v1-tr',
    defaultVoice: process.env.GENX_DEFAULT_VOICE || 'aurora'
  },
  openrouter: {
    key: process.env.OPENROUTER_API_KEY?.trim() || '',
    baseUrl: (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
    chatModel: process.env.OPENROUTER_CHAT_MODEL || 'openai/gpt-5.6-luna',
    imageModel: process.env.OPENROUTER_IMAGE_MODEL || 'openai/gpt-5-image',
    musicModel: process.env.OPENROUTER_MUSIC_MODEL || 'google/lyria-3-clip-preview'
  },
  credits: {
    starting: Number(process.env.STARTING_CREDITS || 100),
    chat: Number(process.env.CHAT_CREDIT_COST || 1),
    story: Number(process.env.STORY_CREDIT_COST || 3),
    image: Number(process.env.IMAGE_CREDIT_COST || 10),
    music: Number(process.env.MUSIC_CREDIT_COST || 15)
  },
  smtp: {
    host: process.env.SMTP_HOST?.trim() || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER?.trim() || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM?.trim() || 'Amarktai Kiddo <no-reply@amarktai.co.za>'
  },
  defaultDailyMessageLimit: Number(process.env.DEFAULT_DAILY_MESSAGE_LIMIT || 80),
  mediaReconcileIntervalMs: Number(process.env.MEDIA_RECONCILE_INTERVAL_MS || 15000)
};

if (!['auto', 'genx', 'openrouter'].includes(config.aiProvider)) throw new Error('AI_PROVIDER must be auto, genx, or openrouter.');
if (config.aiProvider === 'genx' && !config.genx.key) throw new Error('AI_PROVIDER=genx requires GENX_API_KEY.');
if (config.aiProvider === 'openrouter' && !config.openrouter.key) throw new Error('AI_PROVIDER=openrouter requires OPENROUTER_API_KEY.');
if (config.aiProvider === 'auto' && !config.genx.key && !config.openrouter.key) {
  console.warn('No AI key configured. Add GENX_API_KEY or OPENROUTER_API_KEY to enable AI features.');
}
