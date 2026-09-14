import nodemailer from 'nodemailer';
import { config } from './config.js';

let transporter=null;

function getTransporter(){
  if(transporter)return transporter;
  if(!config.smtp.host||!config.smtp.user||!config.smtp.pass)return null;
  transporter=nodemailer.createTransport({
    host:config.smtp.host,
    port:config.smtp.port,
    secure:config.smtp.secure,
    auth:{user:config.smtp.user,pass:config.smtp.pass}
  });
  return transporter;
}

export function smtpConfigured(){
  return Boolean(config.smtp.host&&config.smtp.user&&config.smtp.pass);
}

export async function sendParentSafetyAlert({to,parentName,childName,category,severity,excerpt}){
  const transport=getTransporter();
  if(!transport)return false;
  const subject=`Kiddo safety alert for ${childName}`;
  const text=[
    `Hi ${parentName||'Parent'},`,
    '',
    `Kiddo noticed a ${severity} safety concern while talking with ${childName}.`,
    `Category: ${category}`,
    '',
    'Conversation excerpt:',
    excerpt,
    '',
    'Please check in with your child. Kiddo has already given a child-safe response encouraging them to speak to a trusted grown-up.',
    '',
    'This alert was sent because safety email alerts are enabled in Parent Controls.',
    '',
    'Amarktai Kiddo',
    'Part of the Amarktai Network'
  ].join('\n');
  await transport.sendMail({from:config.smtp.from,to,subject,text});
  return true;
}
