#!/usr/bin/env node
// Executa regressões do GB+ localmente, sem GitHub Actions ou dependências npm.
import {spawnSync} from 'node:child_process';
import {readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const testsDir=join(root,'gbplus','tests');
const reportsDir=join(root,'gbplus','homologacao-local','relatorios');
const files=readdirSync(testsDir,{withFileTypes:true})
  .filter(item=>item.isFile()&&item.name.endsWith('.mjs'))
  .map(item=>item.name).sort();
if(files.length===0){console.error('Nenhum teste .mjs foi encontrado.');process.exit(2);}

const git=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'});
const commit=git.status===0?git.stdout.trim():null;
const report={project:'GB+',tool:'node-local',executed_at:new Date().toISOString(),
  commit,node:process.version,platform:process.platform,tests:[]};
console.log(`GB+ — homologação local | ${files.length} arquivos de teste | Node ${process.version}`);
for(const filename of files){
  const path=join(testsDir,filename);
  const start=Date.now();
  const run=spawnSync(process.execPath,[path],{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
  const passed=run.status===0&&!run.error;
  report.tests.push({file:relative(root,path),passed,exit_code:run.status,
    duration_ms:Date.now()-start,signal:run.signal||null,
    output:(run.stdout||'').slice(-2500),error:(run.stderr||run.error?.message||'').slice(-2500)});
  console.log(`${passed?'OK':'FALHOU'}  ${filename}`);
  if(!passed){
    const details=[run.stderr,run.stdout,run.error?.message].filter(Boolean).join('\n');
    if(details)console.error(details.slice(-2500));
  }
}
const passed=report.tests.filter(item=>item.passed).length;
report.summary={total:files.length,passed,failed:files.length-passed};
mkdirSync(reportsDir,{recursive:true});
const stamp=report.executed_at.replace(/[:.]/g,'-');
const output=join(reportsDir,`gbplus-${stamp}.json`);
writeFileSync(output,JSON.stringify(report,null,2)+'\n',{encoding:'utf8',mode:0o600});
console.log(`Resultado: ${passed}/${files.length} testes de arquivo aprovados.`);
console.log(`Relatório: ${output}`);
if(!commit)console.warn('AVISO: sem identificador de commit; informe a versão do código no registro de homologação.');
if(passed!==files.length)process.exitCode=1;
