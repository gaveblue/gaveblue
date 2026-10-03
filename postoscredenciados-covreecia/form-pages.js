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
  function validate(formId) {
    const state = states.get(formId);
    if (!state) return true;
    let first = null;
    state.form.querySelectorAll('input,select,textarea').forEach(field => {
      if (!mark(field) && !first) first = field;
    });
    state.message.textContent = first ? 'Preencha os campos destacados em vermelho para continuar.' : '';
    if (first) {
      first.focus();
      first.scrollIntoView({ block: 'center', behavior: 'smooth' });
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
    form.querySelector('[data-form-validation]')?.remove();
    const message = document.createElement('p'); message.className = 'central-form-error-summary'; message.setAttribute('role', 'alert');
    message.dataset.formValidation = 'true'; form.prepend(message);
    states.set(formId, { form, message });
    form.scrollTop = 0;
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
    state.message.textContent = 'Preencha os campos destacados em vermelho para continuar.';
  }, true);
  document.addEventListener('submit', event => {
    const state = states.get(event.target.id);
    if (!state) return;
    if (!validate(event.target.id)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  window.CentralFormPages = { reset, validate };
  const sizeShell = () => {
    const header = document.querySelector('.home-app-header');
    const nav = document.querySelector('.mobile-bottom-nav');
    if (header) document.documentElement.style.setProperty('--central-header-height', `${header.getBoundingClientRect().height}px`);
    if (nav) document.documentElement.style.setProperty('--central-nav-height', `${nav.getBoundingClientRect().height + 20}px`);
  };
  const observer = new ResizeObserver(sizeShell);
  for (const selector of ['.home-app-header', '.mobile-bottom-nav']) {
    const node = document.querySelector(selector); if (node) observer.observe(node);
  }
  sizeShell();
})();
