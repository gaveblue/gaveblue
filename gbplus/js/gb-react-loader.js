import { buildChartPayload } from "./gb-charts-data.js?v=20261105-45";

// Optional enhancement: the HTML/JS app and all financial operations run without React.
let loadPromise = null;
let generation = 0;
function ensureBundle() {
  if (window.GBReactCharts?.mountGBCharts) return Promise.resolve(window.GBReactCharts);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-gb-charts-css]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.dataset.gbChartsCss = 'true';
      stylesheet.href = './charts-dist/gb-react-charts.css?v=20261105-45';
      document.head.append(stylesheet);
    }
    const script = document.createElement('script');
    script.src = './charts-dist/gb-react-charts.js?v=20261105-45';
    script.async = true;
    script.onload = () => window.GBReactCharts?.mountGBCharts ? resolve(window.GBReactCharts) : reject(new Error('Bundle de gráficos inválido.'));
    script.onerror = () => reject(new Error('Os gráficos opcionais não foram encontrados.'));
    document.head.append(script);
  }).catch(error => { console.warn('GB+ gráficos React indisponíveis. Mantido o gráfico original.', error.message); return null; });
  return loadPromise;
}
export function unmountReactCharts() {
  generation++;
  try { window.GBReactCharts?.unmountAll?.(); } catch (error) { console.warn('GB+ Charts cleanup', error); }
}
export function renderReactCharts(db,state,flowRows) {
  if (!document.querySelector('[data-gb-react]')) return;
  const token = ++generation;
  try {
    const payload = buildChartPayload(db,state,flowRows);
    if (!payload.earnings.hasRecords && !payload.bar.data.some(row=>row.income>0||row.expense>0)) return;
    void ensureBundle().then(api => {
      if (!api || token!==generation || !document.querySelector('[data-gb-react]')) return;
      try { api.mountGBCharts(payload); }
      catch (error) { console.warn('GB+ não conseguiu montar o gráfico; visualização anterior preservada.', error); }
    });
  } catch (error) { console.warn('GB+ dados de gráfico não disponíveis', error); }
}
