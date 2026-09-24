import test from 'node:test';
import assert from 'node:assert/strict';
import {explain} from '../src/explanations.js';
import {seedUser,opportunities} from '../src/catalog.js';
const output={summary:'Practise a container and explain the mapped port.',nextActions:['Compare an image with a running container.']};
const groq=()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(output)}}]}));
const gemini=()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(output)}]}}]}));
async function isolated(fn:()=>Promise<void>){const savedFetch=globalThis.fetch;const keys=['GEMINI_API_KEY','GROQ_API_KEY','GEMINI_MODEL','GROQ_MODEL'];const saved=keys.map(k=>process.env[k]);process.env.GEMINI_API_KEY='fake-gemini-secret';process.env.GROQ_API_KEY='fake-groq-secret';try{await fn()}finally{globalThis.fetch=savedFetch;keys.forEach((k,i)=>{if(saved[i]===undefined)delete process.env[k];else process.env[k]=saved[i]})}}
test('primary succeeds without calling backup; response carries only validated fields',()=>isolated(async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return gemini()};const r=await explain(seedUser('u'),opportunities[0]);assert.equal(calls,1);assert.equal(r.provider,'gemini');assert.equal(r.fallbackUsed,false);assert.equal(r.readiness.score,78);
}));
test('rate limits, service errors, network failures and invalid outputs switch to Groq with same minimal context',()=>isolated(async()=>{
 for(const failure of ['rate','server','network','json','schema']){
 const calls:{url:string;body:string;headers:Headers}[]=[];
 globalThis.fetch=async(url,init)=>{calls.push({url:String(url),body:String(init?.body),headers:new Headers(init?.headers)});if(calls.length===2)return groq();if(failure==='network')throw Error('offline');if(failure==='rate'||failure==='server')return new Response('unavailable',{status:failure==='rate'?429:503});if(failure==='json')return new Response('bad json');return new Response(JSON.stringify({candidates:[{content:{parts:[{text:'{"summary":"","nextActions":[]}'}]}}]}));};
 const u=seedUser('private-id');u.passwordHash='private-hash';const before=structuredClone(u);
 const r=await explain(u,opportunities[0],'Help with Docker');
 assert.equal(r.provider,'groq');assert.equal(r.fallbackUsed,true);assert.equal(calls.length,2);assert.equal(r.readiness.score,78);assert.deepEqual(u,before);
 assert.match(calls[1].url,/api.groq.com/);assert.equal(calls[1].headers.get('Authorization'),'Bearer fake-groq-secret');assert.equal(calls[1].headers.get('x-goog-api-key'),null);
 const first=JSON.parse(calls[0].body).contents[0].parts[0].text;const second=JSON.parse(calls[1].body).messages[1].content;assert.equal(first,second);for(const secret of [u.email,u.id,'private-hash','fake-gemini-secret'])assert.ok(!second.includes(secret));
 }
}));
test('missing primary key skips it; total provider failure and no keys produce honest built-in guidance',()=>isolated(async()=>{
 delete process.env.GEMINI_API_KEY;let calls=0;globalThis.fetch=async(url)=>{calls++;assert.match(String(url),/groq/);return groq()};let r=await explain(seedUser('u'),opportunities[0]);assert.equal(r.provider,'groq');assert.equal(calls,1);assert.equal(r.fallbackUsed,false);
 process.env.GEMINI_API_KEY='fake';globalThis.fetch=async()=>new Response('not available',{status:401});r=await explain(seedUser('u'),opportunities[0]);assert.equal(r.provider,'template-fallback');assert.equal(r.fallbackUsed,true);
 delete process.env.GEMINI_API_KEY;delete process.env.GROQ_API_KEY;globalThis.fetch=async()=>{throw Error('Should not call providers')};r=await explain(seedUser('u'),opportunities[0]);assert.equal(r.provider,'deterministic-template');assert.equal(r.fallbackUsed,false);
}));
test('an actual provider deadline aborts the request before trying backup',()=>isolated(async()=>{
 let calls=0;
 globalThis.fetch=async(_url,init)=>{calls++;if(calls===2)return groq();return new Promise<Response>((_resolve,reject)=>{const keepAlive=setTimeout(()=>reject(Error('deadline did not abort')),10000);init!.signal!.addEventListener('abort',()=>{clearTimeout(keepAlive);reject(init!.signal!.reason)},{once:true})})};
 const start=Date.now();const r=await explain(seedUser('u'),opportunities[0]);assert.equal(r.provider,'groq');assert.equal(calls,2);assert.ok(Date.now()-start<10000);
}));
