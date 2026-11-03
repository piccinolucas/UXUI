/* =====================================================================
   Consultorio Odontológico — lógica compartida por las tres interfaces.
   Cada página define: S (estado), A (acciones), F (formularios), renderView().
   ===================================================================== */

/* ---------- idioma (solo el portal del paciente lo cambia) ---------- */
let LANG='es';
const LOCALE=()=>LANG==='ar'?'ar-u-nu-latn':'es-AR';   // árabe con dígitos latinos: horarios y códigos se leen igual
const tr=(k,fallback)=>(typeof T==='object'&&T[LANG]&&T[LANG][k]!==undefined)?T[LANG][k]:fallback;

/* ---------- helpers ---------- */
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const DOW=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MON=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const fmtLong=s=>{const d=parse(s);if(LANG!=='es')return new Intl.DateTimeFormat(LOCALE(),{weekday:'long',day:'numeric',month:'long'}).format(d);return `${cap(DOW[d.getDay()])} ${d.getDate()} de ${MON[d.getMonth()]}`};
const fmtShort=s=>{const d=parse(s);return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${String(d.getFullYear()).slice(2)}`};
const fmtMonth=d=>LANG!=='es'?new Intl.DateTimeFormat(LOCALE(),{month:'long',year:'numeric'}).format(d):`${cap(MON[d.getMonth()])} ${d.getFullYear()}`;
const nowHM=()=>{const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}`};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hh=str=>{let h=7;for(const c of str)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
const TODAY=iso(new Date());
const nextWeekday=(from,n)=>{let d=parse(from),c=0;while(c<n){d=addDays(d,1);if(d.getDay()%6)c++}return iso(d)};
const initials=n=>n.split(/[ ,]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const age=nac=>{const b=parse(nac),t=new Date();let a=t.getFullYear()-b.getFullYear();if(t<new Date(t.getFullYear(),b.getMonth(),b.getDate()))a--;return a};
const $=id=>document.getElementById(id);
const val=id=>($(id)?.value||'').trim();
const firstName=p=>p.nombre.split(',')[1]?.trim().split(' ')[0]||p.nombre;
const ltr=s=>`<span class="ltr">${s}</span>`;

/* ---------- íconos: decorativos, ocultos para lectores de pantalla ---------- */
const svg=(p,cls='')=>`<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${p}</svg>`;
const I={
  tooth:svg('<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7.5.4 2.6 1 6 2.5 6s1.8-3 2.5-5.5c.3-1 1.7-1 2 0 .7 2.5 1 5.5 2.5 5.5s2.1-3.4 2.5-6c.5-3 2-4.5 2-7.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>'),
  user:svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  users:svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c1.8.6 3 2.4 3.5 5.5"/>'),
  cal:svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  clip:svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>'),
  door:svg('<path d="M4 21h16M6 21V4h9v17M15 6l4 1v14"/><circle cx="12" cy="13" r=".6"/>'),
  queue:svg('<path d="M4 6h16M4 12h16M4 18h10"/>'),
  bell:svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>'),
  arrow:svg('<path d="M5 12h14M13 6l6 6-6 6"/>','flip'),
  back:svg('<path d="M19 12H5M11 6l-6 6 6 6"/>','flip'),
  chevL:svg('<path d="M15 6l-6 6 6 6"/>','flip'),
  chevR:svg('<path d="M9 6l6 6-6 6"/>','flip'),
  search:svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  plus:svg('<path d="M12 5v14M5 12h14"/>'),
  out:svg('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>','flip'),
  warn:svg('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>'),
  check:svg('<path d="M5 12l5 5 9-10"/>'),
  x:svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  msg:svg('<path d="M4 20l1.5-4A8 8 0 1 1 9 19.5z"/>'),
  pin:svg('<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
  kbd:svg('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
  globe:svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'),
  lock:svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
};

/* ---------- datos ---------- */
const PROFS=[
  {id:'L',dni:'25331408',pass:'Demo1234',nombre:'Dra. Martina López',esp:'Odontología general',mat:'M.N. 38.457',box:'Consultorio 2',dias:[1,2,3,4,5],tipos:['Consulta y revisión','Limpieza','Urgencia']},
  {id:'D',dni:'29874512',pass:'Demo1234',nombre:'Dr. Martín Domínguez',esp:'Ortodoncia',mat:'M.N. 41.203',box:'Consultorio 1',dias:[1,3,5],tipos:['Consulta y revisión','Control de ortodoncia']},
  {id:'S',dni:'27665903',pass:'Demo1234',nombre:'Dra. Lucía Saccone',esp:'Endodoncia',mat:'M.N. 36.880',box:'Consultorio 3',dias:[2,4],tipos:['Consulta y revisión','Tratamiento de conducto','Urgencia']},
];
const TIPOS=['Consulta y revisión','Limpieza','Urgencia','Control de ortodoncia','Tratamiento de conducto'];
const TIMES=['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];
const CONDS=['Problemas cardíacos','Cefaleas frecuentes','Artritis o artrosis','Alteraciones nerviosas','Hepatitis','Presión sanguínea alta','Presión sanguínea baja','Problemas de coagulación','Problemas renales','Fiebre reumática','Problemas gástricos','Alergia al látex','Diabetes','HIV / Sida','Epilepsia'];
const ALERT_CONDS=['Problemas cardíacos','Problemas de coagulación','Alergia al látex','Diabetes','Epilepsia','Presión sanguínea alta','Hepatitis'];
const OBRAS=['Particular / Sin obra social','OSDE','Apross','Swiss Medical','PAMI','Galeno'];
const SEDE='Sede Centro · Av. Colón 1234, Córdoba';

function seed(){
  const d2=nextWeekday(TODAY,2);
  // contraseña de prueba (maqueta); en un sistema real se guarda cifrada (hash), nunca en texto plano
  const P=(o)=>({dom:'',loc:'Córdoba',afil:'',ocup:'',conds:[],alergia:'No',meds:'No',fuma:'No',emb:'',hem:'No',otra:'',anam:true,pass:'Demo1234',...o});
  return {
    patients:[
      P({id:'p1',hc:'HC-2024-001',nombre:'Gutiérrez, María Paz',dni:'44122123',nac:'2002-03-14',tel:'+54 9 351 555-1234',email:'mpgutierrez@correo.com',dom:'Av. Colón 1234, 3° B',os:'Particular / Sin obra social',ocup:'Estudiante',conds:['Problemas de coagulación'],alergia:'Penicilina',hem:'Sí'}),
      P({id:'p2',hc:'HC-2023-118',nombre:'Saccone, Facundo',dni:'38647762',nac:'1994-08-02',tel:'+54 9 351 612-0098',email:'fsaccone@correo.com',dom:'Bv. San Juan 410',os:'OSDE',afil:'61234567/01',ocup:'Docente',fuma:'Sí'}),
      P({id:'p3',hc:'HC-2024-047',nombre:'Lombardi, Rocío',dni:'40155234',nac:'1997-11-21',tel:'+54 9 351 700-4410',email:'rlombardi@correo.com',dom:'Obispo Trejo 255',os:'Apross',afil:'2045519',ocup:'Diseñadora',conds:['Presión sanguínea alta'],meds:'Enalapril'}),
      P({id:'p4',hc:'HC-2022-310',nombre:'Márquez, Elena',dni:'35012987',nac:'1990-05-09',tel:'+54 9 351 433-2871',email:'emarquez@correo.com',dom:'Rondeau 88',os:'Swiss Medical',afil:'SM-883201',ocup:'Contadora'}),
      P({id:'p5',hc:'HC-2021-022',nombre:'Pereyra, Juan Carlos',dni:'30111222',nac:'1983-01-30',tel:'+54 9 351 389-5520',email:'jcpereyra@correo.com',dom:'Av. Vélez Sarsfield 1500',os:'PAMI',afil:'150334229',ocup:'Comerciante',conds:['Diabetes'],meds:'Metformina'}),
      // dado de alta por recepción: todavía no completó su ficha de salud en el portal
      P({id:'p6',hc:'HC-2026-205',nombre:'Ferreyra, Tomás',dni:'41888999',nac:'1999-06-18',tel:'+54 9 351 466-7781',email:'tferreyra@correo.com',os:'Galeno',afil:'GA-55120',alergia:'',meds:'',fuma:'',hem:'',anam:false}),
    ],
    turnos:[
      {id:'T-4821',pac:'p1',prof:'L',fecha:TODAY,hora:'10:30',tipo:'Consulta y revisión',estado:'confirmado'},
      {id:'T-4815',pac:'p2',prof:'L',fecha:TODAY,hora:'09:00',tipo:'Limpieza',estado:'confirmado'},
      {id:'T-4817',pac:'p3',prof:'L',fecha:TODAY,hora:'09:30',tipo:'Urgencia',estado:'confirmado'},
      {id:'T-4830',pac:'p4',prof:'D',fecha:d2,hora:'11:00',tipo:'Control de ortodoncia',estado:'confirmado'},
      {id:'T-4833',pac:'p6',prof:'L',fecha:nextWeekday(TODAY,3),hora:'15:00',tipo:'Consulta y revisión',estado:'confirmado'},
    ],
    cola:[
      {id:'c1',pac:'p2',turno:'T-4815',prof:'L',llegada:'08:52',estado:'espera'},
      {id:'c2',pac:'p3',turno:'T-4817',prof:'L',llegada:'09:14',estado:'espera'},
    ],
    salida:[],
    hc:[
      {pac:'p1',fecha:'2026-08-20',prof:'D',motivo:'Control de ortodoncia',piezas:'13, 23',proc:'Ajuste de arco',diag:'Evolución favorable',notas:'Sin dolor.',ind:'Próximo control en 4 semanas. Usar cera si el arco lastima.'},
      {pac:'p1',fecha:'2026-07-16',prof:'D',motivo:'Control de ortodoncia',piezas:'—',proc:'Cambio de ligaduras',diag:'Sin novedades',notas:'',ind:'Reforzar la higiene interproximal con cepillo de ortodoncia.'},
      {pac:'p1',fecha:'2026-05-02',prof:'L',motivo:'Consulta y revisión',piezas:'36',proc:'Obturación compuesta clase I',diag:'Caries oclusal',notas:'Se trabajó con hemostasia local por antecedente de coagulación.',ind:'No comer por 2 horas.'},
      {pac:'p2',fecha:'2026-04-11',prof:'L',motivo:'Limpieza',piezas:'—',proc:'Tartrectomía y pulido',diag:'Gingivitis leve',notas:'',ind:'Usar cepillo de cerdas suaves.'},
      {pac:'p5',fecha:'2026-09-30',prof:'S',motivo:'Tratamiento de conducto',piezas:'46',proc:'Endodoncia 1° sesión',diag:'Pulpitis irreversible',notas:'Medicación intraconducto. Paciente diabético: control de glucemia previo.',ind:'Evitar masticar del lado derecho hasta la próxima sesión.'},
    ],
    wa:[],
  };
}

/* ---------- consultas ---------- */
const pac=id=>S.patients.find(p=>p.id===id);
const prof=id=>PROFS.find(p=>p.id===id);
const turno=id=>S.turnos.find(t=>t.id===id);
const nextTurnoOf=pid=>S.turnos.filter(t=>t.pac===pid&&t.estado==='confirmado'&&t.fecha>=TODAY).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora))[0];
const colaOf=pid=>S.cola.find(c=>c.pac===pid&&c.estado!=='finalizado');
const queueFor=pid=>S.cola.filter(c=>c.prof===pid&&c.estado!=='finalizado');
const newTurnoId=()=>'T-'+(4840+S.turnos.length+Math.floor(Math.random()*9));
const alertsOf=p=>{const a=[];if(p.alergia&&!/^no/i.test(p.alergia))a.push('Alergia: '+p.alergia);p.conds.filter(c=>ALERT_CONDS.includes(c)).forEach(c=>a.push(c));if(p.hem==='Sí'&&!p.conds.includes('Problemas de coagulación'))a.push('Propenso/a a hemorragias');return a};

function slotsFor(pid,date){
  const p=prof(pid),d=parse(date);
  if(!p.dias.includes(d.getDay())||date<TODAY) return [];
  return TIMES.filter(t=>hh(pid+date+t)%3!==0
    && !S.turnos.some(x=>x.prof===pid&&x.fecha===date&&x.hora===t&&x.estado!=='cancelado')
    && !(date===TODAY&&t<=nowHM()));
}
function dayState(pid,date){
  if(date<TODAY) return {st:'past',n:0};
  if(!prof(pid).dias.includes(parse(date).getDay())) return {st:'off',n:0};
  const n=slotsFor(pid,date).length;
  return {st:n===0?'none':n<=4?'few':'ok',n};
}
function offerSlots(pid,page){
  const out=[];let d=addDays(parse(TODAY),1);
  for(let i=0;i<90&&out.length<(page+1)*3;i++,d=addDays(d,1)){const s=iso(d),sl=slotsFor(pid,s);if(sl.length)out.push({fecha:s,hora:sl[hh(s)%sl.length]})}
  return out.slice(page*3,page*3+3);
}
function queuePos(c){
  const q=S.cola.filter(x=>x.prof===c.prof&&x.estado==='espera');
  const pos=q.findIndex(x=>x.id===c.id)+1;
  const busy=S.cola.some(x=>x.prof===c.prof&&x.estado==='atendiendo');
  return {pos,wait:(pos-1)*30+(busy?20:0)};
}
function sendWA(p,text){const m={to:p.tel,text,at:nowHM(),pac:p.id};S.wa.push(m);return m}
const waConfirmText=(p,t,head='tu turno quedó CONFIRMADO')=>`Consultorio Odontológico\nHola ${firstName(p)}, ${head}.\n\n${fmtLong(t.fecha)} · ${t.hora} h\n${prof(t.prof).nombre} · ${t.tipo}\n${SEDE}\nCódigo: ${t.id}\n\nPodés cancelarlo o reprogramarlo desde el portal del paciente.`;
const waBox=(m,title='WhatsApp · Consultorio Odontológico')=>`<div class="wa"><div class="head">${I.msg} ${esc(title)}</div><div class="bub" dir="auto">${esc(m.text)}<small>${m.at} ✓✓</small></div></div>`;
const brand=sub=>`<div class="brand"><span class="mark">${I.tooth}</span><span>${esc(tr('brand','Consultorio Odontológico'))}<small>${esc(sub)}</small></span></div>`;

/* ---------- breadcrumbs ---------- */
function crumbs(items){
  return `<nav class="crumbs" aria-label="${esc(tr('crumbs','Ruta de navegación'))}"><ol>${items.map((it,i)=>i===items.length-1
    ?`<li><span aria-current="page">${esc(it.label)}</span></li>`
    :`<li><button class="link" data-a="nav" data-v="${it.v}">${esc(it.label)}</button></li>`).join('')}</ol></nav>`;
}

/* ---------- calendario con cantidad de turnos por día ---------- */
// o = {month: Date, prof, sel, dayAction, monthAction, canPrev}
function calendar(o){
  const m=o.month,first=new Date(m.getFullYear(),m.getMonth(),1);
  const lead=(first.getDay()+6)%7,dim=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();
  const heads=tr('cal.heads',['lun','mar','mié','jue','vie','sáb','dom']);
  const cnt=n=>n===1?tr('cal.one','1 turno'):tr('cal.many','{n} turnos').replace('{n}',n);
  const stTxt={ok:tr('cal.ok','disponible'),few:tr('cal.few','pocos turnos'),none:tr('cal.none','sin turnos'),off:tr('cal.off','sin atención'),past:tr('cal.past','fecha pasada')};
  let cells='';for(let i=0;i<lead;i++)cells+='<button class="out" tabindex="-1" aria-hidden="true"></button>';
  for(let d=1;d<=dim;d++){
    const s=iso(new Date(m.getFullYear(),m.getMonth(),d)),{st,n}=dayState(o.prof,s),can=st==='ok'||st==='few',sel=o.sel===s;
    const label=`${fmtLong(s)}: ${can?cnt(n)+' ('+stTxt[st]+')':stTxt[st]}${s===TODAY?' · '+tr('cal.today','hoy'):''}`;
    cells+=`<button class="${st} ${sel?'sel':''} ${s===TODAY?'today':''}" ${can?`data-a="${o.dayAction}" data-d="${s}" aria-pressed="${sel}"`:'disabled'} aria-label="${esc(label)}"><span class="n" aria-hidden="true">${d}</span>${can?`<span class="c" aria-hidden="true">${n}</span>`:''}</button>`;
  }
  return `<div class="row between"><h3 aria-live="polite">${esc(fmtMonth(m))}</h3>
      <div class="row" style="gap:6px"><button class="btn sm" data-a="${o.monthAction}" data-dir="-1" ${o.canPrev?'':'disabled'} aria-label="${esc(tr('cal.prev','Mes anterior'))}">${I.chevL}</button><button class="btn sm" data-a="${o.monthAction}" data-dir="1" aria-label="${esc(tr('cal.next','Mes siguiente'))}">${I.chevR}</button></div></div>
    <div class="cal">${heads.map(x=>`<span class="h" aria-hidden="true">${x}</span>`).join('')}${cells}</div>
    <div class="legend"><span><i style="background:var(--ok-soft);border:1px solid var(--ok)"></i>${esc(tr('cal.lg.ok','Disponible (el número indica los turnos libres)'))}</span><span><i style="background:var(--warn-soft);border:1px dashed var(--warn)"></i>${esc(tr('cal.lg.few','Pocos turnos (4 o menos)'))}</span><span><i style="border:1px solid var(--line-strong)"></i><s>${esc(tr('cal.lg.off','Sin turnos / sin atención'))}</s></span></div>`;
}
const monthStart=d=>new Date(d.getFullYear(),d.getMonth(),1);
const canPrevMonth=m=>m>monthStart(parse(TODAY));

/* ---------- formularios: campos con validación en vivo ---------- */
const VMSG={req:'Completá este campo.',dni:'Ingresá 7 u 8 números, sin puntos.',tel:'Ingresá el número completo con característica (al menos 10 números).',email:'Revisá el correo: falta la @ o el dominio.',date:'Ingresá una fecha válida que no sea futura.',consent:'Para continuar tenés que aceptar el uso de los datos.',pass:'Usá al menos 8 caracteres, con una letra y un número.',code:'Ingresá los 6 números del código.',match:'Las contraseñas no coinciden.'};
const vmsg=k=>tr('v.'+k,VMSG[k]);
const RULES={
  dni:v=>/^\d{7,8}$/.test(v.replace(/\D/g,''))&&!/[^\d.\s]/.test(v)?'':'dni',
  tel:v=>v.replace(/\D/g,'').length>=10?'':'tel',
  email:v=>!v||/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)?'':'email',
  date:v=>v&&v<=TODAY?'':'date',
  pass:v=>v.length>=8&&/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(v)&&/\d/.test(v)?'':'pass',
  code:v=>/^\d{6}$/.test(v.trim())?'':'code',
};
// o = {id,label,req,type,value,ph,hint,mono,mode,rule,opts,area,auto,full}
function fld(o){
  const err=S.err?.[o.id]||'',hint=o.hint?`<span class="hint" id="${o.id}-hint">${esc(o.hint)}</span>`:'';
  const desc=[o.hint?o.id+'-hint':'',o.id+'-err'].filter(Boolean).join(' ');
  const common=`id="${o.id}" class="input ${o.mono?'mono':''}" aria-describedby="${desc}" ${err?'aria-invalid="true"':''} ${o.req?'aria-required="true" data-req="1"':''} ${o.rule?`data-rule="${o.rule}"`:''}`;
  let ctl;
  if(o.opts) ctl=`<select ${common}>${o.opts.map(x=>{const[v,l]=Array.isArray(x)?x:[x,x];return `<option value="${esc(v)}" ${o.value===v?'selected':''}>${esc(l)}</option>`}).join('')}</select>`;
  else if(o.area) ctl=`<textarea ${common} placeholder="${esc(o.ph||'')}">${esc(o.value||'')}</textarea>`;
  else ctl=`<input ${common} type="${o.type||'text'}" value="${esc(o.value||'')}" ${o.ph?`placeholder="${esc(o.ph)}"`:''} ${o.mode?`inputmode="${o.mode}"`:''} ${o.auto?`autocomplete="${o.auto}"`:''} ${o.mono||o.ltr?'dir="ltr"':''}>`;
  if(o.reveal)ctl=`<div class="row" style="flex-wrap:nowrap;gap:8px">${ctl}<button type="button" class="btn" data-a="reveal" data-t="${o.id}" aria-pressed="false">${esc(tr('pass.show','Mostrar'))}<span class="sr-only"> ${esc(tr('pass.word','contraseña'))}</span></button></div>`;
  return `<div class="field" ${o.full?'style="grid-column:1/-1"':''}><label for="${o.id}">${esc(o.label)}${o.req?` <span class="req" aria-hidden="true">*</span><span class="sr-only"> (${esc(tr('v.reqsr','obligatorio'))})</span>`:''}</label>${hint}${ctl}
    <p class="err ${err?'on':''}" id="${o.id}-err">${err?I.warn+esc(err):''}</p></div>`;
}
function checkField(el){
  const v=(el.value||'').trim();let k='';
  if(el.type==='checkbox'){if(el.dataset.req&&!el.checked)k='consent'}
  else if(el.dataset.req&&!v)k='req';
  else if(v&&el.dataset.rule&&RULES[el.dataset.rule])k=RULES[el.dataset.rule](v);
  return k?vmsg(k):'';
}
function paintField(el,msg){
  const e=$(el.id+'-err');
  if(msg){el.setAttribute('aria-invalid','true');el.classList.remove('is-ok');if(e){e.innerHTML=I.warn+esc(msg);e.classList.add('on')}}
  else{el.removeAttribute('aria-invalid');if(e){e.innerHTML='';e.classList.remove('on')}if(el.type!=='checkbox'&&(el.value||'').trim()&&(el.dataset.req||el.dataset.rule))el.classList.add('is-ok')}
  if(S.err){if(msg)S.err[el.id]=msg;else delete S.err[el.id]}
}
// valida todos los campos del formulario; si hay errores deja el foco en el primero
function validate(root){
  S.err={};let first=null;
  root.querySelectorAll('[data-req],[data-rule]').forEach(el=>{const m=checkField(el);if(m){S.err[el.id]=m;first=first||el.id}});
  if(first)S.focusId=first;
  return !first;
}
const errSummary=()=>{const n=Object.keys(S.err||{}).length;return n?`<div class="alert" role="alert">${I.warn}<div><b>${esc(tr('v.sumT','Revisá los datos marcados'))}</b><p>${esc(n===1?tr('v.sum1','Hay 1 campo para corregir.'):tr('v.sumN','Hay {n} campos para corregir.').replace('{n}',n))}</p></div></div>`:''};
document.addEventListener('focusout',e=>{const el=e.target;if(el.matches?.('[data-req],[data-rule]')&&(el.value||el.type==='checkbox'||el.dataset.touched))paintField(el,checkField(el))});
document.addEventListener('input',e=>{const el=e.target;if(!el.matches?.('[data-req],[data-rule]'))return;el.dataset.touched='1';if(el.getAttribute('aria-invalid')==='true'||el.classList.contains('is-ok'))paintField(el,checkField(el))});
document.addEventListener('change',e=>{const el=e.target;if(el.type==='checkbox'&&el.dataset.req)paintField(el,checkField(el))});

/* ---------- ingreso del personal: mismo patrón que el portal del paciente ----------
   DNI + contraseña, botón Mostrar, mismo mensaje de error si el DNI no existe o la
   contraseña no coincide, y usuarios de prueba debajo (maqueta). */
function staffLogin(o){
  const L=S.login||{};
  return `<main class="home" style="max-width:560px">${brand(o.sub)}
    <div class="stack" style="gap:6px"><h1>${esc(o.title)}</h1><p class="muted">${esc(o.lead)}</p></div>
    <form class="card raised stack" data-form="login" novalidate>
      ${errSummary()}
      ${fld({id:'lg-dni',label:'Número de documento (DNI)',req:true,rule:'dni',mono:true,mode:'numeric',auto:'username',hint:'Solo números, sin puntos.',value:L.dni})}
      ${fld({id:'lg-pass',label:'Contraseña',req:true,type:'password',auto:'current-password',reveal:true,value:L.pass})}
      <button class="btn pri lg block" type="submit">${I.lock} Ingresar</button>
      ${L.fail?`<div class="alert warn" role="alert">${I.warn}<div><b>No pudimos validar tus datos</b><p>Revisá el DNI y la contraseña.</p></div></div>`:''}
    </form>
    <p class="muted small">${I.users} ¿Olvidaste tu contraseña? Pedí una nueva a la administración del consultorio.</p>
    <div class="stack" style="gap:8px"><span class="hint">Datos de prueba (solo demo)</span><div class="chips">
      ${o.users.map(u=>`<button class="chip" data-a="fill" data-dni="${u.dni}" data-pass="${u.pass}" aria-label="Completar con ${esc(u.nombre)}, DNI ${u.dni}"><span class="mono">${u.dni}</span><span class="muted mono">${u.pass}</span><span class="small">${esc(u.nombre)}</span></button>`).join('')}</div></div>
  </main>`;
}
// valida las credenciales; devuelve el usuario o marca el error genérico
function checkLogin(users){
  const dni=val('lg-dni').replace(/\D/g,''),pass=$('lg-pass').value;
  const u=users.find(x=>x.dni===dni&&x.pass===pass);
  S.login=u?{}:{dni,fail:true};   // tras un intento fallido la contraseña no se conserva
  return u;
}
const keepLogin=()=>{S.login={dni:val('lg-dni'),pass:$('lg-pass').value}};

/* ---------- avisos: los importantes quedan hasta que se cierran ---------- */
let toastT;
function toast(msg,persist=false){
  S.toast={msg,persist};clearTimeout(toastT);
  if(!persist)toastT=setTimeout(()=>{S.toast=null;render()},6000);
}
const toastHTML=()=>S.toast?`<div class="toast" role="status">${esc(S.toast.msg)}${S.toast.persist?`<button class="btn sm" data-a="toast-close">${esc(tr('close','Cerrar'))}</button>`:''}</div>`:'';

/* ---------- atajos de teclado (personal del consultorio) ----------
   Se usan con Alt para no interferir con lectores de pantalla (WCAG 2.1.4). */
let SHORTCUTS=[];
function kbdModal(){
  return `<div class="row between"><h2 id="dlg-t">Atajos de teclado</h2><button class="btn sm" data-a="close-modal">Cerrar</button></div>
    <p class="muted small">Para quienes usan el sistema todo el día. También podés recorrer todo con <kbd>Tab</kbd>, <kbd>Shift</kbd>+<kbd>Tab</kbd>, <kbd>Enter</kbd> y <kbd>Esc</kbd>.</p>
    <table><tbody>${SHORTCUTS.map(s=>`<tr><td style="white-space:nowrap"><kbd>Alt</kbd> + <kbd>${esc(s.k)}</kbd></td><td>${esc(s.label)}</td></tr>`).join('')}</tbody></table>`;
}
const BASE_A={
  'close-modal'(){S.modal=null},
  'toast-close'(){S.toast=null},
  'kbd-help'(){S.modal={type:'kbd'}},
  fill(d){const a=$('lg-dni'),b=$('lg-pass');a.value=d.dni;b.value=d.pass;paintField(a,'');paintField(b,'');return false},
  // muestra u oculta la contraseña sin redibujar (no se pierde lo tipeado ni el foco)
  reveal(d,el){const i=$(d.t),on=i.type==='password';i.type=on?'text':'password';el.setAttribute('aria-pressed',on);return false},
};

/* ---------- foco y navegación con teclado ----------
   La app redibuja todo con innerHTML; render() guarda qué elemento tenía el foco
   y lo restaura. Si ya no existe, enfoca el de la misma posición en el orden de
   tabulación, o el título (h1) si cambió la pantalla. */
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
const tabbables=root=>[...root.querySelectorAll(FOCUSABLE)].filter(el=>el.offsetParent!==null||el===document.activeElement);
let lastView=null,modalOpener=null;
function focusKey(el){
  if(!el||el===document.body||!app.contains(el))return null;
  const ord=tabbables(app).indexOf(el);
  if(el.id)return {id:el.id,ord};
  const sel=el.tagName.toLowerCase()+Object.keys(el.dataset).filter(k=>k!=='touched').map(k=>`[data-${k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${CSS.escape(el.dataset[k])}"]`).join('');
  return {sel,idx:[...app.querySelectorAll(sel)].indexOf(el),ord};
}
function findKey(k,root=app){
  if(!k)return null;
  let el=k.id?$(k.id):(root.querySelectorAll(k.sel)[k.idx]||root.querySelector(k.sel));
  if(el&&(!root.contains(el)||el.disabled))el=null;
  return el;
}
function focusTitle(){const h=app.querySelector('main h1')||app.querySelector('h1');if(h){h.setAttribute('tabindex','-1');h.focus()}}
function render(){
  const hadModal=!!app.querySelector('.modal');
  const k=focusKey(document.activeElement);
  const viewChanged=lastView!==null&&lastView!==S.view;
  renderView();
  lastView=S.view;
  const modal=app.querySelector('.modal');
  if(modal){
    if(!hadModal)modalOpener=k;
    const el=hadModal&&findKey(k,modal);
    (el||tabbables(modal)[0]||modal).focus();
    return;
  }
  if(S.focusId){const el=$(S.focusId);S.focusId=null;if(el){el.focus();return}}
  if(hadModal&&modalOpener){const el=findKey(modalOpener);modalOpener=null;if(el){el.focus();return}}
  if(!k){if(viewChanged)focusTitle();return}
  const el=findKey(k);
  if(el){el.focus({preventScroll:!viewChanged});return}
  if(viewChanged){focusTitle();return}
  const t=tabbables(app);
  if(t.length&&k.ord>=0)t[Math.min(k.ord,t.length-1)].focus();else focusTitle();
}
const modalWrap=(inner,label)=>`<div class="scrim" data-a="close-modal"></div><div class="modal" role="dialog" aria-modal="true" ${label?`aria-label="${esc(label)}"`:'aria-labelledby="dlg-t"'}><div class="card raised stack">${inner}</div></div>`;

/* ---------- eventos globales ---------- */
function bindEvents(){
  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-a]');if(!el)return;
    const fn=A[el.dataset.a];if(!fn)return;e.preventDefault();
    if(typeof beforeAction==='function')beforeAction(el.dataset.a);
    const r=fn(el.dataset,el);if(r!==false)render();
  });
  document.addEventListener('submit',e=>{
    const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();
    if(f.dataset.validate!=='no'&&!validate(f)){if(typeof onInvalid==='function')onInvalid(f.dataset.form);render();return}
    F[f.dataset.form]?.(f);render();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&S.modal){S.modal=null;render();return}
    // Enter / Espacio activan las filas clickeables (role="button")
    if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('[role="button"][data-a]')){e.preventDefault();e.target.click();return}
    // atajos con Alt
    if(e.altKey&&!e.ctrlKey&&!e.metaKey&&SHORTCUTS.length&&!S.modal){
      const key=e.code.replace(/^Digit|^Key/,'');const s=SHORTCUTS.find(x=>x.k===key);
      if(s){e.preventDefault();s.run();render();return}
    }
    // Tab y Shift+Tab quedan dentro del modal mientras está abierto
    if(e.key==='Tab'){
      const m=app.querySelector('.modal');if(!m)return;
      const f=tabbables(m);if(!f.length){e.preventDefault();return}
      const first=f[0],last=f[f.length-1],a=document.activeElement;
      if(!m.contains(a)){e.preventDefault();(e.shiftKey?last:first).focus()}
      else if(e.shiftKey&&a===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&a===last){e.preventDefault();first.focus()}
    }
  });
}
