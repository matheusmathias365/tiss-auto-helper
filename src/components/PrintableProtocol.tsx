import { Guide } from "@/utils/xmlProcessor";

interface PrintableProtocolProps {
  fileName: string;
  guides: Guide[];
  totalValue: number;
  faturistaName: string; // Adicionado o nome da faturista
}

export const generateProtocolHTML = ({ fileName, guides, totalValue, faturistaName }: PrintableProtocolProps): string => {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Protocolo de Conferência - ${fileName}</title>
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .logo {
          max-width: 200px;
          margin-bottom: 15px;
        }
        
        h1 {
          color: #2563eb;
          margin: 10px 0;
          font-size: 24px;
        }
        
        .info-section {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          padding: 5px 0;
        }
        
        .info-label {
          font-weight: bold;
          color: #475569;
        }
        
        .info-value {
          color: #1e293b;
        }
        
        .signature-section {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .signature-line {
          border-bottom: 1px solid #cbd5e1;
          margin: 30px 0 10px 0;
          padding-bottom: 5px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 12px;
        }
        
        th {
          background: #2563eb;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
        }
        
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        tr:hover {
          background: #f8fafc;
        }
        
        .total-section {
          background: #dcfce7;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
          text-align: right;
        }
        
        .total-label {
          font-size: 18px;
          font-weight: bold;
          color: #15803d;
        }
        
        .total-value {
          font-size: 28px;
          font-weight: bold;
          color: #16a34a;
          margin-top: 5px;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 11px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/upstream-logo.png" alt="Upstream Logo" class="logo">
        <h1>Relatório de Conferência de Lote</h1>
      </div>
      
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Nome do Lote:</span>
          <span class="info-value">${fileName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Quantidade de Guias:</span>
          <span class="info-value">${guides.length}</span>
        </div>
      </div>
      
      <div class="signature-section">
        <div class="info-row">
          <span class="info-label">Nome do Faturista:</span>
          <span class="info-value">${faturistaName}</span> <!-- Exibindo o nome da faturista -->
        </div>
        <div class="info-row">
          <span class="info-label">Data da Impressão:</span>
          <span class="info-value">${currentDate}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Nº Guia</th>
            <th>Nº Carteirinha</th>
            <th>Profissional</th>
            <th style="text-align: right;">Valor (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${guides.map(guide => `
            <tr>
              <td>${guide.numeroGuiaPrestador}</td>
              <td>${guide.numeroCarteira}</td>
              <td>${guide.nomeProfissional}</td>
              <td style="text-align: right;">${guide.valorTotalGeral.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-label">VALOR TOTAL DO LOTE:</div>
        <div class="total-value">R$ ${totalValue.toFixed(2)}</div>
      </div>
      
      <div class="footer">
        <p>Assistente TISS Inteligente (Upstream)</p>
        <p>Documento gerado automaticamente em ${currentDate}</p>
        <p>Processamento 100% local - Sua privacidade é garantida</p>
      </div>
      
      <script>
        // Auto-print on load
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;
};

export const openPrintableProtocol = (props: PrintableProtocolProps) => {
  const html = generateProtocolHTML(props);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert('Por favor, permita pop-ups para imprimir o protocolo de conferência.');
  }
};