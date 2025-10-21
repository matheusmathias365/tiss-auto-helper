import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import CryptoJS from 'crypto-js'; // Importando CryptoJS
import { TISS_TAGS_DATABASE, validateCBOSProcedureCompatibility } from './tissDatabase'; // Importar o banco de dados TISS

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

// Standardized parser options for easier object manipulation
const commonParserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  ignoreDeclaration: true, // Ignore declaration for internal processing
  preserveOrder: false,    // KEY CHANGE: Use simpler object structure
  parseTagValue: false,
  trimValues: true,        // Trim values during parsing
  processEntities: false,
  allowBooleanAttributes: true,
  // Força que 'ans:guiaSP-SADT' e 'guiaSP-SADT' sejam sempre arrays para facilitar a manipulação
  isArray: (tagName: string, jPath: string, is  : boolean) => {
    if (tagName === "ans:guiaSP-SADT" || tagName === "guiaSP-SADT") {
      return true;
    }
    return is;
  }
};

const defaultBuilderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  format: false, // Default to no formatting for TISS validation
  indentBy: "  ",
  processEntities: false,
  declaration: {
    include: true,
    attributes: {
      version: "1.0",
      encoding: "ISO-8859-1"
    }
  },
};

// Helper function to reliably get the 'ans:mensagemTISS' content object
const getTissRootContent = (parsed: any): any => {
  if (parsed && typeof parsed === 'object' && parsed['ans:mensagemTISS']) {
    return parsed['ans:mensagemTISS'];
  }
  // If parsed is an array (e.g., multiple roots, though unlikely for valid TISS)
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (item && typeof item === 'object' && item['ans:mensagemTISS']) {
        return item['ans:mensagemTISS'];
      }
    }
  }
  // Search deeper if wrapped in another root (e.g., <root><ans:mensagemTISS>...</ans:mensagemTISS></root>)
  if (parsed && typeof parsed === 'object') {
    for (const key in parsed) {
      if (Object.prototype.hasOwnProperty.call(parsed, key) && typeof parsed[key] === 'object' && parsed[key] !== null) {
        if (parsed[key]['ans:mensagemTISS']) {
          return parsed[key]['ans:mensagemTISS'];
        }
      }
    }
  }
  return null; // No ans:mensagemTISS found
};


export const rebuildXml = (xmlContent: string): string => {
  try {
    const parser = new XMLParser(commonParserOptions);
    const builder = new XMLBuilder(defaultBuilderOptions);
    let parsedObject = parser.parse(xmlContent);

    let tissRootContent = getTissRootContent(parsedObject);

    if (!tissRootContent) {
      console.error("Could not find 'ans:mensagemTISS' content after parsing for rebuilding. Building with original parsed structure.");
      // If we can't find the TISS message content, we can't add TISS-specific attributes.
      // The declaration should still be added by the builder if parsedObject is a single root.
      return builder.build(parsedObject);
    }

    // Apply namespace attributes directly to the TISS root content
    tissRootContent['@_xmlns:xsi'] = "http://www.w3.org/2001/XMLSchema-instance";
    tissRootContent['@_xmlns:ans'] = "http://www.ans.gov.br/padroes/tiss/schemas";
    tissRootContent['@_xsi:schemaLocation'] = "http://www.ans.gov.br/padroes/tiss/schemas tissV4_01_00.xsd";
    
    // Always build with "ans:mensagemTISS" as the explicit root key for the builder
    const objectToBuild = { "ans:mensagemTISS": tissRootContent };

    return builder.build(objectToBuild);
  } catch (error) {
    console.error("Error rebuilding XML:", error);
    return xmlContent;
  }
};

export const formatXmlContent = (xmlContent: string): string => {
  try {
    const parser = new XMLParser(commonParserOptions);
    const formattedBuilder = new XMLBuilder({ ...defaultBuilderOptions, format: true, indentBy: "  " });
    let parsedObject = parser.parse(xmlContent);

    let tissRootContent = getTissRootContent(parsedObject);

    if (!tissRootContent) {
      console.error("Could not find 'ans:mensagemTISS' content after parsing for formatting. Building with original parsed structure.");
      return formattedBuilder.build(parsedObject);
    }

    // Ensure namespace attributes are present on the TISS root content
    tissRootContent['@_xmlns:xsi'] = "http://www.w3.org/2001/XMLSchema-instance";
    tissRootContent['@_xmlns:ans'] = "http://www.ans.gov.br/padroes/tiss/schemas";
    tissRootContent['@_xsi:schemaLocation'] = "http://www.ans.gov.br/padroes/tiss/schemas tissV4_01_00.xsd";
    
    // Always build with "ans:mensagemTISS" as the explicit root key for the builder
    const objectToBuild = { "ans:mensagemTISS": tissRootContent };

    return formattedBuilder.build(objectToBuild);
  } catch (error) {
    console.error("Error formatting XML content:", error);
    return xmlContent;
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
  let content = xmlContent;
  let changes = 0;
  
  // Use regex para substituição direta, incluindo tags vazias ou com 'NULL'
  const tipoAtendimentoRegex = /<ans:tipoAtendimento>(?:.*?|NULL)<\/ans:tipoAtendimento>|<ans:tipoAtendimento\s*\/>/g;
  
  // Encontra todas as ocorrências para contar as mudanças
  const matches = [...content.matchAll(tipoAtendimentoRegex)];
  
  if (matches.length > 0) {
    // Filtra as ocorrências que já são '23' para contar apenas as mudanças reais
    const actualChanges = matches.filter(match => match[0] !== '<ans:tipoAtendimento>23</ans:tipoAtendimento>').length;
    if (actualChanges > 0) {
      changes = actualChanges;
      content = content.replace(
        tipoAtendimentoRegex,
        '<ans:tipoAtendimento>23</ans:tipoAtendimento>'
      );
    }
  }

  return { content, changes };
};

export const standardizeCBOS = (xmlContent: string): ProcessingResult => {
  let content = xmlContent;
  let changes = 0;
  
  // Step 1: Remove CBOS tags that are empty or contain 'NULL'
  // This regex captures the entire tag, including self-closing ones
  const cbosEmptyOrNullRegex = /<ans:CBOS>(?:\s*|NULL)<\/ans:CBOS>|<ans:CBOS\s*\/>/g;
  
  // Use a temporary variable to track content for this step
  let contentAfterRemoval = content;
  let match;
  while ((match = cbosEmptyOrNullRegex.exec(contentAfterRemoval)) !== null) {
    changes++;
    // Replace the matched tag with an empty string to remove it
    content = content.replace(match[0], ''); 
  }
  
  // Step 2: Standardize remaining CBOS tags that are not '225125'
  // This regex looks for <ans:CBOS>...</ans:CBOS> where content is NOT '225125'
  const cbosNonStandardRegex = /(<ans:CBOS>)(?!225125)(.*?)(<\/ans:CBOS>)/g;
  
  // Reset regex lastIndex for new pass
  cbosNonStandardRegex.lastIndex = 0; 
  while ((match = cbosNonStandardRegex.exec(content)) !== null) {
    // Only count changes if the value is actually different from '225125'
    if (match[2].trim() !== '225125') {
      changes++;
      // Replace the entire matched tag with the standardized version
      content = content.replace(match[0], '<ans:CBOS>225125</ans:CBOS>');
    }
  }

  return { content, changes };
};

export const cleanNullValues = (xmlContent: string): string => {
  // Regex para encontrar qualquer conteúdo de tag que seja exatamente 'NULL' (case-insensitive)
  // Isso substituirá <tag>NULL</tag> por <tag></tag>
  let content = xmlContent;
  let changes = 0;
  const nullValueRegex = /(<[a-zA-Z:_][\w:.-]*>)\s*NULL\s*(<\/[a-zA-Z:_][\w:.-]*>)/gi;
  
  // Contar as mudanças antes de substituir
  while (nullValueRegex.exec(content) !== null) {
    changes++;
  }
  // Reset lastIndex for replacement
  nullValueRegex.lastIndex = 0;
  content = content.replace(nullValueRegex, '$1$2'); // Substitui por conteúdo vazio

  console.log(`Cleaned ${changes} 'NULL' values.`);
  return content;
};


// Helper para encontrar o valor de uma tag em um objeto XML parseado com preserveOrder: false, recursivamente
const findNestedTagValue = (obj: any, tagNames: string[]): string | undefined => {
  if (typeof obj !== 'object' || obj === null) return undefined;

  for (const tagName of tagNames) {
    // Check for direct property or property with '#text'
    if (obj[tagName] !== undefined) {
      const value = obj[tagName];
      return typeof value === 'object' && '#text' in value ? String(value['#text']) : String(value);
    }
  }

  // Recursively search in nested objects and arrays
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          for (const item of obj[key]) {
            const result = findNestedTagValue(item, tagNames);
            if (result !== undefined) return result;
          }
        } else {
          const result = findNestedTagValue(obj[key], tagNames);
          if (result !== undefined) return result;
        }
      }
    }
  }
  return undefined;
};

// Helper para verificar a existência de uma tag em um objeto XML parseado, recursivamente
const tagExists = (obj: any, tagNames: string[]): boolean => {
  if (typeof obj !== 'object' || obj === null) return false;

  for (const tagName of tagNames) {
    if (obj[tagName] !== undefined) {
      return true;
    }
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          for (const item of obj[key]) {
            if (tagExists(item, tagNames)) return true;
          }
        } else {
          if (tagExists(obj[key], tagNames)) return true;
        }
      }
    }
  }
  return false;
};

// Helper para recursivamente encontrar todos os objetos que representam uma guia (ans:guiaSP-SADT ou guiaSP-SADT)
const deepFindGuideObjects = (obj: any): any[] => {
  let guideObjects: any[] = [];

  if (typeof obj !== 'object' || obj === null) {
    return guideObjects;
  }

  const guideTagNames = ['ans:guiaSP-SADT', 'guiaSP-SADT'];
  for (const tagName of guideTagNames) {
    if (obj[tagName]) {
      if (Array.isArray(obj[tagName])) {
        guideObjects.push(...obj[tagName]);
      } else if (typeof obj[tagName] === 'object') {
        guideObjects.push(obj[tagName]);
      }
    }
  }

  // Recursivamente buscar em objetos e arrays aninhados
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] === 'object' && obj[key] !== null) {
      if (Array.isArray(obj[key])) {
        for (const item of obj[key]) {
          guideObjects.push(...deepFindGuideObjects(item));
        }
      } else {
        guideObjects.push(...deepFindGuideObjects(obj[key]));
      }
    }
  }
  return guideObjects;
};

// Extrai guias do XML de forma robusta
export const extractGuides = (xmlContent: string): Guide[] => {
  const guides: Guide[] = [];
  const parser = new XMLParser(commonParserOptions); // Use commonParserOptions
  
  try {
    const xmlObj = parser.parse(xmlContent);
    const guiaSPSADTNodes = deepFindGuideObjects(xmlObj);
    console.log("extractGuides (Parser): Raw guide objects found:", guiaSPSADTNodes.length);

    if (guiaSPSADTNodes.length === 0) {
      console.warn("extractGuides (Parser): Nenhuma tag 'ans:guiaSP-SADT' ou 'guiaSP-SADT' encontrada no XML.");
      return [];
    }

    guiaSPSADTNodes.forEach((guideObj: any) => {
      if (!guideObj) return;

      const numeroGuiaPrestador = findNestedTagValue(guideObj, ['ans:numeroGuiaPrestador', 'numeroGuiaPrestador']) || 'N/A';
      const numeroCarteira = findNestedTagValue(guideObj, ['ans:numeroCarteira', 'numeroCarteira']) || 'N/A';
      const nomeProfissional = findNestedTagValue(guideObj, ['ans:nomeProfissional', 'nomeProfissional']) || 'N/A';
      const dataExecucao = findNestedTagValue(guideObj, ['ans:dataExecucao', 'dataExecucao']) || 'N/A';
      
      let valorTotalGeral = 0;
      let rawValorTotalGeral = findNestedTagValue(guideObj, ['ans:valorTotalGeral', 'valorTotalGeral']);
      
      // Prioritize ans:valorTotalGeral, then ans:valorTotal
      if (!rawValorTotalGeral) {
        rawValorTotalGeral = findNestedTagValue(guideObj, ['ans:valorTotal', 'valorTotal']);
      }

      if (rawValorTotalGeral) {
        let sanitizedValue = rawValorTotalGeral.trim();
        sanitizedValue = sanitizedValue.replace(/[^0-9.,]/g, ''); // Manter apenas dígitos, vírgulas e pontos

        const lastCommaIndex = sanitizedValue.lastIndexOf(',');
        const lastDotIndex = sanitizedValue.lastIndexOf('.');

        if (lastCommaIndex === -1 && lastDotIndex === -1) {
            // Nenhum separador, é um número inteiro. Ex: "12345"
            // Nenhuma transformação necessária.
        } else if (lastCommaIndex > lastDotIndex) {
            // Formato brasileiro: vírgula é decimal, ponto é milhar. Ex: "1.234,56" ou "123,45"
            sanitizedValue = sanitizedValue.replace(/\./g, ''); // Remove pontos de milhar
            sanitizedValue = sanitizedValue.replace(/,/g, '.'); // Troca vírgula decimal por ponto
        } else if (lastDotIndex > lastCommaIndex) {
            // Formato americano: ponto é decimal, vírgula é milhar. Ex: "1,234.56" ou "123.45"
            sanitizedValue = sanitizedValue.replace(/,/g, ''); // Remove vírgulas de milhar
            // O ponto já é o separador decimal, não precisa de alteração.
        } else { 
            // Caso ambíguo: apenas um tipo de separador existe (apenas pontos ou apenas vírgulas)
            // Ex: "1.000" (apenas pontos) ou "1,000" (apenas vírgulas)
            // Heurística: se um único separador é seguido por exatamente 3 dígitos, é um separador de milhares.
            // Caso contrário, é um separador decimal.
            if (lastDotIndex !== -1) { // Apenas pontos, ex: "1.000", "123.45"
                if (sanitizedValue.match(/\.\d{3}$/)) { // Ex: "1.000" (significando 1000)
                    sanitizedValue = sanitizedValue.replace(/\./g, ''); // Remove o ponto
                }
                // Senão, se for "123.45", mantém como ponto decimal.
            } else if (lastCommaIndex !== -1) { // Apenas vírgulas, ex: "1,000", "123,45"
                if (sanitizedValue.match(/,\d{3}$/)) { // Ex: "1,000" (significando 1000)
                    sanitizedValue = sanitizedValue.replace(/,/g, ''); // Remove a vírgula
                } else { // Ex: "123,45" (significando 123.45)
                    sanitizedValue = sanitizedValue.replace(/,/g, '.'); // Troca vírgula por ponto
                }
            }
        }
        
        const parsedValue = parseFloat(sanitizedValue);
        if (isNaN(parsedValue)) {
            console.warn(`Falha ao parsear valorTotalGeral para guia ${numeroGuiaPrestador}. Valor bruto: "${rawValorTotalGeral}", Sanitizado: "${sanitizedValue}". Usando 0.`);
            valorTotalGeral = 0;
        } else {
            valorTotalGeral = parsedValue;
        }
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
    console.log("extractGuides (Parser): Final number of guides extracted:", guides.length);
    return guides;
  } catch (error) {
    console.error("extractGuides (Parser): Erro ao parsear XML para extração de guias (XMLParser). Caindo para regex fallback:", error);
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

        const lastCommaIndex = sanitizedValue.lastIndexOf(',');
        const lastDotIndex = sanitizedValue.lastIndexOf('.');

        if (lastCommaIndex === -1 && lastDotIndex === -1) {
            // No separators, it's an integer.
        } else if (lastCommaIndex > lastDotIndex) {
            // Brazilian format
            sanitizedValue = sanitizedValue.replace(/\./g, '');
            sanitizedValue = sanitizedValue.replace(/,/g, '.');
        } else if (lastDotIndex > lastCommaIndex) {
            // US format
            sanitizedValue = sanitizedValue.replace(/,/g, '');
        } else { 
            // Ambiguous case
            if (lastDotIndex !== -1) { 
                if (sanitizedValue.match(/\.\d{3}$/)) { 
                    sanitizedValue = sanitizedValue.replace(/\./g, '');
                }
            } else if (lastCommaIndex !== -1) { 
                if (sanitizedValue.match(/,\d{3}$/)) { 
                    sanitizedValue = sanitizedValue.replace(/,/g, '');
                } else { 
                    sanitizedValue = sanitizedValue.replace(/,/g, '.');
                }
            }
        }
        const parsedValue = parseFloat(sanitizedValue);
        if (isNaN(parsedValue)) {
            console.warn(`Falha ao parsear valorTotalGeral (regex fallback) para guia ${numeroGuiaPrestador}. Valor bruto: "${rawValorTotalGeral}", Sanitizado: "${sanitizedValue}". Usando 0.`);
            valorTotalGeral = 0;
        } else {
            valorTotalGeral = parsedValue;
        }
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
    console.log("extractGuides (Regex Fallback): Final number of guides extracted:", regexGuides.length);
    return regexGuides;
  }
};

// Exclui uma guia do XML usando parsing e reconstrução
export const deleteGuide = (xmlContent: string, guideId: string): string => {
  try {
    const parser = new XMLParser(commonParserOptions); // Use commonParserOptions
    const internalBuilder = new XMLBuilder({ ...defaultBuilderOptions, format: false });
    let xmlObj = parser.parse(xmlContent);

    let guideFoundAndDeleted = false;

    // Função para encontrar e remover a guia
    const findAndDelete = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      const guiaSPSADTKeys = ['ans:guiaSP-SADT', 'guiaSP-SADT'];
      for (const key of guiaSPSADTKeys) {
        if (Array.isArray(obj[key])) {
          const initialLength = obj[key].length;
          obj[key] = obj[key].filter((guideObj: any) => {
            const currentGuideNumero = findNestedTagValue(guideObj, ['ans:numeroGuiaPrestador', 'numeroGuiaPrestador']);
            return currentGuideNumero !== guideId;
          });
          if (obj[key].length < initialLength) {
            guideFoundAndDeleted = true;
            if (obj[key].length === 0) {
              // If the array becomes empty, remove the property itself
              delete obj[key];
            }
            return; // Stop searching in this branch
          }
        } else if (typeof obj[key] === 'object') { // Handle single object case if not an array
            const currentGuideNumero = findNestedTagValue(obj[key], ['ans:numeroGuiaPrestador', 'numeroGuiaPrestador']);
            if (currentGuideNumero === guideId) {
                delete obj[key];
                guideFoundAndDeleted = true;
                return;
            }
        }
      }

      // Continue recursive search in child properties
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] === 'object') {
          if (Array.isArray(obj[key])) {
            for (const item of obj[key]) {
              findAndDelete(item);
              if (guideFoundAndDeleted) return;
            }
          } else {
            findAndDelete(obj[key]);
            if (guideFoundAndDeleted) return;
          }
        }
      }
    };

    findAndDelete(xmlObj);

    if (guideFoundAndDeleted) {
      // Rebuild the XML, ensuring the root element and namespaces are correct
      return rebuildXml(internalBuilder.build(xmlObj));
    } else {
      console.warn(`Guia com ID ${guideId} não encontrada para exclusão.`);
      return xmlContent;
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
  
  // Calcula o hash do conteúdo atualizado usando CryptoJS
  return CryptoJS.MD5(contentWithoutEpilogo).toString();
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
  const cbosEmpty = xmlContent.match(/<ans:CBOS>(?:\s*|NULL)<\/ans:CBOS>|<ans:CBOS\s*\/>/g);
  if (cbosEmpty && cbosEmpty.length > 0) {
    emptyTags.push(`<ans:CBOS /> (${cbosEmpty.length} ocorrências)`);
  }
  
  const tipoEmpty = xmlContent.match(/<ans:tipoAtendimento>(?:\s*|NULL)<\/ans:tipoAtendimento>|<ans:tipoAtendimento\s*\/>/g);
  if (tipoEmpty && tipoEmpty.length > 0) {
    emptyTags.push(`<ans:tipoAtendimento /> (${tipoEmpty.length} ocorrências)`);
  }
  
  const crmEmpty = xmlContent.match(/<ans:codigoPrestadorNaOperadora>(?:\s*|NULL)<\/ans:codigoPrestadorNaOperadora>|<ans:codigoPrestadorNaOperadora\s*\/>/g);
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
      'LABORATORIO', 'EXAME', 'CONSULTA', 'PROCEDIMENTO', 'TELELAUDO TECNOLOGIA MEDICA LTDA',
      'ECO-RAD SERVICOS DE DIAGNOSTICO POR IMAGEM LTDA' // Adicionado nome de empresa
    ];
    
    const upperName = guide.nomeProfissional.toUpperCase();
    const isSuspicious = suspiciousNames.some(term => upperName.includes(term));
    
    if (isSuspicious) {
      results.push(`⚠️ ALERTA (Guia ${guideNumber}): Nome de profissional ('${guide.nomeProfissional}') parece ser um procedimento ou nome de empresa, não um nome válido de pessoa física.`);
    }
  });
  
  if (results.length === 0) {
    results.push("✅ Dados Profissionais OK: Não foram encontrados dados suspeitos.");
  }
  
  return results;
};

// Validador TISS abrangente
export const validateTissCompliance = (xmlContent: string): string[] => {
  const results: string[] = [];
  const parser = new XMLParser(commonParserOptions);
  let xmlObj: any;

  try {
    xmlObj = parser.parse(xmlContent);
  } catch (error) {
    results.push(`❌ ERRO: Falha ao parsear XML para validação TISS: ${error instanceof Error ? error.message : String(error)}`);
    return results;
  }

  // Tags obrigatórias que devem existir no nível do documento (ou em um nível superior, mas não por guia)
  const documentLevelRequiredTags = TISS_TAGS_DATABASE.filter(tag => 
    tag.required && (tag.tag === 'ans:epilogo' || tag.tag === 'ans:mensagemTISS' || tag.tag === 'ans:cabecalho' || tag.tag === 'ans:identificacaoTransacao' || tag.tag === 'ans:origem' || tag.tag === 'ans:destino' || tag.tag === 'ans:Padrao' || tag.tag === 'ans:prestadorParaOperadora' || tag.tag === 'ans:loteGuias' || tag.tag === 'ans:guiasTISS')
  );

  documentLevelRequiredTags.forEach(requiredTag => {
    const possibleTagNames = [requiredTag.tag, requiredTag.tag.replace('ans:', '')];
    if (!tagExists(xmlObj, possibleTagNames)) {
      results.push(`❌ ERRO: Tag obrigatória de documento '${requiredTag.tag}' (${requiredTag.name}) não encontrada.`);
    }
  });

  // Tags obrigatórias que devem existir DENTRO de cada guia (ans:guiaSP-SADT)
  const guideLevelRequiredTags = TISS_TAGS_DATABASE.filter(tag => 
    tag.required && !documentLevelRequiredTags.some(docTag => docTag.tag === tag.tag)
  );

  const rawGuideObjects = deepFindGuideObjects(xmlObj);
  if (rawGuideObjects.length === 0) {
    results.push("⚠️ ALERTA: Nenhuma guia (ans:guiaSP-SADT) encontrada para validação de tags obrigatórias de guia.");
  } else {
    rawGuideObjects.forEach((rawGuideObj: any) => {
      const guideNumero = findNestedTagValue(rawGuideObj, ['ans:numeroGuiaPrestador', 'numeroGuiaPrestador']) || 'N/A';
      
      guideLevelRequiredTags.forEach(requiredTag => {
        const possibleTagNames = [requiredTag.tag, requiredTag.tag.replace('ans:', '')];
        if (!tagExists(rawGuideObj, possibleTagNames)) {
          results.push(`❌ ERRO (Guia ${guideNumero}): Tag obrigatória '${requiredTag.tag}' (${requiredTag.name}) não encontrada.`);
        }
      });

      // Check CBO-S and Procedure compatibility for each guide
      const cbosCode = findNestedTagValue(rawGuideObj, ['ans:CBOS', 'CBOS']);
      const procedureCode = findNestedTagValue(rawGuideObj, ['ans:codigoProcedimento', 'codigoProcedimento']);

      if (cbosCode && procedureCode) {
        const compatibility = validateCBOSProcedureCompatibility(cbosCode, procedureCode);
        if (!compatibility.compatible) {
          results.push(`⚠️ ALERTA (Guia ${guideNumero}): ${compatibility.warning}`);
        }
      } else {
        if (!cbosCode) results.push(`⚠️ ALERTA (Guia ${guideNumero}): CBO-S não encontrado para validação de compatibilidade.`);
        if (!procedureCode) results.push(`⚠️ ALERTA (Guia ${guideNumero}): Código de Procedimento não encontrado para validação de compatibilidade.`);
      }
    });
  }

  if (results.length === 0) {
    results.push("✅ Validação TISS OK: Nenhuma inconsistência crítica encontrada.");
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
  const parser = new XMLParser(commonParserOptions);
  try {
    const xmlObj = parser.parse(xmlContent);
    // Common paths for numeroLote
    const lotNumber = findNestedTagValue(xmlObj, [
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