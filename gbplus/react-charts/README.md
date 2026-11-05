# GB+ · EasyUI React Charts

Gráficos React isolados do app HTML/JS. Componentes originais `Earnings`, `BarChart` e `chart-primitives` incorporados do [EasyUI](https://github.com/Surajmaurya1/easyui), licença MIT em `EASYUI_LICENSE`.

## Build

```sh
cd gbplus/react-charts
npm install
npm run build
```

Saída estática: `gbplus/charts-dist/gb-react-charts.js` e `gbplus/charts-dist/gb-react-charts.css`. Os arquivos do app original nunca exigem React para iniciar. O carregador `js/gb-react-loader.js` tenta ativar os gráficos quando o bundle compilado existe e mantém o fallback da tela quando não existe.

## Hospedagem

A hospedagem estática deve servir `gbplus/charts-dist/` junto dos demais arquivos em `/gbplus/`. Nunca envie `node_modules`. O processo de build não deve modificar o service worker, autenticação nem dados financeiros.
