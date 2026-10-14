const choices = {
  eventType: ['Company event','Corp','501c3','Private party','School event','Community event'],
  experience: ['Private visit','Pose with Santa','Book reading','Holiday event','Other / help me choose'],
  timezone: ['Central Time','Eastern Time','Mountain Time','Pacific Time','Other, specified below'],
  duration: ['30 minutes','1 hour','2 hours','More than 2 hours','Help me decide'],
  music: ['Yes, please bring and set up Christmas music','No, we will provide music or prefer no music','Please discuss Christmas music options with me']
};
function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const limits = {name:100,email:150,phone:40,company:150,eventType:100,experience:100,date:10,time:5,timezone:100,duration:100,guests:6,location:250,music:120,details:3000};
  const data = {};
  for (const [key,limit] of Object.entries(limits)) {
    const value = String(input[key] ?? '').trim();
    if (value.length > limit || (key !== 'company' && !value)) return null;
    data[key] = value;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) return null;
  const day = new Date(data.date+'T12:00:00Z');
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0,10) !== data.date) return null;
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if (data.date < today || !/^\d+$/.test(data.guests) || Number(data.guests)<1 || Number(data.guests)>100000) return null;
  for (const [key,values] of Object.entries(choices)) if (!values.includes(data[key])) return null;
  return data;
}
async function upstream(payload) {
  const url = new URL(process.env.GOOGLE_APPS_SCRIPT_URL);
  if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)) throw new Error('Invalid endpoint');
  const response = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,token:process.env.BOOKING_SHARED_SECRET}),signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw new Error('Upstream HTTP failure');
  const result = await response.json();
  if (result.ok !== true) throw new Error('Upstream rejected request');
  return result;
}
async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  const configured = Boolean(process.env.GOOGLE_APPS_SCRIPT_URL && process.env.BOOKING_SHARED_SECRET);
  if (req.method === 'GET') {
    if (!configured) return res.status(200).json({ready:false});
    try {await upstream({action:'health'});return res.status(200).json({ready:true});}
    catch {return res.status(200).json({ready:false});}
  }
  if (req.method !== 'POST') {res.setHeader('Allow','GET, POST');return res.status(405).json({ok:false});}
  const origin=req.headers.origin;
  if (origin) {try {if(new URL(origin).host!==req.headers.host)return res.status(403).json({ok:false});}catch{return res.status(403).json({ok:false});}}
  if (!configured) return res.status(503).json({ok:false,message:'Online booking is temporarily unavailable. Please contact Santa In High Def.'});
  let input=req.body;
  try {if(typeof input==='string')input=JSON.parse(input);}catch{return res.status(400).json({ok:false,message:'Please check your event details.'});}
  if (input?.website) return res.status(400).json({ok:false,message:'Unable to submit this request.'});
  const data=validate(input);
  if (!data) return res.status(400).json({ok:false,message:'Please check your event details.'});
  const requestId=input.requestId;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId||''))return res.status(400).json({ok:false,message:'Please refresh the page and try again.'});
  try {
    const result=await upstream({action:'book',requestId,data});
    return res.status(200).json({ok:true,requestId:result.requestId});
  }catch{return res.status(502).json({ok:false,message:'We could not confirm your request. Your details are still here. Please try again.'});}
}
module.exports=handler;
module.exports.validate=validate;
