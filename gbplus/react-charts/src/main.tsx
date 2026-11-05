import React, { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Earnings } from "./components/ui/Earnings";
import { BarChart } from "./components/ui/BarChart";
import "./index.css";

// This entry only owns explicitly marked chart containers, never the GB+ app shell.
interface EarningsData {
  periods: Array<{
    id: string; label: string; comparison: string;
    total: number; previous: number;
    trend: number[]; trendLabels: string[];
    sources: Array<{ id: string; label: string; amount: number; color: string }>;
  }>;
  hasRecords: boolean;
}
interface BarData {
  data: Array<{ label: string; income: number; expense: number }>;
  count: number;
  periodLabel: string;
}
interface Payload { earnings: EarningsData; bar: BarData }
const roots = new Map<Element, Root>();
const currency = new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" });
const compact = new Intl.NumberFormat("pt-BR", { notation:"compact", maximumFractionDigits:1 });

function reveal(host: HTMLElement) {
  const fallback = host.parentElement?.querySelector<HTMLElement>(".gb-chart-fallback");
  useEffect(() => {
    if (!host.isConnected) return;
    if (fallback) fallback.hidden = true;
    return () => { if (fallback?.isConnected) fallback.hidden = false; };
  }, [host, fallback]);
}

function Ready({ host, children }: { host: HTMLElement; children: React.ReactNode }) {
  reveal(host);
  return <>{children}</>;
}
class ChartGuard extends React.Component<{ host: HTMLElement; children: React.ReactNode }, { broken: boolean }> {
  state = { broken: false };
  static getDerivedStateFromError() { return { broken: true }; }
  componentDidCatch(error: Error) {
    console.warn("GB+ EasyUI: gráfico indisponível; preservando visualização anterior.", error);
    this.props.host.hidden = true;
    const fallback = this.props.host.parentElement?.querySelector<HTMLElement>(".gb-chart-fallback");
    if (fallback) fallback.hidden = false;
  }
  render() { return this.state.broken ? null : this.props.children; }
}
function detachAll() {
  for (const [host, root] of roots) {
    try { root.unmount(); } catch (error) { console.warn("GB+ Charts cleanup", error); }
    roots.delete(host);
  }
}
function mount(host: HTMLElement | null, content: React.ReactNode) {
  if (!host || !content) return;
  host.hidden = false; // Let ResizeObserver measure actual mobile width.
  let root = roots.get(host);
  if (!root) {
    root = createRoot(host);
    roots.set(host, root);
  }
  root.render(<ChartGuard host={host}><Ready host={host}>{content}</Ready></ChartGuard>);
}
export function unmountAll() { detachAll(); }

export function mountGBCharts(payload: Payload) {
  if (!payload || !payload.earnings || !payload.bar) return;
  for (const [host, root] of roots) {
    if (!host.isConnected) {
      try { root.unmount(); } catch { /* Removed view; safe to discard. */ }
      roots.delete(host);
    }
  }
  const earningsHost = document.querySelector<HTMLElement>('[data-gb-react="earnings"]');
  if (earningsHost && payload.earnings.hasRecords) {
    mount(earningsHost,
      <Earnings
        title="Receitas recebidas"
        className="gb-earnings-in-panel"
        periods={payload.earnings.periods}
        defaultPeriod="30d"
        currency="BRL"
        locale="pt-BR"
        animated
      />
    );
  }
  const barHost = document.querySelector<HTMLElement>('[data-gb-react="cashflow-bars"]');
  if (barHost && payload.bar.data.length) {
    const hasAny = payload.bar.data.some(row => row.income > 0 || row.expense > 0);
    mount(barHost,
      <div className="gb-chart-inner">
        {payload.bar.count > 36 && <p className="gb-chart-description">Gráfico dos últimos 36 períodos {payload.bar.periodLabel}. A tabela abaixo mantém todos os registros.</p>}
        {hasAny ? (
          <div className="gb-chart-wrapper">
            <div style={{ minWidth: payload.bar.data.length > 12 ? payload.bar.data.length * 44 + 60 : undefined }}>
              <BarChart
                data={payload.bar.data}
                series={[
                  { key: "income", label: "Receitas", color: "#16a34a" },
                  { key: "expense", label: "Despesas", color: "#ef4444" },
                ]}
                variant="grouped"
                height={238}
                animated
                formatValue={n => currency.format(n)}
                formatTick={n => compact.format(n)}
                ariaLabel="Comparação entre receitas recebidas e despesas pagas"
              />
            </div>
          </div>
        ) : <div className="gb-chart-empty">Registre uma baixa para visualizar as movimentações realizadas.</div>}
      </div>
    );
  }
}
