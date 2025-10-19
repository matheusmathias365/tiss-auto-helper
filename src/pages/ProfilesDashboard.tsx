import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings, FileText } from "lucide-react";
import { loadConfig } from "@/utils/localStorage";

const ProfilesDashboard = () => {
  const navigate = useNavigate();
  const config = loadConfig();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                Dashboard de Perfis
              </h2>
              <p className="text-muted-foreground mt-2">
                Escolha para qual convênio deseja faturar
              </p>
            </div>
            <Button
              onClick={() => navigate('/profiles-management')}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Gerir Perfis e Regras
            </Button>
          </div>

          {config.profiles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Nenhum perfil configurado
                </h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Crie seu primeiro perfil de convênio para começar a faturar com configurações personalizadas
                </p>
                <Button
                  onClick={() => navigate('/profiles-management')}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Perfil
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.profiles.map((profile) => {
                const associatedRulesCount = profile.associatedRules.length;
                const associatedRules = config.rules.filter(r => 
                  profile.associatedRules.includes(r.id)
                );

                return (
                  <Card
                    key={profile.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/convenio/${profile.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{profile.name}</span>
                        <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded">
                          {profile.outputFormat.toUpperCase()}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-semibold">Formato de saída: </span>
                          <span className="text-muted-foreground">
                            {profile.outputFormat === 'zip' ? 'ZIP (compactado)' : 'XML (direto)'}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold">Regras associadas: </span>
                          <span className="text-muted-foreground">
                            {associatedRulesCount} regra{associatedRulesCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {associatedRules.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">
                              Regras ativas:
                            </p>
                            {associatedRules.filter(r => r.enabled).slice(0, 2).map(rule => (
                              <div key={rule.id} className="text-xs bg-muted px-2 py-1 rounded mb-1">
                                {rule.name}
                              </div>
                            ))}
                            {associatedRules.filter(r => r.enabled).length > 2 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                +{associatedRules.filter(r => r.enabled).length - 2} mais
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilesDashboard;
