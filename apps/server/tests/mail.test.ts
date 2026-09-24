import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import request from 'supertest';
import {smtpSettings,sendOtp} from '../src/mail.js';
import {Store} from '../src/store.js';
import {createApp} from '../src/app.js';
test('Nodemailer sends OTP with TLS settings and only delivered codes authenticate',async()=>{
 const keys=['SMTP_HOST','SMTP_PORT','SMTP_SECURE','SMTP_USER','SMTP_PASS','EMAIL_FROM'];const saved=keys.map(k=>process.env[k]);const original=nodemailer.createTransport;
 Object.assign(process.env,{SMTP_HOST:'smtp.example.test',SMTP_PORT:'587',SMTP_SECURE:'false',SMTP_USER:'sender@example.test',SMTP_PASS:'test-password',EMAIL_FROM:'sender@example.test'});
 let code='',rejected=false;
 try{
 assert.equal(smtpSettings().transport.requireTLS,true);assert.equal(smtpSettings().transport.secure,false);
 nodemailer.createTransport=((..._args:unknown[])=>original({name:'test-smtp',version:'1',send(mail,callback){code=String(mail.data.text).match(/\b\d{6}\b/)![0];callback(null,{accepted:rejected?[]:['learner@example.test'],rejected:rejected?['learner@example.test']:[],messageId:'test',envelope:{from:'sender@example.test',to:['learner@example.test']}})}})) as typeof original;
 const a=request.agent(createApp(new Store(),{secret:'smtp-tests-only-long-secret-for-signing',origin:'http://localhost:5173',demo:true,payment:'sandbox',adminEmail:'learner@example.test'}));
 const c=(await a.post('/api/auth/otp/request').send({email:'learner@example.test'}).expect(200)).body;
 assert.equal(c.delivery,'email');assert.equal(c.previewCode,undefined);
 await a.post('/api/auth/otp/verify').send({email:'learner@example.test',requestId:c.requestId,code}).expect(200);
 await a.get('/api/admin/overview').expect(200);
 rejected=true;await a.post('/api/auth/otp/request').send({email:'failed@example.test'}).expect(503);
 rejected=false;await a.post('/api/auth/otp/request').send({email:'failed@example.test'}).expect(200);
 process.env.SMTP_PORT='465';process.env.SMTP_SECURE='true';assert.equal(smtpSettings().transport.secure,true);
 process.env.SMTP_SECURE='false';assert.throws(()=>smtpSettings());
 delete process.env.SMTP_PASS;await a.post('/api/auth/otp/request').send({email:'partial@example.test'}).expect(503);
 }finally{nodemailer.createTransport=original;keys.forEach((k,i)=>{if(saved[i]===undefined)delete process.env[k];else process.env[k]=saved[i]})}
});
