import type { Empresa } from '../types';

const HEADERS: Record<string, string> = {
    cnpj: 'CNPJ',
    razao_social: 'Razão Social',
    nome_fantasia: 'Nome Fantasia',
    cnae_principal: 'CNAE Principal',
    status_ativa: 'Situação',
    uf: 'UF',
    municipio: 'Município',
    bairro: 'Bairro',
    logradouro: 'Logradouro',
    numero: 'Número',
    cep: 'CEP',
    telefone_real: 'Telefone',
    email_real: 'E-mail',
    site: 'Site',
    capital_social: 'Capital Social',
    data_abertura: 'Data de Abertura',
};

function formatCNPJ(cnpj: string): string {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatValue(key: string, value: unknown): string {
    if (value === null || value === undefined) return '';
    if (key === 'cnpj') return formatCNPJ(String(value));
    if (key === 'status_ativa') return value ? 'ATIVA' : 'INATIVA';
    if (key === 'capital_social') {
        return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    if (key === 'data_abertura') {
        try {
            return new Date(String(value)).toLocaleDateString('pt-BR');
        } catch { return String(value); }
    }
    return String(value);
}

function buildRows(data: Empresa[]): { headers: string[]; keys: string[]; rows: string[][] } {
    const keys = Object.keys(HEADERS);
    const headers = Object.values(HEADERS);
    const rows = data.map(emp =>
        keys.map(key => formatValue(key, (emp as unknown as Record<string, unknown>)[key]))
    );
    return { headers, keys, rows };
}

// Escape CSV cell: wrap in quotes if contains separator, quote, or newline
function escapeCSV(cell: string): string {
    if (cell.includes(';') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
}

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

export function exportToCSV(data: Empresa[], filename = 'z-dados-leads') {
    const { headers, rows } = buildRows(data);

    // BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF';
    const csvContent = BOM + [
        headers.map(escapeCSV).join(';'),
        ...rows.map(row => row.map(escapeCSV).join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${filename}.csv`);
}

export function exportToExcel(data: Empresa[], filename = 'z-dados-leads') {
    const { headers, rows } = buildRows(data);

    const tableRows = rows.map(row =>
        '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>'
    ).join('');

    const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:spreadsheet"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"></head>
        <body>
            <table border="1">
                <thead>
                    <tr>${headers.map(h => `<th style="background:#4F46E5;color:white;font-weight:bold;padding:8px">${h}</th>`).join('')}</tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    triggerDownload(blob, `${filename}.xls`);
}
