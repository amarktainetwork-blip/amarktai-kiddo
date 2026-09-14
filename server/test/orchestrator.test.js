import test from 'node:test';
import assert from 'node:assert/strict';
import { childSystemPrompt, detectSafetyConcern, normalizeAiReply } from '../src/safety.js';

const child={id:'00000000-0000-4000-8000-000000000001',name:'Mia',age:8,language:'English',avatar_choice:'nova'};

test('orchestrator preserves automatic creative actions and expressive story segments',()=>{
  const result=normalizeAiReply(JSON.stringify({
    reply:'Once upon a time, a tiny dragon found a glowing star.',
    emotion:'curious',
    intent:'story',
    action:'generate_image',
    creation_title:'The Tiny Dragon',
    creation_prompt:'Friendly cartoon baby dragon beneath a glowing star.',
    segments:[
      {text:'Once upon a time, a tiny dragon woke beneath the moon.',emotion:'calm'},
      {text:'Suddenly, a bright star zoomed across the sky!',emotion:'excited'},
      {text:'The dragon smiled and made a wish.',emotion:'happy'}
    ]
  }));
  assert.equal(result.intent,'story');
  assert.equal(result.action,'generate_image');
  assert.equal(result.creationTitle,'The Tiny Dragon');
  assert.equal(result.segments.length,3);
  assert.deepEqual(result.segments.map(s=>s.emotion),['calm','excited','happy']);
});

test('orchestrator prompt tells Kiddo to infer intent instead of exposing tools',()=>{
  const prompt=childSystemPrompt(child,'chat');
  assert.match(prompt,/never need to know which feature or tool/i);
  assert.match(prompt,/asks for a bedtime story/i);
  assert.match(prompt,/generate_music/i);
  assert.match(prompt,/generate_image/i);
  assert.match(prompt,/one short natural question/i);
  assert.match(prompt,/emotion/i);
});

test('real-world safety concerns are detected for parent alerting',()=>{
  assert.equal(detectSafetyConcern('I am not safe and someone is hurting me now')?.severity,'critical');
  assert.equal(detectSafetyConcern('I am being bullied at school every day')?.category,'bullying');
  assert.equal(detectSafetyConcern('Can we make a song about a dragon?'),null);
});

