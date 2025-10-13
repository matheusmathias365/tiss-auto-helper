export interface ProcessingResult {
  content: string;
  changes: number;
  errors?: string[];
}

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

  // Replace all tipoAtendimento tags with standardized value
  const tipoAtendimentoRegex = /<ans:tipoAtendimento>.*?<\/ans:tipoAtendimento>/g;
  const matches = content.match(tipoAtendimentoRegex);
  
  if (matches) {
    changes = matches.length;
    content = content.replace(
      tipoAtendimentoRegex,
      '<ans:tipoAtendimento>23</ans:tipoAtendimento>'
    );
  }

  return {
    content,
    changes,
  };
};

export const standardizeCBOS = (xmlContent: string): ProcessingResult => {
  let content = xmlContent;
  let changes = 0;

  // Replace all CBOS tags with standardized value
  const cbosRegex = /<ans:CBOS>.*?<\/ans:CBOS>/g;
  const matches = content.match(cbosRegex);
  
  if (matches) {
    changes = matches.length;
    content = content.replace(
      cbosRegex,
      '<ans:CBOS>225125</ans:CBOS>'
    );
  }

  return {
    content,
    changes,
  };
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
