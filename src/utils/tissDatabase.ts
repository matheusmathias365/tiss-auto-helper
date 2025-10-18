// Banco de dados TISS local (offline) - Simplificado para demonstração
// Em produção, este seria um arquivo JSON completo com todas as tabelas TISS

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
