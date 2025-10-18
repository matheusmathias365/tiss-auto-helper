import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, HelpCircle, X } from "lucide-react";
import { searchCBOS, searchProcedure } from "@/utils/tissDatabase";

interface AssistenteTISSProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssistenteTISS = ({ isOpen, onClose }: AssistenteTISSProps) => {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<'cbos' | 'procedure'>('cbos');

  if (!isOpen) return null;

  const results = searchType === 'cbos' 
    ? searchCBOS(query)
    : searchProcedure(query);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Assistente TISS Local (Dicionário)
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={searchType === 'cbos' ? 'default' : 'outline'}
                onClick={() => setSearchType('cbos')}
                size="sm"
              >
                Pesquisar CBOS
              </Button>
              <Button
                variant={searchType === 'procedure' ? 'default' : 'outline'}
                onClick={() => setSearchType('procedure')}
                size="sm"
              >
                Pesquisar Procedimento
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={`Digite o código ou nome do ${searchType === 'cbos' ? 'CBOS' : 'procedimento'}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-3">
              {query.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Digite para pesquisar códigos TISS offline
                </p>
              ) : results.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum resultado encontrado
                </p>
              ) : (
                results.map((result, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">
                            {result.code}
                          </span>
                          <span className="font-semibold">{result.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.description}
                        </p>
                        {'compatibleCBOS' in result && Array.isArray(result.compatibleCBOS) && (
                          <div className="text-xs">
                            <span className="font-semibold">CBOS compatíveis: </span>
                            {result.compatibleCBOS.join(', ')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
