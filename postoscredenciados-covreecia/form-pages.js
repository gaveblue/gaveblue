(() => {
  const states = new Map();
  function root(form, id) {
    let node = document.getElementById(id);
    while (node && node.parentElement !== form) node = node.parentElement;
    return node;
  }
  function mark(field) {
    const invalid = !field.disabled && field.type !== 'file' && !field.validity.valid;
    field.classList.toggle('central-field-invalid', invalid);
    field.setAttribute('aria-invalid', String(invalid));
    const id = `${field.id}-validation`;
    let note = document.getElementById(id);
    if (invalid && !note) {
      note = document.createElement('small'); note.id = id; note.className = 'central-field-error';
      field.parentElement.appendChild(note);
      const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
      descriptions.add(id); field.setAttribute('aria-describedby', [...descriptions].join(' '));
    }
    if (note) { note.hidden = !invalid; note.textContent = field.validity.valueMissing ? 'Preencha este campo.' : 'Confira o valor informado.'; }
    return !invalid;
  }
  function show(state, index) {
    state.index = index;
    state.groups.forEach((group, i) => group.forEach(node => node.classList.toggle('central-step-hidden', i !== index)));
    state.label.textContent = `${index + 1} de ${state.groups.length} · ${state.names[index]}`;
    state.back.disabled = index === 0;
    state.next.hidden = index === state.groups.length - 1;
    state.form.closest('.app-form-modal').scrollTop = 0;
    state.form.scrollTop = 0;
  }
  function validate(formId, currentOnly = false) {
    const state = states.get(formId);
    if (!state) return true;
    const groups = currentOnly ? [state.groups[state.index]] : state.groups;
    let first = null;
    groups.flat().forEach(node => node.querySelectorAll('input,select,textarea').forEach(field => {
      if (!mark(field) && !first) first = field;
    }));
    state.message.textContent = first ? 'Preencha os campos destacados em vermelho para continuar.' : '';
    if (first) {
      show(state, state.groups.findIndex(group => group.some(node => node.contains(first))));
      first.focus();
    }
    return !first;
  }
  function reset(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelector('[data-form-navigation]')?.remove();
    form.querySelectorAll('.central-step-hidden').forEach(node => node.classList.remove('central-step-hidden'));
    form.querySelectorAll('[aria-invalid]').forEach(node => { node.removeAttribute('aria-invalid'); node.classList.remove('central-field-invalid'); });
    form.querySelectorAll('.central-field-error').forEach(node => { node.hidden = true; });
    const fuel = formId === 'fuel-form';
    const complete = fuel && !document.getElementById('fuel-complete-fields').classList.contains('hidden');
    const ids = fuel
      ? [['fuel-city', 'fuel-station', 'fuel-date'], ...(complete ? [['fuel-complete-fields']] : []), ['fuel-photo-camera', 'fuel-action-buttons']]
      : [['loose-supplier', 'loose-service-type', 'loose-value'], ['loose-date', 'loose-notes'], ['loose-photo-camera', 'loose-action-buttons']];
    const groups = ids.map(group => [...new Set(group.map(id => root(form, id)).filter(Boolean))]);
    const footer = document.createElement('div'); footer.dataset.formNavigation = 'true'; footer.className = 'central-form-navigation';
    const label = document.createElement('p'); label.className = 'central-form-progress'; label.setAttribute('aria-live', 'polite');
    const message = document.createElement('p'); message.className = 'central-form-error-summary'; message.setAttribute('role', 'alert');
    const row = document.createElement('div');
    const back = document.createElement('button'); back.type = 'button'; back.textContent = 'Voltar';
    const next = document.createElement('button'); next.type = 'button'; next.textContent = 'Continuar'; next.className = 'central-form-next';
    row.append(back, next); footer.append(label, message, row); form.appendChild(footer);
    const names = fuel ? ['Abastecimento', ...(complete ? ['Valores e combustível'] : []), 'Comprovante'] : ['Serviço', 'Data e observações', 'Comprovante'];
    const state = { form, groups, names, label, message, back, next, index: 0 }; states.set(formId, state);
    back.onclick = () => show(state, Math.max(0, state.index - 1));
    next.onclick = () => { if (validate(formId, true)) show(state, state.index + 1); };
    show(state, 0);
  }
  document.addEventListener('input', event => {
    const state = states.get(event.target.form?.id);
    if (!state) return;
    if (event.target.hasAttribute('aria-invalid')) mark(event.target);
    state.form.querySelector('[data-draft-recovery]')?.remove();
  });
  document.addEventListener('change', event => {
    if (states.has(event.target.form?.id) && event.target.hasAttribute('aria-invalid')) mark(event.target);
  });
  document.addEventListener('invalid', event => {
    const state = states.get(event.target.form?.id);
    if (!state) return;
    event.preventDefault();
    mark(event.target);
    const index = state.groups.findIndex(group => group.some(node => node.contains(event.target)));
    if (index >= 0) show(state, index);
    state.message.textContent = 'Preencha os campos destacados em vermelho para continuar.';
  }, true);
  document.addEventListener('submit', event => {
    const state = states.get(event.target.id);
    if (!state) return;
    if (state.index < state.groups.length - 1) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (validate(event.target.id, true)) show(state, state.index + 1);
    } else if (!validate(event.target.id)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  window.CentralFormPages = { reset, validate };
})();
