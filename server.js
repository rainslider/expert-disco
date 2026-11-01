const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000,DB=path.join(__dirname,'data.json'),PUB=path.join(__dirname,'public');
let db={users:[],sessions:{},games:[]};
try{db=JSON.parse(fs.readFileSync(DB,'utf8'))}catch{}
const save=()=>fs.writeFileSync(DB,JSON.stringify(db));
const hash=(p,s)=>crypto.scryptSync(p,s,32).toString('hex');
const rooms={};
const send=(res,code,obj,type='application/json')=>{res.writeHead(code,{'Content-Type':type,'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'});res.end(Buffer.isBuffer(obj)||typeof obj==='string'?obj:JSON.stringify(obj))};
const body=req=>new Promise(r=>{let b='';req.on('data',c=>{b+=c;if(b.length>2e6)req.destroy()});req.on('end',()=>{try{r(JSON.parse(b||'{}'))}catch{r({})}})});
const user=req=>db.users.find(u=>u.id===db.sessions[(req.headers.authorization||'').replace('Bearer ','')]);
http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://x'),p=u.pathname;let m;
 if(req.method==='OPTIONS')return send(res,204,'');
 try{
 if(p==='/api/register'&&req.method==='POST'){
  const{email,password,username}=await body(req);
  if(!/^\S+@\S+\.\S+$/.test(email||''))return send(res,400,{error:'Enter a valid email.'});
  if((password||'').length<8)return send(res,400,{error:'Password must be at least 8 characters.'});
  if(!/^[\w-]{3,20}$/.test(username||''))return send(res,400,{error:'Username: 3-20 letters, numbers, _ or -.'});
  if(db.users.some(x=>x.email===email.toLowerCase()||x.username.toLowerCase()===username.toLowerCase()))return send(res,409,{error:'Email or username is already taken.'});
  const salt=crypto.randomBytes(16).toString('hex'),id=crypto.randomUUID();
  db.users.push({id,email:email.toLowerCase(),username,salt,pw:hash(password,salt)});
  const t=crypto.randomUUID();db.sessions[t]=id;save();return send(res,200,{token:t,username});}
 if(p==='/api/login'&&req.method==='POST'){
  const{email,password}=await body(req),x=db.users.find(a=>a.email===(email||'').toLowerCase());
  if(!x||hash(password||'',x.salt)!==x.pw)return send(res,401,{error:'Wrong email or password.'});
  const t=crypto.randomUUID();db.sessions[t]=x.id;save();return send(res,200,{token:t,username:x.username});}
 if(p==='/api/games'&&req.method==='GET')return send(res,200,db.games.map(({data,...g})=>g).reverse());
 if(p==='/api/games'&&req.method==='POST'){
  const me=user(req);if(!me)return send(res,401,{error:'Log in first.'});
  const{title,data,multiplayer,finished}=await body(req);
  if(!finished)return send(res,400,{error:'Finish your game before publishing.'});
  if(!title||!data||!Array.isArray(data.objects)||!data.objects.length)return send(res,400,{error:'Add a title and at least one object.'});
  const g={id:crypto.randomUUID(),title:String(title).slice(0,60),author:me.username,multiplayer:!!multiplayer,data,created:Date.now()};
  db.games.push(g);save();return send(res,200,{id:g.id});}
 if(m=p.match(/^\/api\/games\/([\w-]+)$/)){
  const g=db.games.find(x=>x.id===m[1]);return g?send(res,200,g):send(res,404,{error:'Game not found.'});}
 if(m=p.match(/^\/api\/room\/([^/]+)\/events$/)){
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Access-Control-Allow-Origin':'*'});
  (rooms[m[1]]??=new Set()).add(res);req.on('close',()=>rooms[m[1]].delete(res));return;}
 if(m=p.match(/^\/api\/room\/([^/]+)\/send$/)&&req.method==='POST'){
  const d=await body(req);(rooms[m[1]]||[]).forEach(r=>r.write('data: '+JSON.stringify(d)+'\n\n'));return send(res,200,{ok:1});}
 const f=path.join(PUB,p==='/'?'index.html':p);
 if(f.startsWith(PUB)&&fs.existsSync(f)&&fs.statSync(f).isFile())
  return send(res,200,fs.readFileSync(f),{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(f)]||'text/plain');
 send(res,404,'Not found','text/plain');
 }catch(e){send(res,500,{error:'Server error.'})}
}).listen(PORT,()=>console.log('Game Platform on http://localhost:'+PORT));
