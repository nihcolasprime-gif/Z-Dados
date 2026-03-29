import { supabase } from '../lib/supabase';

export interface Tarefa {
  id?: string;
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'concluido';
  prioridade: 'baixa' | 'media' | 'alta';
  data_prazo: string | null;
  vinculo_id?: string;
  vinculo_tipo?: 'processo' | 'cliente';
  escritorio_id?: string;
}

export const tarefaService = {
  fetchTarefas: async (filters?: { vinculo_id?: string; vinculo_tipo?: string }) => {
    let query = supabase.from('tarefas').select('*').order('data_prazo', { ascending: true });
    
    if (filters?.vinculo_id) query = query.eq('vinculo_id', filters.vinculo_id);
    if (filters?.vinculo_tipo) query = query.eq('vinculo_tipo', filters.vinculo_tipo);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  salvarTarefa: async (tarefa: Tarefa) => {
    const { data: me } = await supabase.auth.getUser();
    const escritorio_id = 'ESC-001'; // Default Fallback

    const payload = { ...tarefa, escritorio_id };
    
    if (tarefa.id) {
      const { error } = await supabase.from('tarefas').update(payload).eq('id', tarefa.id);
      if (error) throw error;
      return null;
    } else {
      const { data, error } = await supabase.from('tarefas').insert([payload]).select().single();
      if (error) throw error;
      return data;
    }
  },

  excluirTarefa: async (id: string) => {
    const { error } = await supabase.from('tarefas').delete().eq('id', id);
    if (error) throw error;
  },

  toggleStatus: async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pendente' ? 'concluido' : 'pendente';
    const { error } = await supabase.from('tarefas').update({ status: newStatus }).eq('id', id);
    if (error) throw error;
  }
};
