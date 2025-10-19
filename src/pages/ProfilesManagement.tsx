import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2, Download, Upload, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadConfig, saveProfile, deleteProfile, saveRule, deleteRule, exportConfig, importConfig } from "@/utils/localStorage";
import { TissTagAutocomplete } from "@/components/TissTagAutocomplete";
import { Profile, CorrectionRule } from "@/types/profiles";

const ProfilesManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState(loadConfig());

  // Profile form state
  const [profileForm, setProfileForm] = useState<Partial<Profile>>({
    name: '',
    outputFormat: 'zip',
    associatedRules: []
  });

  // Rule form state
  const [ruleForm, setRuleForm] = useState<Partial<CorrectionRule>>({
    name: '',
    description: '',
    condition: {
      field: '',
      operator: 'equals',
      value: ''
    },
    action: {
      field: '',
      newValue: ''
    },
    enabled: true
  });

  const handleSaveProfile = () => {
    if (!profileForm.name || !profileForm.outputFormat) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const profile: Profile = {
      id: profileForm.id || Date.now().toString(),
      name: profileForm.name,
      outputFormat: profileForm.outputFormat as 'zip' | 'xml',
      associatedRules: profileForm.associatedRules || [],
      createdAt: profileForm.createdAt || new Date(),
      updatedAt: new Date()
    };

    saveProfile(profile);
    setConfig(loadConfig());
    setProfileForm({ name: '', outputFormat: 'zip', associatedRules: [] });
    
    toast({
      title: "Perfil salvo",
      description: `Perfil "${profile.name}" salvo com sucesso`
    });
  };

  const handleDeleteProfile = (id: string) => {
    if (confirm('Deseja realmente excluir este perfil?')) {
      deleteProfile(id);
      setConfig(loadConfig());
      toast({
        title: "Perfil excluído",
        description: "Perfil removido com sucesso"
      });
    }
  };

  const handleSaveRule = () => {
    if (!ruleForm.name || !ruleForm.condition?.field || !ruleForm.action?.field) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const rule: CorrectionRule = {
      id: ruleForm.id || Date.now().toString(),
      name: ruleForm.name,
      description: ruleForm.description || '',
      condition: ruleForm.condition as CorrectionRule['condition'],
      action: ruleForm.action as CorrectionRule['action'],
      enabled: ruleForm.enabled !== undefined ? ruleForm.enabled : true,
      createdAt: ruleForm.createdAt || new Date()
    };

    saveRule(rule);
    setConfig(loadConfig());
    setRuleForm({
      name: '',
      description: '',
      condition: { field: '', operator: 'equals', value: '' },
      action: { field: '', newValue: '' },
      enabled: true
    });

    toast({
      title: "Regra salva",
      description: `Regra "${rule.name}" salva com sucesso`
    });
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Deseja realmente excluir esta regra?')) {
      deleteRule(id);
      setConfig(loadConfig());
      toast({
        title: "Regra excluída",
        description: "Regra removida com sucesso"
      });
    }
  };

  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tiss-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Configurações exportadas",
      description: "Arquivo JSON baixado com sucesso"
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const success = importConfig(json);
      
      if (success) {
        setConfig(loadConfig());
        toast({
          title: "Configurações importadas",
          description: "Perfis e regras restaurados com sucesso"
        });
      } else {
        toast({
          title: "Erro ao importar",
          description: "Arquivo inválido",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <h2 className="text-3xl font-bold text-foreground">
                Gestão de Perfis e Regras
              </h2>
              <p className="text-muted-foreground mt-2">
                Configure perfis de convênio e regras de correção personalizadas
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button variant="outline" className="gap-2 relative">
                <Upload className="w-4 h-4" />
                Importar
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="profiles" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profiles">Perfis de Convênio</TabsTrigger>
              <TabsTrigger value="rules">Regras de Correção</TabsTrigger>
            </TabsList>

            <TabsContent value="profiles" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {profileForm.id ? 'Editar Perfil' : 'Criar Novo Perfil'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profileName">Nome do Perfil *</Label>
                      <Input
                        id="profileName"
                        placeholder="Ex: Bradesco, Unimed..."
                        value={profileForm.name || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="outputFormat">Formato de Saída *</Label>
                      <Select
                        value={profileForm.outputFormat || 'zip'}
                        onValueChange={(value) => setProfileForm({ ...profileForm, outputFormat: value as 'zip' | 'xml' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zip">ZIP (compactado)</SelectItem>
                          <SelectItem value="xml">XML (direto)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Regras Associadas</Label>
                    <div className="border rounded-lg p-4 space-y-2">
                      {config.rules.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma regra disponível. Crie regras na aba "Regras de Correção".
                        </p>
                      ) : (
                        config.rules.map(rule => (
                          <div key={rule.id} className="flex items-center gap-2">
                            <Switch
                              checked={(profileForm.associatedRules || []).includes(rule.id)}
                              onCheckedChange={(checked) => {
                                const current = profileForm.associatedRules || [];
                                setProfileForm({
                                  ...profileForm,
                                  associatedRules: checked
                                    ? [...current, rule.id]
                                    : current.filter(id => id !== rule.id)
                                });
                              }}
                            />
                            <Label className="cursor-pointer">{rule.name}</Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} className="gap-2">
                    <Save className="w-4 h-4" />
                    Salvar Perfil
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Perfis Salvos ({config.profiles.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {config.profiles.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum perfil configurado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {config.profiles.map(profile => (
                        <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-semibold">{profile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {profile.outputFormat.toUpperCase()} • {profile.associatedRules.length} regras
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProfileForm(profile)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProfile(profile.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    {ruleForm.id ? 'Editar Regra' : 'Criar Nova Regra'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruleName">Nome da Regra *</Label>
                    <Input
                      id="ruleName"
                      placeholder="Ex: Corrigir nome ECOCARDIOGRAMA"
                      value={ruleForm.name || ''}
                      onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ruleDescription">Descrição</Label>
                    <Textarea
                      id="ruleDescription"
                      placeholder="Descrição opcional da regra"
                      value={ruleForm.description || ''}
                      onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                    />
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold">Condição (SE)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TissTagAutocomplete
                        id="conditionField"
                        label="Campo *"
                        placeholder="Ex: ans:nomeProfissional"
                        value={ruleForm.condition?.field || ''}
                        onChange={(value) => setRuleForm({
                          ...ruleForm,
                          condition: { ...ruleForm.condition!, field: value }
                        })}
                      />
                      <div className="space-y-2">
                        <Label>Operador</Label>
                        <Select
                          value={ruleForm.condition?.operator || 'equals'}
                          onValueChange={(value) => setRuleForm({
                            ...ruleForm,
                            condition: { ...ruleForm.condition!, operator: value as any }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Igual a</SelectItem>
                            <SelectItem value="contains">Contém</SelectItem>
                            <SelectItem value="startsWith">Começa com</SelectItem>
                            <SelectItem value="endsWith">Termina com</SelectItem>
                            <SelectItem value="isEmpty">Está vazio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Valor</Label>
                        <Input
                          placeholder="Ex: ECOCARDIOGRAMA"
                          value={ruleForm.condition?.value || ''}
                          onChange={(e) => setRuleForm({
                            ...ruleForm,
                            condition: { ...ruleForm.condition!, value: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold">Ação (ENTÃO)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TissTagAutocomplete
                        id="actionField"
                        label="Campo *"
                        placeholder="Ex: ans:nomeProfissional"
                        value={ruleForm.action?.field || ''}
                        onChange={(value) => setRuleForm({
                          ...ruleForm,
                          action: { ...ruleForm.action!, field: value }
                        })}
                      />
                      <div className="space-y-2">
                        <Label>Novo Valor *</Label>
                        <Input
                          placeholder="Ex: Dr. Responsável"
                          value={ruleForm.action?.newValue || ''}
                          onChange={(e) => setRuleForm({
                            ...ruleForm,
                            action: { ...ruleForm.action!, newValue: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ruleForm.enabled !== false}
                      onCheckedChange={(checked) => setRuleForm({ ...ruleForm, enabled: checked })}
                    />
                    <Label>Regra ativada</Label>
                  </div>

                  <Button onClick={handleSaveRule} className="gap-2">
                    <Save className="w-4 h-4" />
                    Salvar Regra
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Regras Salvas ({config.rules.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {config.rules.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma regra configurada
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {config.rules.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{rule.name}</p>
                              {!rule.enabled && (
                                <span className="text-xs bg-muted px-2 py-1 rounded">Desativada</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              SE {rule.condition.field} {rule.condition.operator} "{rule.condition.value}" → 
                              ENTÃO {rule.action.field} = "{rule.action.newValue}"
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRuleForm(rule)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ProfilesManagement;
