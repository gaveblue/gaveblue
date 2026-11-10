(function initWeFrotasReserveAllocation(global) {
  'use strict';

  const id = value => String(value ?? '');
  const fuelDate = entry => String(entry?.dataAbastecimento || entry?.dataVencimento || '').slice(0, 10);
  const isFuel = entry => entry?.entryType === 'combustivel';

  function associations(vehicles) {
    return (vehicles || []).flatMap(source =>
      (Array.isArray(source.vehicleSubstitutions) ? source.vehicleSubstitutions : [])
        .map(substitution => ({...substitution, sourceVehicleId:id(source.id)})));
  }

  // Classify only confirmed vehicle/date/driver combinations, never infer from an OS or a low KM.
  function reserveForEntry(entry, vehicles) {
    if (!isFuel(entry) || !entry.vehicleId || !fuelDate(entry)) return null;
    const recorded = associations(vehicles).filter(substitution =>
      id(substitution.reserveVehicleId) === id(entry.vehicleId) &&
      substitution.startDate && fuelDate(entry) >= substitution.startDate &&
      (!substitution.endDate || fuelDate(entry) <= substitution.endDate) &&
      (!substitution.driverId || (entry.driverId && id(substitution.driverId) === id(entry.driverId))) &&
      (!entry.substitutionId || id(entry.substitutionId) === id(substitution.id)) &&
      (!entry.replacedVehicleId || id(entry.replacedVehicleId) === id(substitution.sourceVehicleId))
    );
    if (recorded.length !== 1) return null;
    if (id(recorded[0].sourceVehicleId) === id(entry.vehicleId)) return null;
    return recorded[0];
  }

  function eligibleOrderVehicleId(entry, vehicles, children = []) {
    const sourceId = id(entry?.vehicleId);
    if (!entry || !sourceId) return '';
    if (entry.entryType === 'combustivel_agrupado') {
      if (!children.length) return sourceId;
      const relations = children.map(child => reserveForEntry(child, vehicles));
      if (relations.every(Boolean) &&
        relations.every(relation => id(relation.sourceVehicleId) === id(relations[0].sourceVehicleId) &&
          id(relation.reserveVehicleId) === sourceId)) return id(relations[0].sourceVehicleId);
      return sourceId;
    }
    return reserveForEntry(entry, vehicles)?.sourceVehicleId || sourceId;
  }

  function canAllocateToOrder(entry, order, vehicles, children = []) {
    if (!entry || !order || ['fechada','cancelada'].includes(order.status)) return false;
    if (!entry.vehicleId) return true; // Existing non-vehicle expense workflows.
    const sourceId = id(entry.vehicleId);
    return id(order.vehicleId) === sourceId
      || (id(order.vehicleId) === eligibleOrderVehicleId(entry, vehicles, children) &&
        id(order.vehicleId) !== sourceId);
  }

  function printReserveLabel(entry, order, vehicles, children = []) {
    if (!entry || !order) return '';
    const candidates = entry.entryType === 'combustivel_agrupado' ? children : [entry];
    const labels = candidates.flatMap(candidate => {
      const relation = reserveForEntry(candidate, vehicles);
      if (!relation || id(relation.sourceVehicleId) !== id(order.vehicleId)) return [];
      const reserve = (vehicles || []).find(v => id(v.id) === id(relation.reserveVehicleId));
      return [String(reserve?.placa || '').trim()];
    }).filter(Boolean);
    const distinct = [...new Set(labels)];
    return distinct.length ? 'VEÍCULO RESERVA — ' + distinct.join(', ') + ' (abastecimento do reserva)' : '';
  }

  function isSinistroOnOrder(order, entries, vehicles) {
    const source = (vehicles || []).find(v => id(v.id) === id(order?.vehicleId));
    if (order?.tipoOs === 'sinistro' || order?.operationalIncident?.kind === 'sinistro' ||
      source?.operationalStatus === 'sinistro') return true;
    return (entries || []).some(entry => {
      const children = entry?.entryType === 'combustivel_agrupado' ? (entry.children || []) : [entry];
      return children.some(child => {
        const association = reserveForEntry(child, vehicles);
        return association?.reason === 'sinistro' && id(association.sourceVehicleId) === id(order?.vehicleId);
      });
    });
  }

  global.WeFrotasReserveAllocation = Object.freeze({
    reserveForEntry, eligibleOrderVehicleId, canAllocateToOrder, printReserveLabel, isSinistroOnOrder
  });
})(window);
