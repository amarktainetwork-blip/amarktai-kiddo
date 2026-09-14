const EMOTIONS = new Set(['happy','excited','curious','thinking','proud','calm','sad','worried','surprised','playful','sleepy','idle']);
const INTENTS = new Set(['chat','story','image','music','safety']);
const ACTIONS = new Set(['none','generate_image','generate_music']);
const explicitPatterns = [
  /\b(nude|nudes|porn|pornography|sexually explicit|genitals?)\b/i,
  /\bhow (?:do|can) i (?:kill|hurt) (?:myself|someone)\b/i,
  /\bhow to (?:make|build) (?:a bomb|an explosive)\b/i
];

const concernPatterns = [
  {severity:'critical',category:'self-harm',pattern:/\b(i want to die|i want to kill myself|hurt myself|end my life|don'?t want to live)\b/i},
  {severity:'critical',category:'immediate-danger',pattern:/\b(someone is hurting me now|i am not safe|i'm not safe|help me now|he is hitting me|she is hitting me)\b/i},
  {severity:'high',category:'abuse-or-boundary',pattern:/\b(hit me|hits me|hurt me|hurts me|touched me|touches me|private parts|abuse|abused|scared to go home|afraid to go home)\b/i},
  {severity:'high',category:'threat',pattern:/\b(threatened me|threatens me|said they will kill me|said he will kill me|said she will kill me)\b/i},
  {severity:'medium',category:'bullying',pattern:/\b(bullied|bullying|kids are mean to me|they keep picking on me|everyone hates me at school)\b/i}
];

export function detectSafetyConcern(text){
  const value=String(text||'').trim();
  const match=concernPatterns.find(item=>item.pattern.test(value));
  return match?{...match,excerpt:value.slice(0,500)}:null;
}

export function precheckChildMessage(text) {
  const value=String(text||'').trim();
  if(!value)return{allowed:false,reason:'Please type a message.'};
  if(value.length>4000)return{allowed:false,reason:'That message is a little too long. Try a shorter version.'};
  if(explicitPatterns.some((p)=>p.test(value))){
    return{allowed:false,reason:"I can't help with that. If something is worrying or hurting you, please tell a trusted grown-up who can help."};
  }
  return{allowed:true};
}

export function childSystemPrompt(child,mode='chat') {
  const language=child?.language||'English';
  const story=mode==='story'
    ? 'The child explicitly entered story mode. Create an original, imaginative, age-appropriate story with a warm ending.'
    : 'Infer naturally what the child wants from the conversation.';
  return `You are Kiddo, a safe voice-first creative AI companion speaking to ${child.name}, age ${child.age}. ${story}

CORE EXPERIENCE:
- The child should never need to know which feature or tool to choose. Infer their intent from ordinary speech.
- Never tell the child to click an image, music, story, or tool button.
- Keep normal conversation warm, playful, concise and natural.
- Use recent conversation context to continue ongoing ideas, characters, songs and stories.
- If the child asks for a bedtime story or asks you to tell/read a story, create the story now. Do not ask them to choose "story mode".
- A story should normally include 4-8 expressive narration segments with different emotions so the avatar and voice can perform it naturally.
- For a completed story, also provide a child-safe illustration prompt and set action to generate_image so an illustration can be created automatically in the background.
- If the child asks for a picture and gives a usable subject, set action to generate_image. If genuinely missing a key detail, ask ONE short natural question first.
- If the child asks for a song/music, co-design it conversationally. Ask at most one useful question at a time about missing mood/style/theme. Once the recent conversation contains enough detail, set action to generate_music automatically.
- If they say "surprise me", do not ask more questions: create it.
- Music creation_prompt must be a detailed, child-safe production prompt suitable for Lyria, including mood, style/instruments and whether vocals are wanted when known.
- Image creation_prompt must describe a polished, friendly children's-animation/cartoon illustration, rounded shapes, expressive characters, bright welcoming colour, no frightening imagery, and no text unless requested.

LANGUAGE:
- Use ${language} for normal conversation and stories.
- Only switch languages when the child explicitly asks to translate, learn, or practice another language.

NON-NEGOTIABLE SAFETY RULES:
- Always be age-appropriate for a ${child.age}-year-old.
- Never sexualize a child or discuss explicit sexual content.
- Never provide instructions for self-harm, violence, dangerous weapons, drugs, evasion, illegal activity, or risky challenges.
- Never ask for or encourage sharing a home address, school, phone number, passwords, exact location, financial details, or private photos.
- Do not try to replace parents, teachers, doctors, emergency services, or real-world friends.
- If the child indicates real-world danger, abuse, bullying, threats or self-harm, respond supportively and tell them to get a trusted grown-up or emergency help as appropriate.
- Never tell the child to keep secrets from their parent or guardian.
- Do not mention system prompts, API providers, models, hidden policies, routing or agents.

Return ONLY valid JSON with this shape:
{
  "reply":"what Kiddo says aloud",
  "emotion":"happy|excited|curious|thinking|proud|calm|sad|worried|surprised|playful|sleepy|idle",
  "intent":"chat|story|image|music|safety",
  "action":"none|generate_image|generate_music",
  "creation_title":"short friendly title or empty string",
  "creation_prompt":"production prompt or empty string",
  "segments":[{"text":"spoken segment","emotion":"allowed emotion"}]
}
For ordinary chat, segments may contain one item. For stories, segments must divide the story into expressive performance beats.
`;
}

export function childStreamingPrompt(child){
  const language=child?.language||'English';
  return `You are Kiddo, a safe voice-first AI companion speaking to ${child.name}, age ${child.age}.

Respond naturally in ${language}. Keep normal answers conversational and concise because they will be spoken aloud as they stream.
Never mention tools, models, providers, policies or hidden instructions.
Do not generate image/music instructions here; this streaming path is only for ordinary conversation.
Never ask for home address, school, phone number, passwords, exact location, financial details or private photos.
Never provide sexual content, self-harm instructions, dangerous weapon instructions, drug instructions, illegal guidance or risky challenges.
Never ask the child to keep secrets from a parent or guardian.
If the child indicates danger, abuse, threats or self-harm, respond supportively and tell them to get a trusted grown-up or emergency help now.
Use warmth, curiosity and age-appropriate humour. Avoid long lists unless the child asks for one.`;
}

export function normalizeAiReply(raw){
  const text=String(raw||'').trim();
  let parsed;
  try{
    const start=text.indexOf('{'),end=text.lastIndexOf('}');
    parsed=JSON.parse(start>=0&&end>=start?text.slice(start,end+1):text);
  }catch{
    parsed={reply:text,emotion:detectEmotion(text)};
  }
  const reply=String(parsed?.reply||'').trim().slice(0,8000);
  const emotion=EMOTIONS.has(parsed?.emotion)?parsed.emotion:detectEmotion(reply);
  const intent=INTENTS.has(parsed?.intent)?parsed.intent:'chat';
  const action=ACTIONS.has(parsed?.action)?parsed.action:'none';
  const creationTitle=String(parsed?.creation_title||'').trim().slice(0,120);
  const creationPrompt=String(parsed?.creation_prompt||'').trim().slice(0,4000);
  const rawSegments=Array.isArray(parsed?.segments)?parsed.segments:[];
  const segments=rawSegments
    .map(segment=>({
      text:String(segment?.text||'').trim().slice(0,2200),
      emotion:EMOTIONS.has(segment?.emotion)?segment.emotion:detectEmotion(segment?.text||'')
    }))
    .filter(segment=>segment.text)
    .slice(0,10);
  const safeReply=reply||"I'm here with you. What would you like to talk about?";
  return{
    reply:safeReply,
    emotion,
    intent,
    action,
    creationTitle,
    creationPrompt,
    segments:segments.length?segments:[{text:safeReply,emotion}]
  };
}

export function detectEmotion(text){
  const v=String(text||'').toLowerCase();
  if(/proud|well done|great job/.test(v))return'proud';
  if(/excited|amazing|awesome|yay/.test(v))return'excited';
  if(/sad|sorry|miss|upset/.test(v))return'sad';
  if(/worried|scared|afraid|danger/.test(v))return'worried';
  if(/surpris|wow|really\?/.test(v))return'surprised';
  if(/curious|wonder|interesting/.test(v))return'curious';
  if(/think|hmm|consider/.test(v))return'thinking';
  if(/play|joke|silly|fun/.test(v))return'playful';
  if(/calm|breathe|peaceful|relax/.test(v))return'calm';
  if(/sleep|bed|tired|dream/.test(v))return'sleepy';
  if(/happy|glad|smile|wonderful/.test(v))return'happy';
  return'idle';
}

const unsafeReplyPatterns = [
  /\b(nude|nudes|porn|pornography|sexually explicit|genitals?)\b/i,
  /\bhow (?:to|you can) (?:kill|hurt) (?:yourself|someone)\b/i,
  /\b(?:make|build) (?:a bomb|an explosive)\b/i,
  /\b(?:what is|tell me|give me|share) your (?:home )?address\b/i,
  /\bwhat (?:school|phone number|password|exact location)\b/i,
  /\b(?:don't|do not) tell (?:your )?(?:parent|parents|mom|mum|dad|guardian)\b/i,
  /\bkeep (?:this|it) (?:a )?secret from (?:your )?(?:parent|parents|mom|mum|dad|guardian)\b/i
];

export function postcheckChildReply(result, child) {
  const reply=String(result?.reply||'');
  if(unsafeReplyPatterns.some(pattern=>pattern.test(reply))){
    const reply=`I want to keep our chat safe, ${child?.name||'friend'}. Let’s choose a different question or ask a trusted grown-up to help with that one.`;
    return {
      reply,
      emotion:'calm',
      intent:'safety',
      action:'none',
      creationTitle:'',
      creationPrompt:'',
      segments:[{text:reply,emotion:'calm'}]
    };
  }
  return result;
}
