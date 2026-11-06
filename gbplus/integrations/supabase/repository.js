import { emptyDatabase, validateDatabase } from '../../js/store.js?v=20261105-87';
import { uid } from '../../js/domain.js';

export class CloudError extends Error {
  constructor(code, message) { super(message); this.name = 'CloudError'; this.code = code; }
}

/** Adapter staged for integration. No local fallback, automatic upload or background merge. */
export class SupabaseRepository {
  constructor(client, userId) {
    if (!client?.auth || !userId) throw new Error('Cliente e usuário autenticado são obrigatórios.');
    this.client = client;
    this.userId = userId;
    this.revision = null;
    this.busy = false;
  }

  async assertSession() {
    const { data, error } = await this.client.auth.getUser();
    if (error || data?.user?.id !== this.userId) {
      this.revision = null;
      throw new CloudError('SESSION', 'Sua sessão mudou ou expirou. Entre novamente para carregar seus dados.');
    }
  }

  async read() {
    if (this.busy) throw new CloudError('BUSY', 'Aguarde a operação atual.');
    this.busy = true;
    try {
      await this.assertSession();
      const { data, error } = await this.client.from('gbplus_documents')
        .select('revision,data').eq('user_id', this.userId).maybeSingle();
      if (error) throw new CloudError('READ', 'Não foi possível carregar o banco online. Seus dados locais não foram alterados.');
      await this.assertSession();
      if (!data) { this.revision = 0; return emptyDatabase(); }
      const result = validateDatabase(structuredClone(data.data));
      if (result.revision !== data.revision) throw new CloudError('INVALID', 'A revisão do banco é inconsistente.');
      this.revision = result.revision;
      return result;
    } catch (error) { this.revision = null; throw error; }
    finally { this.busy = false; }
  }

  async save(database) {
    if (this.busy) throw new CloudError('BUSY', 'Aguarde a operação atual.');
    if (this.revision === null) throw new CloudError('RELOAD', 'Carregue os dados online antes de salvar.');
    const payload = structuredClone(database);
    payload.revision = this.revision;
    validateDatabase(payload);
    this.busy = true;
    try {
      await this.assertSession();
      const { data, error } = await this.client.rpc('gbplus_save', {
        expected_user_id: this.userId,
        expected_revision: this.revision,
        operation_id: uid(),
        payload
      });
      if (error) {
        if (error.code === '40001' || error.message?.includes('GBPLUS_CONFLICT')) {
          throw new CloudError('CONFLICT', 'Outro dispositivo salvou alterações. Recarregue os dados antes de refazer esta alteração.');
        }
        throw new CloudError('SAVE', 'Não foi possível confirmar a gravação. Recarregue os dados online antes de tentar novamente.');
      }
      await this.assertSession();
      const saved = validateDatabase(structuredClone(data));
      if (saved.revision !== this.revision + 1) throw new CloudError('INVALID', 'A revisão retornada pelo banco é inconsistente.');
      this.revision = saved.revision;
      return saved;
    } catch (error) {
      // An interrupted response may have committed: never retry a stale state.
      this.revision = null;
      throw error;
    } finally { this.busy = false; }
  }

  async restore(database) { return this.save(database); }
  dispose() { this.revision = null; }
}
