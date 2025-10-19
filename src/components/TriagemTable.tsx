import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ArrowUpDown, Filter } from "lucide-react";
import { Guide } from "@/utils/xmlProcessor";
import { formatCurrency } from "@/lib/utils"; // Importar a função de formatação

interface TriagemTableProps {
  guides: Guide[];
  onDeleteGuide: (guideId: string) => void;
  onSelectGuide: (guideId: string) => void;
  selectedGuideId?: string;
}

type SortField = 'numeroGuiaPrestador' | 'numeroCarteira' | 'nomeProfissional' | 'valorTotalGeral' | 'dataExecucao';
type SortDirection = 'asc' | 'desc';

export const TriagemTable = ({ 
  guides, 
  onDeleteGuide, 
  onSelectGuide,
  selectedGuideId 
}: TriagemTableProps) => {
  const [sortField, setSortField] = useState<SortField>('numeroGuiaPrestador');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterText, setFilterText] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredGuides = useMemo(() => {
    let filtered = guides;
    
    if (filterText) {
      const lower = filterText.toLowerCase();
      filtered = guides.filter(g => 
        g.numeroGuiaPrestador.toLowerCase().includes(lower) ||
        g.numeroCarteira.toLowerCase().includes(lower) ||
        g.nomeProfissional.toLowerCase().includes(lower)
      );
    }

    return [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [guides, sortField, sortDirection, filterText]);

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 gap-1"
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            Tabela de Triagem Interativa
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {sortedAndFilteredGuides.length} guias
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Input
            placeholder="Filtrar por número de guia, carteira ou profissional..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">
                    <SortButton field="numeroGuiaPrestador" label="Nº Guia" />
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <SortButton field="dataExecucao" label="Data Execução" />
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <SortButton field="numeroCarteira" label="Nº Carteira" />
                  </TableHead>
                  <TableHead>
                    <SortButton field="nomeProfissional" label="Profissional" />
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    <SortButton field="valorTotalGeral" label="Valor" />
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredGuides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma guia encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredGuides.map((guide) => (
                    <TableRow
                      key={guide.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedGuideId === guide.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => onSelectGuide(guide.id)}
                    >
                      <TableCell className="font-mono text-xs">
                        {guide.numeroGuiaPrestador}
                      </TableCell>
                      <TableCell className="text-xs">
                        {guide.dataExecucao}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {guide.numeroCarteira}
                      </TableCell>
                      <TableCell className="text-sm">
                        {guide.nomeProfissional}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(guide.valorTotalGeral)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deseja excluir permanentemente a guia ${guide.numeroGuiaPrestador}?`)) {
                              onDeleteGuide(guide.id);
                            }
                          }}
                          className="h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};