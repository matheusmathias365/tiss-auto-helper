import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

// Common TISS XML tags
const TISS_TAGS = [
  'ans:tipoAtendimento',
  'ans:nomeProfissional',
  'ans:CBOS',
  'ans:numeroGuiaPrestador',
  'ans:numeroCarteira',
  'ans:valorTotalGeral',
  'ans:dataExecucao',
  'ans:codigoPrestadorNaOperadora',
  'ans:nomeContratado',
  'ans:cpfContratado',
  'ans:numeroLote',
  'ans:versaoPadrao',
  'ans:registroANS',
  'ans:nomeBeneficiario',
  'ans:observacao',
  'ans:codigoProcedimento',
  'ans:descricaoProcedimento',
  'ans:quantidadeExecutada',
  'ans:valorUnitario',
  'ans:valorTotal',
  'ans:grauPart',
  'ans:codigoOperadora',
  'ans:nomeOperadora',
  'ans:hash'
];

interface TissTagAutocompleteProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const TissTagAutocomplete = ({ id, label, placeholder, value, onChange }: TissTagAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredTags = TISS_TAGS.filter(tag => 
    tag.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 10);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
    setOpen(newValue.length > 0 && filteredTags.length > 0);
  };

  const handleSelectTag = (tag: string) => {
    setInputValue(tag);
    onChange(tag);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor={id}>{label}</Label>
      <Input
        ref={inputRef}
        id={id}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (inputValue.length > 0 && filteredTags.length > 0) {
            setOpen(true);
          }
        }}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => setOpen(false), 200);
        }}
      />
      
      {open && filteredTags.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <Command>
            <CommandList>
              <CommandEmpty>Nenhuma tag encontrada</CommandEmpty>
              <CommandGroup>
                {filteredTags.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => handleSelectTag(tag)}
                    className="cursor-pointer"
                  >
                    {tag}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};
