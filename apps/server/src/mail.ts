import nodemailer from 'nodemailer';
import { z } from 'zod';
export function smtpConfigured() {
  return ['SMTP_HOST','SMTP_USER','SMTP_PASS'].some(key=>Boolean(process.env[key]?.trim()));
}
export function smtpSettings() {
  const env=z.object({SMTP_HOST:z.string().trim().min(1),SMTP_PORT:z.coerce.number().int().min(1).max(65535).default(587),SMTP_SECURE:z.enum(['true','false']).optional(),SMTP_USER:z.string().trim().min(1),SMTP_PASS:z.string().min(1),EMAIL_FROM:z.string().trim().min(1).refine(s=>!/[\r\n]/.test(s))}).parse(process.env);
  const secure=env.SMTP_SECURE?env.SMTP_SECURE==='true':env.SMTP_PORT===465;
  if(env.SMTP_PORT===465&&!secure)throw Error('Port 465 requires secure SMTP');
  return {from:env.EMAIL_FROM,transport:{host:env.SMTP_HOST,port:env.SMTP_PORT,secure,requireTLS:!secure,auth:{user:env.SMTP_USER,pass:env.SMTP_PASS},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:10000,tls:{minVersion:'TLSv1.2' as const},logger:false,debug:false}};
}
export async function sendOtp(email:string,code:string) {
  const config=smtpSettings();
  const transport=nodemailer.createTransport(config.transport);
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    const info=await Promise.race([
      transport.sendMail({from:config.from,to:email,subject:'Your BharatSkill Nexus sign-in code',text:`Your sign-in code is ${code}. It expires in 10 minutes and can only be used once. If you did not request this code, ignore this email. Never share this code.`}),
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>{transport.close();reject(Error('SMTP deadline exceeded'))},12000)})
    ]);
    if(!info.accepted?.length||info.rejected?.length)throw Error('Recipient not accepted');
  }catch(error){
    const detail=error as {code?:unknown;responseCode?:unknown;command?:unknown};
    const safe=(value:unknown)=>typeof value==='string'&&/^[A-Za-z0-9_ -]{1,32}$/.test(value)?value:undefined;
    console.error('OTP SMTP delivery failed', {code:safe(detail.code),responseCode:typeof detail.responseCode==='number'?detail.responseCode:undefined,command:safe(detail.command)});
    throw error;
  }finally{if(timer)clearTimeout(timer);transport.close()}
}
