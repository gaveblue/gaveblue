// GB+ 2.6.1 — destructive actions never run from page rendering.
// Reset clears ONLY the financial document, not Supabase Auth identity/profile.
// Actual persistence always goes through the revision-checked repository.save().
import {emptyDatabase} from './store.js?v=20261106-2610';

export const RESET_CONFIRMATION='LIMPAR';
export const DELETE_CONFIRMATION='EXCLUIR';

export function financialResetCounts(db){
 const data=db||{};
 return {
  titles:(data.titles||[]).length,
  payments:(data.payments||[]).length,
  accounts:(data.accounts||[]).length,
  cards:(data.cards||[]).length,
  cardPurchases:(data.cardPurchases||[]).length,
  transfers:(data.transfers||[]).length,
  partners:(data.partners||[]).length,
  imports:(data.bankImportBatches||[]).length,
  institutions:(data.banks||[]).length
 };
}

export function canResetFinancialData(phrase,acknowledged){
 return phrase===RESET_CONFIRMATION&&acknowledged===true;
}
export function canDeleteAccount(phrase,email,expectedEmail,acknowledged){
 return phrase===DELETE_CONFIRMATION&&acknowledged===true&&
  typeof email==='string'&&typeof expectedEmail==='string'&&
  !!expectedEmail&&email.trim().toLowerCase()===expectedEmail.trim().toLowerCase();
}

/** Replacement draft for one atomic save. Must never delete the auth user. */
export function clearFinancialDocument(draft,factory=emptyDatabase){
 if(!draft||typeof draft!=='object'||!Array.isArray(draft.titles))throw Error('Dados financeiros inválidos.');
 const fresh=factory();
 if(!fresh||!Array.isArray(fresh.titles)||!Array.isArray(fresh.categories)||!fresh.settings)throw Error('Não foi possível gerar o estado inicial.');
 for(const key of Object.keys(draft))delete draft[key];
 Object.assign(draft,fresh);
 return draft;
}
