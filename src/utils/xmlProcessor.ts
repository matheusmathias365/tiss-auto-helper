import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export interface ProcessingResult {
  content: string;
  changes: number;
  errors?: string[];
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
  // Using simple string replacement for this specific structural issue
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
