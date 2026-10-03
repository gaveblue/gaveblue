const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../postoscredenciados-covreecia/app.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function harness() {
  const classes = () => { const s = new Set(); return { contains: n => s.has(n), add: n => s.add(n), remove: n => s.delete(n), toggle: (n, yes) => yes ? s.add(n) : s.delete(n) }; };
  let release;
  const delayed = new Promise(resolve => release = resolve);
  const slides = Array.from({length:3}, (_,i) => {
    const attrs = {};
    const img = { tagName:'IMG', dataset:{src:`banner-${i}`}, complete:true, naturalWidth:100,
      getAttribute:k=>attrs[k], setAttribute:(k,v)=>attrs[k]=v, removeAttribute:k=>delete attrs[k],
      decode:()=>i === 1 ? delayed : Promise.resolve() };
    return { dataset:{}, classList:classes(), img, querySelector:()=>img, querySelectorAll:()=>[img] };
  });
  const handlers = {}, docHandlers = {};
  const dots = { querySelectorAll:()=>slides.map(()=>({classList:classes()})) };
  const carousel = { querySelectorAll:()=>slides, querySelector:()=>dots, classList:classes(), setAttribute(){}, addEventListener:(k,v)=>handlers[k]=v };
  const document = {hidden:false, getElementById:id=>id==='home-hero-carousel'?carousel:null, addEventListener:(k,v)=>docHandlers[k]=v};
  const context = vm.createContext({document, window:{matchMedia:()=>({matches:true,addEventListener(){}}),setTimeout:()=>1,clearTimeout(){}}, MutationObserver:class{observe(){}}, setTimeout,clearTimeout});
  const start = source.indexOf('function initHomeHeroCarousel()');
  vm.runInContext(source.slice(start,source.indexOf("window.addEventListener('DOMContentLoaded'",start)),context);
  context.initHomeHeroCarousel();
  return {slides, handlers, docHandlers, document, release};
}
test('old banner remains active until next image decode finishes; only two sources retained',async()=>{
  const h=harness(); await flush();
  assert.equal(h.slides[0].classList.contains('is-active'),true);
  h.handlers.keydown({key:'ArrowRight'}); await flush();
  assert.equal(h.slides[0].classList.contains('is-active'),true);
  assert.equal(h.slides[1].classList.contains('is-active'),false);
  assert.equal(h.slides.filter(s=>s.img.getAttribute('src')).length,2);
  h.release(); await flush();
  assert.equal(h.slides[1].classList.contains('is-active'),true);
  assert.equal(h.slides[0].img.getAttribute('src'),undefined);
  assert.equal(h.slides.filter(s=>s.img.getAttribute('src')).length,2);
});
test('leaving app releases images and cancels an in-flight switch',async()=>{
  const h=harness(); await flush(); h.handlers.keydown({key:'ArrowRight'});
  h.document.hidden=true;h.docHandlers.visibilitychange();h.release();await flush();
  assert.equal(h.slides.filter(s=>s.img.getAttribute('src')).length,0);
  assert.equal(h.slides[0].classList.contains('is-active'),true);
});
