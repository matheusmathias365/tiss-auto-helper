import { z } from 'zod';

export const ConditionSchema = z.object({
  field: z.string().min(1, "Campo é obrigatório"),
  operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'isEmpty']),
  value: z.string().optional(), // Valor pode ser opcional dependendo do operador (ex: isEmpty)
});

export const ActionSchema = z.object({
  field: z.string().min(1, "Campo é obrigatório"),
  newValue: z.string().min(1, "Novo valor é obrigatório"),
});

export const ProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome do perfil é obrigatório"),
  outputFormat: z.enum(['zip', 'xml'], { message: "Formato de saída é obrigatório" }),
  associatedRules: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const CorrectionRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome da regra é obrigatório"),
  description: z.string().optional(),
  condition: ConditionSchema,
  action: ActionSchema,
  enabled: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
});

export interface Profile extends z.infer<typeof ProfileSchema> {}
export interface CorrectionRule extends z.infer<typeof CorrectionRuleSchema> {}

export interface ProfilesConfig {
  profiles: Profile[];
  rules: CorrectionRule[];
  version: string;
}