import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import md5 from 'md5';

export interface ProcessingResult {
  content: string;
  changes: number;
  errors?: string[];
}

export interface Guide {
  id: string; // Usará o numeroGuiaPrestador como ID único
  numeroGuiaPrestador: string;
  numeroCarteira: string;
  nomeProfissional: string;
  valorTotalGeral: number;
  dataExecucao: string;
}

// Safe XML parser configuration to prevent XXE and entity expansion attacks
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
  ignoreDeclaration: true, // Changed to true to let builder handle it or assume it's part of content
  preserveOrder: true,    // Changed to true to preserve original XML structure
  parseTagValue: false,
  trimValues: false,
  processEntities: false,
  allowBooleanAttributes: true,
  stopNodes: ["*.CDATA"],
  // Força que 'ans:guiaSP-SADT' e 'guiaSP-SADT' sejam sempre arrays
  isArray: (tagName: string, jPath: string, is  : boolean) => {
    if (tagName === "ans:guiaSP-SADT" || tagName === "guiaSP-SADT") {
      return true;
    }
    return is;
  }
};

const builderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
  format: true,
  indentBy: "  ",
  processEntities: false,
};

export const parseAndBuildXml = (xmlContent: string): string => {
  try {
    const parser = new XMLParser(parserOptions);
    const builder = new XMLBuilder(builderOptions);
    const xmlObj = parser.parse(xmlContent);
    return builder.build(xmlObj);
  } catch (error) {
    console.error("Error parsing and rebuilding XML for formatting:", error);
    return xmlContent; // Return original content on error
  }
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

// Helper para recursivamente encontrar o valor de uma tag, considerando objetos com #text ou valores diretos
const findTagValueRecursive = (obj: any, tagNames: string[]): string | undefined => {
  if (typeof obj !== 'object' || obj === null) return undefined;

  for (const tagName of tagNames) {
    if (obj[tagName] !== undefined) {
      const value = obj[tagName];
      const extractedValue = typeof value === 'object' && '#text' in value ? value['#text'] : String(value);
      return extractedValue;
    }
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] === 'object') {
      const result = findTagValueRecursive(obj[key], tagNames);
      if (result !== undefined) return result;
    }
  }
  return undefined;
};

// Extrai guias do XML de forma robusta
export const extractGuides = (xmlContent: string): Guide[] => {
  const guides: Guide[] = [];
  const parser = new XMLParser(parserOptions);
  
  try {
    const xmlObj = parser.parse(xmlContent);
    const allGuiaSPSADT: any[] = [];

    // Função recursiva para encontrar todas as tags 'ans:guiaSP-SADT' ou 'guiaSP-SADT'
    const findGuiaSPSADTRecursive = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      // Check for both prefixed and non-prefixed versions of the tag
      const guiaSPSADTKeys = ['ans:guiaSP-SADT', 'guiaSP-SADT'];
      for (const key of guiaSPSADTKeys) {
        if (obj[key]) {
          // isArray option ensures obj[key] is always an array here
          allGuiaSPSADT.push(...obj[key]);
        }
      }

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] === 'object') {
          findGuiaSPSADTRecursive(obj[key]);
        }
      }
    };

    findGuiaSPSADTRecursive(xmlObj);

    allGuiaSPSADT.forEach((guideObj: any) => {
      if (!guideObj) return;

      const numeroGuiaPrestador = findTagValueRecursive(guideObj, ['ans:numeroGuiaPrestador', 'numeroGuiaPrestador']) || 'N/A';
      const numeroCarteira = findTagValueRecursive(guideObj, ['ans:numeroCarteira', 'numeroCarteira']) || 'N/A';
      const nomeProfissional = findTagValueRecursive(guideObj, ['ans:nomeProfissional', 'nomeProfissional']) || 'N/A';
      const dataExecucao = findTagValueRecursive(guideObj, ['ans:dataExecucao', 'dataExecucao']) || 'N/A';
      
      let valorTotalGeral = 0;
      let rawValorTotalGeral = findTagValueRecursive(guideObj, ['ans:valorTotalGeral', 'valorTotalGeral']);
      
      // Prioritize ans:valorTotalGeral, then ans:valorTotal
      if (!rawValorTotalGeral) {
        rawValorTotalGeral = findTagValueRecursive(guideObj, ['ans:valorTotal', 'valorTotal']);
      }

      if (rawValorTotalGeral) {
        let sanitizedValue = rawValorTotalGeral.trim();
        // Remove todos os caracteres que não são dígitos, vírgulas ou pontos
        sanitizedValue = sanitizedValue.replace(/[^0-9.,]/g, '');

        const commaCount = (sanitizedValue.match(/,/g) || []).length;
        const dotCount = (sanitizedValue.match(/\./g) || []).length;

        if (commaCount === 1 && dotCount === 0) { // Ex: "123,45" (decimal com vírgula)
            sanitizedValue = sanitizedValue.replace(',', '.');
        } else if (dotCount === 1 && commaCount === 0) { // Ex: "123.45" (decimal com ponto)
            // Já está no formato correto para parseFloat
        } else if (commaCount > 0 && dotCount > 0) { // Ex: "1.234,56" (BR) ou "1,234.56" (US)
            const lastCommaIndex = sanitizedValue.lastIndexOf(',');
            const lastDotIndex = sanitizedValue.lastIndexOf('.');

            if (lastCommaIndex > lastDotIndex) { // Provavelmente formato Brasileiro: "1.234,56"
                sanitizedValue = sanitizedValue.replace(/\./g, ''); // Remove separadores de milhares (pontos)
                sanitizedValue = sanitizedValue.replace(/,/g, '.'); // Troca vírgula decimal por ponto
            } else { // Provavelmente formato Americano: "1,234.56"
                sanitizedValue = sanitizedValue.replace(/,/g, ''); // Remove separadores de milhares (vírgulas)
                // O ponto decimal já está correto
            }
        }
        // Se não houver separadores, ou apenas um ponto/vírgula, parseFloat lida corretamente.

        valorTotalGeral = parseFloat(sanitizedValue) || 0;
      }

      guides.push({
        id: numeroGuiaPrestador, // Usar numeroGuiaPrestador como ID
        numeroGuiaPrestador: numeroGuiaPrestador,
        numeroCarteira: numeroCarteira,
        nomeProfissional: nomeProfissional,
        valorTotalGeral: valorTotalGeral,
        dataExecucao: dataExecucao,
      });
    });
  } catch (error) {
    console.error("Erro ao parsear XML para extração de guias:", error);
    // Fallback para regex se o parsing falhar, menos confiável mas evita quebras
    const regexGuides: Guide[] = [];
    const guideRegex = /<ans:guiaSP-SADT>([\s\S]*?)<\/ans:guiaSP-SADT>/g;
    let match;
    while ((match = guideRegex.exec(xmlContent)) !== null) {
      const guideContent = match[1];
      const numeroGuiaPrestador = (guideContent.match(/<ans:numeroGuiaPrestador>(.*?)<\/ans:numeroGuiaPrestador>/) || [])[1] || 'N/A';
      const numeroCarteira = (guideContent.match(/<ans:numeroCarteira>(.*?)<\/ans:numeroCarteira>/) || [])[1] || 'N/A';
      const nomeProfissional = (guideContent.match(/<ans:nomeProfissional>(.*?)<\/ans:nomeProfissional>/) || [])[1] || 'N/A';
      
      let rawValorTotalGeral = (guideContent.match(/<ans:valorTotalGeral>(.*?)<\/ans:valorTotalGeral>/) || [])[1] || 
                               (guideContent.match(/<valorTotalGeral>(.*?)<\/valorTotalGeral>/) || [])[1];
      
      if (!rawValorTotalGeral) {
        rawValorTotalGeral = (guideContent.match(/<ans:valorTotal>(.*?)<\/ans:valorTotal>/) || [])[1] ||
                             (guideContent.match(/<valorTotal>(.*?)<\/valorTotal>/) || [])[1];
      }
      
      const dataExecucao = (guideContent.match(/<ans:dataExecucao>(.*?)<\/ans:dataExecucao>/) || [])[1] || 'N/A';

      let valorTotalGeral = 0;
      if (rawValorTotalGeral) {
        let sanitizedValue = rawValorTotalGeral.trim();
        sanitizedValue = sanitizedValue.replace(/[^0-9.,]/g, '');

        const commaCount = (sanitizedValue.match(/,/g) || []).length;
        const dotCount = (sanitizedValue.match(/\./g) || []).length;

        if (commaCount === 1 && dotCount === 0) {
            sanitizedValue = sanitizedValue.replace(',', '.');
        } else if (dotCount === 1 && commaCount === 0) {
            // Keep as is
        } else if (commaCount > 0 && dotCount > 0) {
            const lastCommaIndex = sanitizedValue.lastIndexOf(',');
            const lastDotIndex = sanitizedValue.lastIndexOf('.');

            if (lastCommaIndex > lastDotIndex) {
                sanitizedValue = sanitizedValue.replace(/\./g, '');
                sanitizedValue = sanitizedValue.replace(/,/g, '.');
            } else {
                sanitizedValue = sanitizedValue.replace(/,/g, '');
            }
        }
        valorTotalGeral = parseFloat(sanitizedValue) || 0;
      }

      regexGuides.push({
        id: numeroGuiaPrestador,
        numeroGuiaPrestador: numeroGuiaPrestador,
        numeroCarteira: numeroCarteira,
        nomeProfissional: nomeProfissional,
        valorTotalGeral: valorTotalGeral,
        dataExecucao: dataExecucao,
      });
    }
    return regexGuides;
  }

  return guides;
};

// Exclui uma guia do XML usando parsing e reconstrução
export const deleteGuide = (xmlContent: string, guideId: string): string => {
  try {
    const parser = new XMLParser(parserOptions);
    const builder = new XMLBuilder(builderOptions);
    let xmlObj = parser.parse(xmlContent);

    let guideFoundAndDeleted = false;

    // Função recursiva para encontrar e remover a guia
    const findAndDeleteRecursive = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      // Check for both prefixed and non-prefixed versions of the tag
      const guiaSPSADTKeys = ['ans:guiaSP-SADT', 'guiaSP-SADT'];
      for (const key of guiaSPSADTKeys) {
        if (obj[key] && Array.isArray(obj[key])) { // isArray ensures obj[key] is always an array
          const initialLength = obj[key].length;
          obj[key] = obj[key].filter((guideObj: any) => {
            const currentGuideNumero = findTagValueRecursive(guideObj, ['ans:numeroGuiaPrestador', 'numeroGuiaPrestador']);
            return currentGuideNumero !== guideId;
          });
          if (obj[key].length < initialLength) {
            guideFoundAndDeleted = true;
            if (obj[key].length === 0) {
              delete obj[key]; // Remove a propriedade se o array ficar vazio
            }
            return; // Stop recursion in this branch after deletion
          }
        }
      }

      // Continue recursive search in child properties
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] === 'object') {
          findAndDeleteRecursive(obj[key]);
          if (guideFoundAndDeleted) return; // Stop if guide already found and deleted
        }
      }
    };

    findAndDeleteRecursive(xmlObj);

    if (guideFoundAndDeleted) {
      return builder.build(xmlObj);
    } else {
      console.warn(`Guia com ID ${guideId} não encontrada para exclusão.`);
      return xmlContent; // Retorna o conteúdo original se a guia não for encontrada
    }

  } catch (error) {
    console.error("Erro ao excluir guia usando parsing XML:", error);
    // Fallback para regex se o parsing falhar
    const guideRegex = new RegExp(`<ans:guiaSP-SADT>[\\s\\S]*?<ans:numeroGuiaPrestador>${guideId}<\\/ans:numeroGuiaPrestador>[\\s\\S]*?<\\/ans:guiaSP-SADT>`, 'g');
    return xmlContent.replace(guideRegex, '');
  }
};

// Calcula o hash MD5 do conteúdo (excluindo o epílogo)
export const calculateHash = (xmlContent: string): string => {
  // Remove epílogo existente antes de calcular o hash
  const contentWithoutEpilogo = xmlContent.replace(/<ans:epilogo>[\s\S]*?<\/ans:epilogo>/g, '');
  return md5(contentWithoutEpilogo);
};

// Adiciona o epílogo com o hash ao XML
export const addEpilogo = (xmlContent: string): string => {
  // Remove epílogo existente para evitar duplicatas
  let content = xmlContent.replace(/<ans:epilogo>[\s\S]*?<\/ans:epilogo>/g, '');
  
  // Calcula o hash do conteúdo atualizado
  const hash = calculateHash(content);
  
  // Encontra a tag de fechamento de prestadorParaOperadora ou tissLoteGuias
  let closingTag = '</ans:prestadorParaOperadora>';
  let insertIndex = content.lastIndexOf(closingTag);

  if (insertIndex === -1) {
    closingTag = '</ans:tissLoteGuias>';
    insertIndex = content.lastIndexOf(closingTag);
  }
  
  if (insertIndex === -1) return content; // Se nenhuma tag de fechamento adequada for encontrada, retorna o conteúdo original
  
  const epilogo = `  <ans:epilogo>\n    <ans:hash>${hash}</ans:hash>\n  </ans:epilogo>\n`;
  
  return content.slice(0, insertIndex) + epilogo + content.slice(insertIndex);
};

// Valida o hash
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

// Encontra campos vazios
export const findEmptyFields = (xmlContent: string): string => {
  const emptyTags: string[] = [];
  
  // Verifica tags auto-fechadas ou vazias
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

// Valida dados profissionais
export const validateProfessionalData = (xmlContent: string): string[] => {
  const results: string[] = [];
  const guides = extractGuides(xmlContent);
  
  guides.forEach(guide => {
    const guideNumber = guide.numeroGuiaPrestador;
    
    // Verifica nomes de profissionais suspeitos (procedimentos em vez de nomes)
    const suspiciousNames = [
      'ECOCARDIOGRAMA', 'ULTRASSOM', 'RAIO-X', 'TOMOGRAFIA', 'RESSONANCIA',
      'LABORATORIO', 'EXAME', 'CONSULTA', 'PROCEDIMENTO'
    ];
    
    const upperName = guide.nomeProfissional.toUpperCase();
    const isSuspicious = suspiciousNames.some(term => upperName.includes(term));
    
    if (isSuspicious) {
      results.push(`⚠️ ALERTA (Guia ${guideNumber}): Nome de profissional ('${guide.nomeProfissional}') parece ser um procedimento, não um nome válido.`);
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

export const extractLotNumber = (xmlContent: string): string | undefined => {
  const parser = new XMLParser(parserOptions);
  try {
    const xmlObj = parser.parse(xmlContent);
    // Common paths for numeroLote
    const lotNumber = findTagValueRecursive(xmlObj, [
      'ans:cabecalho.ans:numeroLote', // Specific path
      'ans:numeroLote', // Direct child of root or other high-level tag
      'numeroLote' // Without namespace
    ]);
    return lotNumber;
  } catch (error) {
    console.error("Erro ao extrair número do lote:", error);
    // Fallback to regex if parsing fails
    const lotNumberMatch = xmlContent.match(/<ans:numeroLote>(.*?)<\/ans:numeroLote>/) ||
                           xmlContent.match(/<numeroLote>(.*?)<\/numeroLote>/);
    return lotNumberMatch ? lotNumberMatch[1] : undefined;
  }
};