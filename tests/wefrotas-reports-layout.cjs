const {chromium}=require('../../central-audit-build-tools/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'wefrotas/index.html'),'utf8');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 for(const width of [1440,375]){const page=await browser.newPage({viewport:{width,height:900}});await page.route('**/*',r=>r.abort());
 const section=html.slice(html.indexOf('<section id="panel-relatorios"'),html.indexOf('<section id="panel-settings"'));
 await page.setContent('<style>body{margin:0;padding:20px;font-family:Arial}#panel-relatorios{display:block!important}.hidden,[hidden]{display:none!important}</style>'+section);
 for(const file of ['wefrotas.css','wefrotas-reports-layout.css'])await page.addStyleTag({path:path.join(root,'wefrotas',file)});
 await page.evaluate(()=>{document.getElementById('report-results-title').textContent='Despesas por veículo — detalhado';document.getElementById('report-results-meta').textContent='Período: outubro/2026 • Veículo: Todos os veículos • Dados fictícios exclusivos do teste visual';document.getElementById('report-summary-grid').innerHTML='<article class="report-summary-card"><span class="report-summary-label">TOTAL DE DESPESAS</span><strong class="report-summary-value">R$ 12.345,67</strong><small class="report-summary-help">Sem duplicar agrupamentos.</small></article>';document.getElementById('report-results-table').innerHTML='<div class="report-results-scroll"><table class="report-results-table"><thead><tr><th>Data</th><th>Veículo</th><th>Fornecedor</th><th class="report-cell--numeric">Valor líquido</th></tr></thead><tbody>'+Array.from({length:24},(_,i)=>'<tr><td>19/10/2026</td><td>TEST-'+i+'</td><td>Fornecedor de teste com descrição detalhada</td><td class="report-cell--numeric">R$ 123,45</td></tr>').join('')+'</tbody></table></div>';});
 assert.equal(await page.locator('#report-filter-type option').count(),16);assert.equal(await page.locator('#report-filter-start').getAttribute('type'),'hidden');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(await page.locator('.report-results-table th').first().evaluate(e=>getComputedStyle(e).position),'sticky');
 assert.equal(await page.getByRole('button',{name:'Exportar relatório',exact:true}).count(),1);
 const out=path.resolve(root,'../artifacts/reports-layout-20261019');fs.mkdirSync(out,{recursive:true});
 await page.screenshot({path:path.join(out,`reports-${width}.png`),fullPage:false});
 await page.evaluate(()=>document.body.classList.add('dark-mode'));await page.screenshot({path:path.join(out,`reports-dark-${width}.png`),fullPage:false});
 console.log('PASS reports '+width+'px: filters, actions, sticky table, no page overflow, dark mode');await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
