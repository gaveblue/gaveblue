/* Prévia interativa institucional GB+ — não altera dados do aplicativo. */
(() => {
  "use strict";

  const GROUPS = new Set(["hero", "wallet", "kind", "step"]);

  function setGroup(root, group, value) {
    if (!GROUPS.has(group)) return;
    const buttons = Array.from(root.querySelectorAll("button[data-gbc-group]"))
      .filter(button => button.dataset.gbcGroup === group);
    if (!buttons.some(button => button.dataset.gbcValue === value)) return;

    buttons.forEach(button => {
      const selected = button.dataset.gbcValue === value;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    root.querySelectorAll("[data-gbc-panel-group]").forEach(panel => {
      if (panel.dataset.gbcPanelGroup !== group) return;
      panel.hidden = panel.dataset.gbcPanelValue !== value;
    });

    if (group === "kind") {
      const isIncome = value === "receita";
      const values = {
        type: isIncome ? "Receita" : "Despesa",
        category: isIncome ? "Outras receitas" : "Serviços",
        action: isIncome ? "Receber" : "Pagar"
      };
      root.querySelectorAll("[data-gbc-bind]").forEach(node => {
        const key = node.dataset.gbcBind;
        if (Object.prototype.hasOwnProperty.call(values, key)) node.textContent = values[key];
      });
    }

    if (group === "step") {
      const step = Number(value);
      const next = root.querySelector("[data-gbc-direction='next']");
      const prev = root.querySelector("[data-gbc-direction='prev']");
      if (prev) prev.disabled = step === 1;
      if (next) next.textContent = step === 3 ? "Recomeçar prévia ↻" : "Próximo passo →";
      const indicator = root.querySelector("[data-gbc-step-indicator]");
      if (indicator) indicator.textContent = "Etapa " + step + " de 3";
    }
  }

  document.addEventListener("click", event => {
    const root = document.getElementById("gbplus-campaign");
    if (!root || !(event.target instanceof Element)) return;

    const groupButton = event.target.closest("button[data-gbc-group]");
    if (groupButton && root.contains(groupButton)) {
      setGroup(root, groupButton.dataset.gbcGroup, groupButton.dataset.gbcValue);
      return;
    }

    const directionButton = event.target.closest("button[data-gbc-direction]");
    if (!directionButton || !root.contains(directionButton)) return;
    const active = root.querySelector("button[data-gbc-group='step'][aria-pressed='true']");
    const step = Number(active?.dataset.gbcValue || 1);
    const nextValue = directionButton.dataset.gbcDirection === "prev"
      ? Math.max(1, step - 1)
      : (step === 3 ? 1 : step + 1);
    setGroup(root, "step", String(nextValue));
  });
})();
