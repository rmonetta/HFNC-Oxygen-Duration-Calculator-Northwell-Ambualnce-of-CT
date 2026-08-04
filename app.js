(() => {
  'use strict';
  const CYLINDERS={d:{factor:.16},e:{factor:.28},m:{factor:1.56}};
  const SAFE_RESIDUAL=300,AIR_FIO2=20.9,O2_FIO2_DIFF=79.1,GOOD_MINUTES=60,CRITICAL_MINUTES=30;
  let selectedTank='d', lastDuration=null;
  const psi=document.getElementById('psi'),fio2=document.getElementById('fio2'),flow=document.getElementById('flow'),transportMinutes=document.getElementById('transportMinutes');
  const resultPanel=document.getElementById('resultPanel'),statusBadge=document.getElementById('statusBadge'),duration=document.getElementById('duration'),rawDuration=document.getElementById('rawDuration'),oxygenFlow=document.getElementById('oxygenFlow'),usableOxygen=document.getElementById('usableOxygen'),statusMessage=document.getElementById('statusMessage');
  const transportAssessment=document.getElementById('transportAssessment'),transportBanner=document.getElementById('transportBanner'),transportTitle=document.getElementById('transportTitle'),transportText=document.getElementById('transportText'),assessmentIcon=document.getElementById('assessmentIcon');

  function formatDuration(minutes){const rounded=Math.max(0,Math.round(minutes));if(rounded<61)return `${rounded} min`;const h=Math.floor(rounded/60),m=rounded%60;return m?`${h}h ${m}m`:`${h}h`;}
  function setState(type,status,main,raw='',o2='—',usable='—',message=''){resultPanel.className=`panel result-panel ${type}`;statusBadge.textContent=status;duration.textContent=main;rawDuration.textContent=raw;rawDuration.hidden=!raw;oxygenFlow.textContent=o2;usableOxygen.textContent=usable;statusMessage.textContent=message;statusMessage.hidden=!message;}
  function setTransportAssessment(durationMinutes){
    const entered=transportMinutes.value.trim();
    const t=Number(entered);
    const valid=entered===''||(Number.isFinite(t)&&t>=1&&t<=1440);
    document.getElementById('transportMinutesError').hidden=valid;
    if(entered===''||!valid||durationMinutes===null||!Number.isFinite(durationMinutes)){transportAssessment.hidden=true;return;}
    const reserve=durationMinutes-t;
    let kind,title,action,icon;
    if(reserve>=15){kind='good';title='Adequate Oxygen Supply';action='The estimated oxygen supply appears adequate for the anticipated transport.';icon='✓';}
    else if(reserve>=0){kind='caution';title='Limited Oxygen Reserve';action='Consider changing or supplementing the oxygen source before departure.';icon='!';}
    else{kind='critical';title='Insufficient Oxygen Supply';action='The anticipated transport exceeds the estimated oxygen duration. Change or supplement the oxygen source before departure.';icon='×';}
    assessmentIcon.textContent=icon;
    transportTitle.textContent=title;
    transportText.innerHTML=`<div class="assessment-metrics-single"><div><span>Anticipated transport time</span><strong>${formatDuration(t)}</strong></div></div><p class="assessment-action">${action}</p>`;
    transportBanner.className=`recommendation transport-decision ${kind}`;
    transportAssessment.hidden=false;
  }
  function calculate(){
    const p=Number(psi.value),f=Number(fio2.value),q=Number(flow.value);
    const pOk=psi.value===''||(p>=300&&p<=2500),fOk=fio2.value===''||(f>=21&&f<=100),qOk=flow.value===''||q>0;
    document.getElementById('psiError').hidden=pOk;document.getElementById('fio2Error').hidden=fOk;document.getElementById('flowError').hidden=qOk;
    if(!pOk||!fOk||!qOk||psi.value===''||fio2.value===''||flow.value===''){lastDuration=null;setState('neutral','Awaiting Settings','Enter pressure, FiO₂, and flow');setTransportAssessment(null);return;}
    const fraction=(f-AIR_FIO2)/O2_FIO2_DIFF;
    const tankFlow=fraction*q;
    const usable=Math.max(p-SAFE_RESIDUAL,0)*CYLINDERS[selectedTank].factor;
    if(fraction<=0){lastDuration=Infinity;setState('normal','60+ Minutes — Good Range','Continuous','No supplemental oxygen required at entered FiO₂','0.0 L/min',`${usable.toFixed(0)} L`,'Adequate oxygen available for transport.');transportAssessment.hidden=true;return;}
    const mins=usable/tankFlow;
    if(!Number.isFinite(mins)||mins<0){lastDuration=null;setState('neutral','Check Settings','Check entered values');setTransportAssessment(null);return;}
    lastDuration=mins;
    const type=mins<CRITICAL_MINUTES?'critical':mins<GOOD_MINUTES?'warning':'normal';
    const status=type==='critical'?'< 30 Minutes — Critical Range':type==='warning'?'30–59 Minutes — Caution Range':'60+ Minutes — Good Range';
    const message=type==='critical'?'Critical oxygen supply. Add or change the oxygen source before transport.':type==='warning'?'Limited oxygen reserve. Account for transport time, loading, delays, and changing patient needs.':'Adequate oxygen available for transport. Continue to account for anticipated transport time, loading, delays, and changing patient needs.';
    setState(type,status,formatDuration(mins),`Calculated duration: ${mins.toFixed(1)} minutes`,`${tankFlow.toFixed(1)} L/min`,`${usable.toFixed(0)} L`,message);
    setTransportAssessment(mins);
  }
  document.querySelectorAll('.source-option').forEach(btn=>btn.addEventListener('click',()=>{selectedTank=btn.dataset.tank;document.querySelectorAll('.source-option').forEach(item=>{const on=item===btn;item.classList.toggle('selected',on);item.setAttribute('aria-checked',String(on));});calculate();}));
  [psi,fio2,flow,transportMinutes].forEach(input=>input.addEventListener('input',calculate));
  document.getElementById('resetButton').addEventListener('click',()=>{psi.value='';fio2.value='';flow.value='';transportMinutes.value='';selectedTank='d';lastDuration=null;document.querySelectorAll('.source-option').forEach((item,i)=>{item.classList.toggle('selected',i===0);item.setAttribute('aria-checked',String(i===0));});document.querySelectorAll('.error').forEach(e=>e.hidden=true);setState('neutral','Awaiting Settings','Enter pressure, FiO₂, and flow');transportAssessment.hidden=true;psi.focus();});
  document.getElementById('themeToggle').addEventListener('click',()=>document.body.classList.toggle('dark'));
  if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
