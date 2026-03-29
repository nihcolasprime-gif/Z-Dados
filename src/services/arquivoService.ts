import { supabase } from '../lib/supabase';

export interface ArquivoVault {
  id: string;
  escritorio_id: string;
  vinculo_id: string;
  vinculo_tipo: 'cliente' | 'processo' | 'financeiro';
  nome: string;
  url: string;
  tamanho?: number;
  formato?: string;
  categoria?: string;
  created_at?: string;
}

export const arquivoService = {
  async uploadArquivo(
    file: File, 
    vinculoId: string, 
    vinculoTipo: ArquivoVault['vinculo_tipo'], 
    escritorioId: string,
    categoria: string = 'Outros'
  ): Promise<ArquivoVault> {
    // 1. Upload para o Supabase Storage (Bucket: arquivos)
    const fileExt = file.name.split('.').pop();
    const fileName = `${escritorioId}/${vinculoTipo}/${vinculoId}/${Math.random()}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('arquivos')
      .upload(fileName, file);

    if (uploadError) throw new Error('Falha no upload: ' + uploadError.message);

    // 2. Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('arquivos')
      .getPublicUrl(fileName);

    // 3. Registrar no Banco de Dados (arquivos_vault)
    const { data: record, error: dbError } = await supabase
      .from('arquivos_vault')
      .insert([{
        escritorio_id: escritorioId,
        vinculo_id: vinculoId,
        vinculo_tipo: vinculoTipo,
        nome: file.name,
        url: publicUrl,
        tamanho: file.size,
        formato: fileExt,
        categoria
      }])
      .select()
      .single();

    if (dbError) throw dbError;
    return record;
  },

  async listarArquivos(vinculoId: string): Promise<ArquivoVault[]> {
    const { data, error } = await supabase
      .from('arquivos_vault')
      .select('*')
      .eq('vinculo_id', vinculoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async excluirArquivo(id: string, storagePath: string): Promise<void> {
    // 1. Remover do Storage
    const path = storagePath.split('arquivos/').pop();
    if (path) {
      await supabase.storage.from('arquivos').remove([path]);
    }

    // 2. Remover do Banco
    const { error } = await supabase
      .from('arquivos_vault')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
