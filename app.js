(() => {
  'use strict';
  const CYLINDERS={d:{factor:.16},e:{factor:.28},m:{factor:1.56}};
  const SAFE_RESIDUAL=300,AIR_FIO2=20.9,O2_FIO2_DIFF=79.1,GOOD_MINUTES=60,CRITICAL_MINUTES=30;
  let selectedTank='d';
  const psi=document.getElementById('psi'),fio2=document.getElementById('fio2'),flow=document.getElementById('flow');
  const resultPanel=document.getElementById('resultPanel'),statusBadge=document.getElementById('statusBadge'),duration=document.getElementById('duration'),rawDuration=document.getElementById('rawDuration'),oxygenFlow=document.getElementById('oxygenFlow'),usableOxygen=document.getElementById('usableOxygen'),statusMessage=document.getElementById('statusMessage');
  function formatDuration(minutes){const rounded=Math.max(0,Math.round(minutes));if(rounded<61)return `${rounded} min`;const h=Math.floor(rounded/60),m=rounded%60;return m?`${h} hr ${m} min`:`${h} hr`;}
  function setState(type,status,main,raw='',o2='—',usable='—',message=''){resultPanel.className=`panel result-panel ${type}`;statusBadge.textContent=status;duration.textContent=main;rawDuration.textContent=raw;rawDuration.hidden=!raw;oxygenFlow.textContent=o2;usableOxygen.textContent=usable;statusMessage.textContent=message;statusMessage.hidden=!message;}
  function calculate(){
    const p=Number(psi.value),f=Number(fio2.value),q=Number(flow.value);
    const pOk=psi.value===''||p>=SAFE_RESIDUAL,fOk=fio2.value===''||(f>=21&&f<=100),qOk=flow.value===''||(q>=0.5&&q<=60);
    document.getElementById('psiError').hidden=pOk;document.getElementById('fio2Error').hidden=fOk;document.getElementById('flowError').hidden=qOk;
    if(!pOk||!fOk||!qOk||psi.value===''||fio2.value===''||flow.value===''){setState('neutral','Awaiting Settings','Enter pressure, FiO₂, and flow');return;}
    const fraction=(f-AIR_FIO2)/O2_FIO2_DIFF;
    const tankFlow=fraction*q;
    const usable=Math.max(p-SAFE_RESIDUAL,0)*CYLINDERS[selectedTank].factor;
    if(fraction<=0){setState('normal','60+ Minutes — Good Range','Continuous','No supplemental oxygen required at entered FiO₂','0.0 L/min',`${usable.toFixed(0)} L`,'Adequate oxygen available for transport.');return;}
    const mins=usable/tankFlow;
    if(!Number.isFinite(mins)||mins<0){setState('neutral','Check Settings','Check entered values');return;}
    const type=mins<CRITICAL_MINUTES?'critical':mins<GOOD_MINUTES?'warning':'normal';
    const status=type==='critical'?'< 30 Minutes — Critical Range':type==='warning'?'30–59 Minutes — Caution Range':'60+ Minutes — Good Range';
    const message=type==='critical'?'Critical oxygen supply. Add or change the oxygen source before transport.':type==='warning'?'Limited oxygen reserve. Account for transport time, loading, delays, and changing patient needs.':'Adequate oxygen available for transport. Continue to account for anticipated transport time, loading, delays, and changing patient needs.';
    setState(type,status,formatDuration(mins),`Calculated duration: ${mins.toFixed(1)} minutes`,`${tankFlow.toFixed(1)} L/min`,`${usable.toFixed(0)} L`,message);
  }
  document.querySelectorAll('.source-option').forEach(btn=>btn.addEventListener('click',()=>{selectedTank=btn.dataset.tank;document.querySelectorAll('.source-option').forEach(item=>{const on=item===btn;item.classList.toggle('selected',on);item.setAttribute('aria-checked',String(on));});calculate();}));
  [psi,fio2,flow].forEach(input=>input.addEventListener('input',calculate));
  document.getElementById('resetButton').addEventListener('click',()=>{psi.value='';fio2.value='';flow.value='';selectedTank='d';document.querySelectorAll('.source-option').forEach((item,i)=>{item.classList.toggle('selected',i===0);item.setAttribute('aria-checked',String(i===0));});document.querySelectorAll('.error').forEach(e=>e.hidden=true);setState('neutral','Awaiting Settings','Enter pressure, FiO₂, and flow');psi.focus();});
  document.getElementById('themeToggle').addEventListener('click',()=>document.body.classList.toggle('dark'));
  if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
