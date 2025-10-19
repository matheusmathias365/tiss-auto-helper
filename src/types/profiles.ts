export interface Profile {
  id: string;
  name: string;
  outputFormat: 'zip' | 'xml';
  associatedRules: string[]; // IDs das regras
  createdAt: Date;
  updatedAt: Date;
}

export interface CorrectionRule {
  id: string;
  name: string;
  description: string;
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'isEmpty';
    value: string;
  };
  action: {
    field: string;
    newValue: string;
  };
  enabled: boolean;
  createdAt: Date;
}

export interface ProfilesConfig {
  profiles: Profile[];
  rules: CorrectionRule[];
  version: string;
}
