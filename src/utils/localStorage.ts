import { Profile, CorrectionRule, ProfilesConfig } from '@/types/profiles';

const STORAGE_KEY = 'tiss_assistant_config';
const VERSION = '10.0.0';

export const loadConfig = (): ProfilesConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { profiles: [], rules: [], version: VERSION };
    }
    const config = JSON.parse(stored);
    // Convert date strings back to Date objects
    config.profiles = config.profiles.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt)
    }));
    config.rules = config.rules.map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt)
    }));
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    return { profiles: [], rules: [], version: VERSION };
  }
};

export const saveConfig = (config: ProfilesConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving config:', error);
  }
};

export const saveProfile = (profile: Profile): void => {
  const config = loadConfig();
  const index = config.profiles.findIndex(p => p.id === profile.id);
  if (index >= 0) {
    config.profiles[index] = profile;
  } else {
    config.profiles.push(profile);
  }
  saveConfig(config);
};

export const deleteProfile = (profileId: string): void => {
  const config = loadConfig();
  config.profiles = config.profiles.filter(p => p.id !== profileId);
  saveConfig(config);
};

export const saveRule = (rule: CorrectionRule): void => {
  const config = loadConfig();
  const index = config.rules.findIndex(r => r.id === rule.id);
  if (index >= 0) {
    config.rules[index] = rule;
  } else {
    config.rules.push(rule);
  }
  saveConfig(config);
};

export const deleteRule = (ruleId: string): void => {
  const config = loadConfig();
  config.rules = config.rules.filter(r => r.id !== ruleId);
  saveConfig(config);
};

export const exportConfig = (): string => {
  const config = loadConfig();
  return JSON.stringify(config, null, 2);
};

export const importConfig = (jsonString: string): boolean => {
  try {
    const config = JSON.parse(jsonString);
    saveConfig(config);
    return true;
  } catch (error) {
    console.error('Error importing config:', error);
    return false;
  }
};
