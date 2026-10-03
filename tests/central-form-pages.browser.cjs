// Run with Playwright available in NODE_PATH. No production data or requests.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = path.join(__dirname, '../postoscredenciados-covreecia');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage(); await page.route('**/*', route => route.abort());
    for (const width of [320, 390]) for (const mode of ['rapido', 'completo', 'servico']) {
      await page.setViewportSize({ width, height: 740 });
      await page.setContent(fs.readFileSync(path.join(base, 'index.html'), 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''));
      await page.addStyleTag({ content: fs.readFileSync(path.join(base, 'styles.css'), 'utf8') + '.hidden{display:none!important}svg{width:24px;height:24px}*{box-sizing:border-box}' });
      await page.addScriptTag({ content: fs.readFileSync(path.join(base, 'form-pages.js'), 'utf8') });
      const formId = mode === 'servico' ? 'loose-note-form' : 'fuel-form';
      await page.evaluate(({mode, formId}) => {
        const form = document.getElementById(formId);
        form.closest('.app-form-modal').classList.remove('hidden');
        form.querySelector('select').disabled = true;
        document.getElementById('fuel-complete-fields').classList.toggle('hidden', mode !== 'completo');
        for (const id of ['fuel-value','fuel-liters','fuel-type']) document.getElementById(id).required = mode === 'completo';
        window.CentralFormPages.reset(formId);
      }, {mode, formId});
      await page.locator(`#${formId} .central-form-next`).click();
      assert.ok(await page.locator(`#${formId} .central-field-invalid`).count(), 'missing fields marked red');
      assert.match(await page.locator(`#${formId} .central-form-progress`).innerText(), /^1 de/);
      for (let step = 0; step < (mode === 'rapido' ? 1 : 2); step++) {
        await page.evaluate(formId => {
          const form = document.getElementById(formId);
          for (const field of form.querySelectorAll('input,select')) {
            if (field.disabled || field.type === 'file' || field.closest('.central-step-hidden') || !field.required) continue;
            if (field.tagName === 'SELECT') { const option = new Option('Test', 'test'); field.add(option); field.value = 'test'; }
            else field.value = field.type === 'date' ? '2026-10-03' : '10';
            field.dispatchEvent(new Event('input', {bubbles:true}));
          }
        }, formId);
        await page.locator(`#${formId} .central-form-next`).click();
      }
      assert.match(await page.locator(`#${formId} .central-form-progress`).innerText(), /Comprovante/);
      assert.ok(await page.locator(`#${formId} .receipt-dropzone`).isVisible());
      const rect = await page.locator(`#${formId}`).evaluate(form => { const r = form.closest('.app-form-modal').getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; });
      assert.deepEqual(rect, {x:0,y:0,width,height:740});
      await page.locator(`#${formId} .central-form-navigation button`).first().click();
      assert.doesNotMatch(await page.locator(`#${formId} .central-form-progress`).innerText(), /Comprovante/);
      console.log(`PASS ${mode} ${width}px: fullscreen, validation, next/back, receipt`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
