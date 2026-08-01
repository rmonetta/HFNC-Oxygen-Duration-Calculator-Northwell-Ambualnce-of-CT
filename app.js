(() => {
  'use strict';

  const CYLINDERS = {
    d: { factor: 0.16, name: 'D Tank' },
    e: { factor: 0.28, name: 'E Tank' },
    m: { factor: 1.56, name: 'M Tank' }
  };

  const SAFE_RESIDUAL = 300;
  const AIR_FIO2 = 20.9;
  const O2_FIO2_DIFF = 79.1;
  const WARNING_MINUTES = 30;
  const CRITICAL_MINUTES = 15;

  let selectedTank = 'd';

  const psi = document.getElementById('psi');
  const fio2 = document.getElementById('fio2');
  const flow = document.getElementById('flow');
  const resultCard = document.getElementById('resultCard');
  const statusBadge = document.getElementById('statusBadge');
  const duration = document.getElementById('duration');
  const rawDuration = document.getElementById('rawDuration');

  function formatDuration(minutes) {
    if (!Number.isFinite(minutes)) return 'Continuous';
    const rounded = Math.max(0, Math.round(minutes));
    if (rounded < 61) return `${rounded} min`;
    const hours = Math.floor(rounded / 60);
    const remainder = rounded % 60;
    return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
  }

  function setState(type, status, main, raw = '') {
    resultCard.className = `result-card ${type}`;
    statusBadge.textContent = status;
    duration.textContent = main;
    rawDuration.textContent = raw;
    rawDuration.hidden = !raw;
  }

  function validate() {
    const pressure = Number(psi.value);
    const oxygen = Number(fio2.value);
    const totalFlow = Number(flow.value);

    const psiValid = psi.value === '' || pressure >= SAFE_RESIDUAL;
    const fio2Valid = fio2.value === '' || (oxygen >= 21 && oxygen <= 100);
    const flowValid = flow.value === '' || totalFlow > 0;

    document.getElementById('psiError').hidden = psiValid;
    document.getElementById('fio2Error').hidden = fio2Valid;
    document.getElementById('flowError').hidden = flowValid;

    return { pressure, oxygen, totalFlow, valid: psiValid && fio2Valid && flowValid };
  }

  function calculate() {
    const values = validate();
    if (!values.valid || psi.value === '' || fio2.value === '' || flow.value === '') {
      setState('neutral', 'Estimated Duration', 'Enter pressure, FiO₂, and flow');
      return;
    }

    const fraction = (values.oxygen - AIR_FIO2) / O2_FIO2_DIFF;
    if (fraction <= 0) {
      setState('normal', 'Oxygen Supply Available', 'Continuous');
      return;
    }

    const tankFlow = fraction * values.totalFlow;
    const usableLiters = Math.max(values.pressure - SAFE_RESIDUAL, 0) * CYLINDERS[selectedTank].factor;
    const minutes = usableLiters / tankFlow;

    if (!Number.isFinite(minutes) || minutes < 0) {
      setState('neutral', 'Estimated Duration', 'Check entered values');
      return;
    }

    if (minutes <= CRITICAL_MINUTES) {
      setState('critical', 'Critical Low Supply', formatDuration(minutes), `Calculated duration: ${minutes.toFixed(1)} minutes`);
    } else if (minutes <= WARNING_MINUTES) {
      setState('warning', 'Low Supply Warning', formatDuration(minutes), `Calculated duration: ${minutes.toFixed(1)} minutes`);
    } else {
      setState('normal', 'Oxygen Supply Available', formatDuration(minutes), `Calculated duration: ${minutes.toFixed(1)} minutes`);
    }
  }

  document.querySelectorAll('.source-option').forEach(button => {
    button.addEventListener('click', () => {
      selectedTank = button.dataset.tank;
      document.querySelectorAll('.source-option').forEach(item => {
        const selected = item === button;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-checked', String(selected));
      });
      calculate();
    });
  });

  [psi, fio2, flow].forEach(input => input.addEventListener('input', calculate));

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
