// Banco de dados TISS local (offline) - Simplificado para demonstração
// Em produção, este seria um arquivo JSON completo com todas as tabelas TISS

export interface TagInfo {
  tag: string;
  name: string;
  description: string;
  example?: string;
  required?: boolean;
}

export interface CBOSInfo {
  code: string;
  name: string;
  description: string;
}

export interface ProcedureInfo {
  code: string;
  name: string;
  description: string;
  compatibleCBOS: string[];
}

export const TISS_TAGS_DATABASE: TagInfo[] = [
  {
    tag: 'ans:numeroGuiaPrestador',
    name: 'Número da Guia do Prestador',
    description: 'Número único atribuído pelo prestador para identificar a guia. Deve conter até 20 caracteres alfanuméricos.',
    example: '2025010100001',
    required: true
  },
  {
    tag: 'ans:numeroGuiaOperadora',
    name: 'Número da Guia da Operadora',
    description: 'Número atribuído pela operadora ao autorizar a guia. Pode ser diferente do número do prestador.',
    required: false
  },
  {
    tag: 'ans:nomeProfissional',
    name: 'Nome do Profissional Executante',
    description: 'Nome completo do profissional que executou o procedimento. Não deve conter nomes de exames ou equipamentos.',
    example: 'Dr. João Silva',
    required: true
  },
  {
    tag: 'ans:CBOS',
    name: 'Código CBO (Classificação Brasileira de Ocupações)',
    description: 'Código de 6 dígitos que identifica a ocupação do profissional executante. Deve ser compatível com o procedimento realizado.',
    example: '225125',
    required: true
  },
  {
    tag: 'ans:codigoProcedimento',
    name: 'Código do Procedimento',
    description: 'Código da tabela TUSS que identifica o procedimento realizado. Formato: 8 dígitos numéricos.',
    example: '40901475',
    required: true
  },
  {
    tag: 'ans:tipoAtendimento',
    name: 'Tipo de Atendimento',
    description: 'Código que indica a modalidade do atendimento. Valores comuns: 01 (Consulta), 02 (Exame), 03 (Cirurgia), etc. O valor padrão mais utilizado é "23".',
    example: '23',
    required: true
  },
  {
    tag: 'ans:indicacaoAcidente',
    name: 'Indicação de Acidente',
    description: 'Indica se o atendimento é decorrente de acidente. Valores: 0 (Não), 1 (Acidente de trabalho), 2 (Acidente de trânsito), 9 (Outros acidentes).',
    example: '0',
    required: true
  },
  {
    tag: 'ans:valorTotal',
    name: 'Valor Total',
    description: 'Valor monetário total do procedimento ou da guia. Formato: número decimal com duas casas (ex: 150.00).',
    example: '150.00',
    required: true
  },
  {
    tag: 'ans:epilogo',
    name: 'Epílogo e Hash MD5',
    description: 'Seção final do XML que contém o hash MD5 para validação da integridade do documento. O hash garante que o conteúdo não foi adulterado.',
    required: true
  },
  {
    tag: 'ans:numeroCarteira',
    name: 'Número da Carteira do Beneficiário',
    description: 'Número da carteirinha do beneficiário/paciente no plano de saúde.',
    required: true
  },
  {
    tag: 'ans:nomeBeneficiario',
    name: 'Nome do Beneficiário',
    description: 'Nome completo do paciente/beneficiário.',
    required: true
  },
  {
    tag: 'ans:dataExecucao',
    name: 'Data de Execução',
    description: 'Data em que o procedimento foi realizado. Formato: AAAA-MM-DD (ISO 8601).',
    example: '2025-01-15',
    required: true
  }
];

export const CBOS_DATABASE: CBOSInfo[] = [
  {
    code: '225125',
    name: 'Médico clínico',
    description: 'Médico de clínica geral'
  },
  {
    code: '225142',
    name: 'Médico cardiologista',
    description: 'Médico especialista em cardiologia'
  },
  {
    code: '225320',
    name: 'Médico radiologista',
    description: 'Médico especialista em radiologia e diagnóstico por imagem'
  }
];

export const PROCEDURES_DATABASE: ProcedureInfo[] = [
  {
    code: '40901475',
    name: 'Doppler arterial de membros',
    description: 'Exame de ultrassom com doppler das artérias dos membros',
    compatibleCBOS: ['225142', '225320']
  },
  {
    code: '20101020',
    name: 'Consulta médica',
    description: 'Consulta médica em consultório',
    compatibleCBOS: ['225125', '225142']
  }
];

export const searchTag = (query: string): TagInfo[] => {
  const lowerQuery = query.toLowerCase();
  return TISS_TAGS_DATABASE.filter(
    tag =>
      tag.tag.toLowerCase().includes(lowerQuery) ||
      tag.name.toLowerCase().includes(lowerQuery) ||
      tag.description.toLowerCase().includes(lowerQuery)
  );
};

export const getTagInfo = (tagName: string): TagInfo | undefined => {
  return TISS_TAGS_DATABASE.find(
    tag => tag.tag.toLowerCase() === tagName.toLowerCase() ||
           tag.tag.toLowerCase().endsWith(':' + tagName.toLowerCase())
  );
};

export const searchCBOS = (query: string): CBOSInfo[] => {
  const lowerQuery = query.toLowerCase();
  return CBOS_DATABASE.filter(
    cbos =>
      cbos.code.includes(query) ||
      cbos.name.toLowerCase().includes(lowerQuery) ||
      cbos.description.toLowerCase().includes(lowerQuery)
  );
};

export const searchProcedure = (query: string): ProcedureInfo[] => {
  const lowerQuery = query.toLowerCase();
  return PROCEDURES_DATABASE.filter(
    proc =>
      proc.code.includes(query) ||
      proc.name.toLowerCase().includes(lowerQuery) ||
      proc.description.toLowerCase().includes(lowerQuery)
  );
};

export const validateCBOSProcedureCompatibility = (
  cbosCode: string,
  procedureCode: string
): { compatible: boolean; warning?: string } => {
  const procedure = PROCEDURES_DATABASE.find(p => p.code === procedureCode);
  const cbos = CBOS_DATABASE.find(c => c.code === cbosCode);

  if (!procedure || !cbos) {
    return { compatible: true }; // Não valida se não encontrar
  }

  const isCompatible = procedure.compatibleCBOS.includes(cbosCode);

  if (!isCompatible) {
    return {
      compatible: false,
      warning: `O CBO '${cbosCode}' (${cbos.name}) pode ser incompatível com o procedimento '${procedureCode}' (${procedure.name})`
    };
  }

  return { compatible: true };
};
