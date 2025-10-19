import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FaturistaNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (faturistaName: string) => void;
}

export const FaturistaNameModal = ({ isOpen, onClose, onConfirm }: FaturistaNameModalProps) => {
  const [faturistaName, setFaturistaName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFaturistaName(""); // Reset input when modal opens
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (faturistaName.trim()) {
      onConfirm(faturistaName.trim());
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nome do Faturista</AlertDialogTitle>
          <AlertDialogDescription>
            Por favor, insira o nome do faturista para incluir no protocolo de conferência.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="faturistaName">Nome Completo</Label>
            <Input
              id="faturistaName"
              placeholder="Ex: Maria da Silva"
              value={faturistaName}
              onChange={(e) => setFaturistaName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={!faturistaName.trim()}>
            Confirmar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};