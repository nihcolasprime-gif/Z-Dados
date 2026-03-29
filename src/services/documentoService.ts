import { supabase } from '../lib/supabase';
import { DocumentoTemplate, Cliente, Contrato, Escritorio } from '../models';

export const documentoService = {
  // 1. Busca templates vinculados ao escritório (com cache simples de RLS)
  fetchTemplates: async (escritorioId: string) => {
    const { data, error } = await supabase
      .from('documento_templates')
      .select('*')
      .eq('escritorio_id', escritorioId)
      .order('nome');
    
    if (error) throw error;
    return (data as DocumentoTemplate[]) || [];
  },

  // 2. Busca dados completos do escritório para o cabeçalho
  fetchEscritorio: async (escritorioId: string) => {
    const { data, error } = await supabase
      .from('escritorios')
      .select('*')
      .eq('id', escritorioId)
      .maybeSingle();

    if (error) throw error;
    return (data as Escritorio) || null;
  },

  // 3. O CÉREBRO: Substituição de tags (Autofill Professional)
  preencherTemplate: (template: string, cliente: Cliente, processo?: Contrato, escritorio?: Escritorio) => {
    let finalHtml = template;

    // Tags do Cliente
    const mapCliente: Record<string, string> = {
      '{{cliente_nome}}': cliente.nome || '---',
      '{{cliente_cpf}}': cliente.documento || '---',
      '{{cliente_email}}': cliente.email || '---',
      '{{cliente_endereco}}': `${cliente.endereco || ''}, ${cliente.numero || ''} ${cliente.cidade || ''}/${cliente.uf || ''}`,
      '{{cliente_profissao}}': cliente.profissao || '---',
      '{{cliente_estado_civil}}': cliente.estado_civil || '---'
    };

    // Tags do Processo/Contrato
    const mapProcesso: Record<string, string> = {
      '{{processo_numero}}': processo?.numero || '---',
      '{{processo_natureza}}': processo?.natureza || '---',
      '{{processo_valor_total}}': processo?.valor_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '---',
      '{{processo_vara}}': processo?.vara || '---',
      '{{processo_tribunal}}': processo?.tribunal || '---'
    };

    // Tags do Escritório (Cabeçalhos/Rodapés)
    const mapEscritorio: Record<string, string> = {
      '{{escritorio_nome}}': escritorio?.nome || '---',
      '{{escritorio_cnpj}}': escritorio?.cnpj || '---',
      '{{escritorio_endereco}}': escritorio?.endereco_completo || '---'
    };

    const allMaps = { ...mapCliente, ...mapProcesso, ...mapEscritorio };

    Object.entries(allMaps).forEach(([tag, value]) => {
       // Replace all occurrences
       finalHtml = finalHtml.split(tag).join(value);
    });

    return finalHtml;
  },

  // 4. PREPARAÇÃO PDF (Injeção de estilos de impressão e cabeçalho fixo)
  gerarPreviewPdf: (html: string, escritorio?: Escritorio) => {
    const logoHtml = escritorio?.logo_url ? `<img src="${escritorio.logo_url}" style="max-height: 80px; margin-bottom: 20px;">` : '';
    
    return `
      <html>
        <head>
          <style>
            @media print {
              @page { margin: 2cm; }
              body { font-family: 'Times New Roman', serif; line-height: 1.5; color: #000; }
              .no-print { display: none; }
            }
            body { 
              background: #fff; 
              padding: 40px; 
              max-width: 800px; 
              margin: auto; 
              color: #333; 
              font-family: serif; 
              line-height: 1.8;
            }
            .document-header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .document-footer { margin-top: 60px; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="document-header">
            ${logoHtml}
            <h2 style="margin: 0; text-transform: uppercase;">${escritorio?.nome || ''}</h2>
            <p style="font-size: 10px; margin: 5px 0;">${escritorio?.endereco_completo || ''} | CNPJ: ${escritorio?.cnpj || ''}</p>
          </div>
          <div class="document-body">
            ${html}
          </div>
          <div class="document-footer">
            Gerado eletronicamente pelo sistema Z DADOS em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
  }
};
