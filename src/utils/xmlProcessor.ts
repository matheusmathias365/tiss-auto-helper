import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import md5 from 'md5';

export interface ProcessingResult {
  content: string;
  changes: number;
  errors?: string[];
}

export interface Guide {
  id: string;
  numeroGuiaPrestador: string;
  numeroCarteira: string;
  nomeProfissional: string;
  valorTotalGeral: number;
  dataExecucao: string;
  xmlNode: any;
}

// Safe XML parser configuration to prevent XXE and entity expansion attacks
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  ignoreDeclaration: false,
  preserveOrder: false,
  parseTagValue: false,
  trimValues: true,
  processEntities: false, // Critical: prevents entity expansion attacks
  allowBooleanAttributes: true,
  stopNodes: ["*.CDATA"], // Don't parse CDATA content
};

const builderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  format: true,
  indentBy: "  ",
  processEntities: false,
};

export const fixXMLStructure = (xmlContent: string): ProcessingResult => {
  let content = xmlContent;
  let changes = 0;
  
  // Fix duplicate namespace prefixes like ans:<ans:tag> to <ans:tag>
  const duplicatePrefixRegex = /ans:<ans:/g;
  const matches = content.match(duplicatePrefixRegex);
  if (matches) {
    changes = matches.length;
    content = content.replace(duplicatePrefixRegex, '<ans:');
  }
  
  // Fix closing tags with duplicate prefixes
  const duplicateClosingRegex = /ans:<\/ans:/g;
  const closingMatches = content.match(duplicateClosingRegex);
  if (closingMatches) {
    changes += closingMatches.length;
    content = content.replace(duplicateClosingRegex, '</ans:');
  }

  return {
    content,
    changes,
  };
};

export const standardizeTipoAtendimento = (xmlContent: string): ProcessingResult => {
  try {
    const parser = new XMLParser(parserOptions);
    const builder = new XMLBuilder(builderOptions);
    
    const xmlObj = parser.parse(xmlContent);
    let changes = 0;

    // Recursively find and replace tipoAtendimento values
    const replaceInObject = (obj: any): void => {
      if (typeof obj !== 'object' || obj === null) return;
      
      for (const key in obj) {
        if (key === 'ans:tipoAtendimento' || key === 'tipoAtendimento') {
          if (typeof obj[key] === 'object' && '#text' in obj[key]) {
            if (obj[key]['#text'] !== '23') {
              obj[key]['#text'] = '23';
              changes++;
            }
          } else if (obj[key] !== 23 && obj[key] !== '23') {
            obj[key] = '23';
            changes++;
          }
        } else if (typeof obj[key] === 'object') {
          replaceInObject(obj[key]);
        }
      }
    };

    replaceInObject(xmlObj);
    
    const content = builder.build(xmlObj);
    return { content, changes };
  } catch (error) {
    // Fallback to regex if parsing fails
    console.warn('XML parsing failed, using fallback method');
    let content = xmlContent;
    let changes = 0;
    
    const tipoAtendimentoRegex = /<ans:tipoAtendimento>.*?<\/ans:tipoAtendimento>/g;
    const matches = content.match(tipoAtendimentoRegex);
    
    if (matches) {
      changes = matches.length;
      content = content.replace(
        tipoAtendimentoRegex,
        '<ans:tipoAtendimento>23</ans:tipoAtendimento>'
      );
    }

    return { content, changes };
  }
};

export const standardizeCBOS = (xmlContent: string): ProcessingResult => {
  try {
    const parser = new XMLParser(parserOptions);
    const builder = new XMLBuilder(builderOptions);
    
    const xmlObj = parser.parse(xmlContent);
    let changes = 0;

    // Recursively find and replace CBOS values
    const replaceInObject = (obj: any): void => {
      if (typeof obj !== 'object' || obj === null) return;
      
      for (const key in obj) {
        if (key === 'ans:CBOS' || key === 'CBOS') {
          if (typeof obj[key] === 'object' && '#text' in obj[key]) {
            if (obj[key]['#text'] !== '225125') {
              obj[key]['#text'] = '225125';
              changes++;
            }
          } else if (obj[key] !== 225125 && obj[key] !== '225125') {
            obj[key] = '225125';
            changes++;
          }
        } else if (typeof obj[key] === 'object') {
          replaceInObject(obj[key]);
        }
      }
    };

    replaceInObject(xmlObj);
    
    const content = builder.build(xmlObj);
    return { content, changes };
  } catch (error) {
    // Fallback to regex if parsing fails
    console.warn('XML parsing failed, using fallback method');
    let content = xmlContent;
    let changes = 0;
    
    const cbosRegex = /<ans:CBOS>.*?<\/ans:CBOS>/g;
    const matches = content.match(cbosRegex);
    
    if (matches) {
      changes = matches.length;
      content = content.replace(
        cbosRegex,
        '<ans:CBOS>225125</ans:CBOS>'
      );
    }

    return { content, changes };
  }
};

// Extract guides from XML
export const extractGuides = (xmlContent: string): Guide[] => {
  const guides: Guide[] = [];
  const guideRegex = /<ans:guiaSP-SADT>([\s\S]*?)<\/ans:guiaSP-SADT>/g;
  let match;
  let index = 0;

  while ((match = guideRegex.exec(xmlContent)) !== null) {
    const guideContent = match[1];
    
    const numeroGuia = (guideContent.match(/<ans:numeroGuiaPrestador>(.*?)<\/ans:numeroGuiaPrestador>/) || [])[1] || 'N/A';
    const numeroCarteira = (guideContent.match(/<ans:numeroCarteira>(.*?)<\/ans:numeroCarteira>/) || [])[1] || 'N/A';
    const nomeProfissional = (guideContent.match(/<ans:nomeProfissional>(.*?)<\/ans:nomeProfissional>/) || [])[1] || 'N/A';
    const valorTotal = (guideContent.match(/<ans:valorTotalGeral>(.*?)<\/ans:valorTotalGeral>/) || [])[1] || '0.00';
    const dataExecucao = (guideContent.match(/<ans:dataExecucao>(.*?)<\/ans:dataExecucao>/) || [])[1] || 'N/A';

    guides.push({
      id: `guide-${index}`,
      numeroGuiaPrestador: numeroGuia,
      numeroCarteira: numeroCarteira,
      nomeProfissional: nomeProfissional,
      valorTotalGeral: parseFloat(valorTotal) || 0,
      dataExecucao: dataExecucao,
      xmlNode: match[0],
    });
    
    index++;
  }

  return guides;
};

// Delete a guide from XML
export const deleteGuide = (xmlContent: string, guideId: string, guides: Guide[]): string => {
  const guide = guides.find(g => g.id === guideId);
  if (!guide) return xmlContent;
  
  return xmlContent.replace(guide.xmlNode, '');
};

// Calculate MD5 hash of content (excluding epilogo)
export const calculateHash = (xmlContent: string): string => {
  // Remove epilogo if exists
  const contentWithoutEpilogo = xmlContent.replace(/<ans:epilogo>[\s\S]*?<\/ans:epilogo>/g, '');
  return md5(contentWithoutEpilogo);
};

// Add epilogo with hash to XML
export const addEpilogo = (xmlContent: string): string => {
  // Remove existing epilogo
  let content = xmlContent.replace(/<ans:epilogo>[\s\S]*?<\/ans:epilogo>/g, '');
  
  // Calculate hash
  const hash = calculateHash(content);
  
  // Find the closing tag of prestadorParaOperadora
  const closingTag = '</ans:prestadorParaOperadora>';
  const insertIndex = content.lastIndexOf(closingTag);
  
  if (insertIndex === -1) return content;
  
  const epilogo = `  <ans:epilogo>\n    <ans:hash>${hash}</ans:hash>\n  </ans:epilogo>\n`;
  
  return content.slice(0, insertIndex) + epilogo + content.slice(insertIndex);
};

// Validate hash
export const validateHash = (xmlContent: string): string => {
  const hashMatch = xmlContent.match(/<ans:hash>(.*?)<\/ans:hash>/);
  
  if (!hashMatch) {
    return "⚠️ ALERTA: Tag <ans:hash> não encontrada no documento.";
  }
  
  const documentHash = hashMatch[1];
  const calculatedHash = calculateHash(xmlContent);
  
  if (documentHash === calculatedHash) {
    return "✅ Hash Válido: O hash MD5 do documento está correto.";
  } else {
    return `❌ ERRO: Hash Inválido! Hash no documento: ${documentHash} | Hash calculado: ${calculatedHash}`;
  }
};

// Find empty fields
export const findEmptyFields = (xmlContent: string): string => {
  const emptyTags: string[] = [];
  
  // Check for self-closing tags or empty tags
  const cbosEmpty = xmlContent.match(/<ans:CBOS\s*\/>/g) || xmlContent.match(/<ans:CBOS><\/ans:CBOS>/g);
  if (cbosEmpty && cbosEmpty.length > 0) {
    emptyTags.push(`<ans:CBOS /> (${cbosEmpty.length} ocorrências)`);
  }
  
  const tipoEmpty = xmlContent.match(/<ans:tipoAtendimento\s*\/>/g) || xmlContent.match(/<ans:tipoAtendimento><\/ans:tipoAtendimento>/g);
  if (tipoEmpty && tipoEmpty.length > 0) {
    emptyTags.push(`<ans:tipoAtendimento /> (${tipoEmpty.length} ocorrências)`);
  }
  
  const crmEmpty = xmlContent.match(/<ans:codigoPrestadorNaOperadora\s*\/>/g) || xmlContent.match(/<ans:codigoPrestadorNaOperadora><\/ans:codigoPrestadorNaOperadora>/g);
  if (crmEmpty && crmEmpty.length > 0) {
    emptyTags.push(`<ans:codigoPrestadorNaOperadora /> (${crmEmpty.length} ocorrências)`);
  }
  
  if (emptyTags.length === 0) {
    return "✅ Campos OK: Não foram encontradas tags críticas vazias.";
  }
  
  return `⚠️ ALERTA: Encontradas tags vazias: ${emptyTags.join(', ')}`;
};

// Validate professional data
export const validateProfessionalData = (xmlContent: string): string[] => {
  const results: string[] = [];
  const guides = extractGuides(xmlContent);
  
  guides.forEach(guide => {
    const guideContent = guide.xmlNode;
    const guideNumber = guide.numeroGuiaPrestador;
    
    // Check for empty CBOS with professional name
    const cbosEmpty = guideContent.match(/<ans:CBOS\s*\/>/g) || guideContent.match(/<ans:CBOS><\/ans:CBOS>/g);
    if (cbosEmpty && guide.nomeProfissional !== 'N/A') {
      results.push(`⚠️ ALERTA (Guia ${guideNumber}): Nome de profissional ('${guide.nomeProfissional}') com <ans:CBOS /> vazio.`);
    }
    
    // Check for suspicious professional names (procedures instead of names)
    const suspiciousNames = [
      'ECOCARDIOGRAMA', 'ULTRASSOM', 'RAIO-X', 'TOMOGRAFIA', 'RESSONANCIA',
      'LABORATORIO', 'EXAME', 'CONSULTA', 'PROCEDIMENTO'
    ];
    
    const upperName = guide.nomeProfissional.toUpperCase();
    const isSuspicious = suspiciousNames.some(term => upperName.includes(term));
    
    if (isSuspicious) {
      results.push(`⚠️ ALERTA (Guia ${guideNumber}): Nome de profissional ('${guide.nomeProfissional}') parece ser um procedimento, não um nome válido.`);
    }
    
    // Check for invalid CRM (very short numbers)
    const crmMatch = guideContent.match(/<ans:codigoPrestadorNaOperadora>(\d+)<\/ans:codigoPrestadorNaOperadora>/);
    if (crmMatch && crmMatch[1].length < 4) {
      results.push(`⚠️ ALERTA (Guia ${guideNumber}): CRM ('${crmMatch[1]}') parece inválido (muito curto).`);
    }
  });
  
  if (results.length === 0) {
    results.push("✅ Dados Profissionais OK: Não foram encontrados dados suspeitos.");
  }
  
  return results;
};

export const downloadXML = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.replace('.xml', '_corrigido.xml');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
