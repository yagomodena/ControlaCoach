import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Palette, Bell, ShieldLock } from "lucide-react";

export default function ConfiguracoesPage() {
  // Mock settings state - in a real app, this would come from a data store
  const mockSettings = {
    coachName: "Bossolan",
    notificationsEnabled: true,
    defaultPaymentReminderDays: 3,
    theme: "light", // or 'dark'
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Ajuste as preferências do sistema Bossolan Futevôlei.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldLock className="h-5 w-5 text-primary" /> Perfil do Treinador
            </CardTitle>
            <CardDescription>Informações básicas do treinador.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="coachName">Nome do Treinador</Label>
              <Input id="coachName" defaultValue={mockSettings.coachName} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="coachEmail">Email de Contato</Label>
              <Input id="coachEmail" type="email" defaultValue="coach@bossolan.com" />
            </div>
            <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> Salvar Informações
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notificações
            </CardTitle>
            <CardDescription>Preferências de alertas e lembretes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="notificationsEnabled" className="flex flex-col space-y-1">
                <span>Ativar Notificações Gerais</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receber alertas sobre pagamentos, aulas, etc.
                </span>
              </Label>
              <Switch id="notificationsEnabled" defaultChecked={mockSettings.notificationsEnabled} />
            </div>
             <div className="space-y-1">
              <Label htmlFor="reminderDays">Dias para Lembrete de Pagamento</Label>
              <Input id="reminderDays" type="number" defaultValue={mockSettings.defaultPaymentReminderDays} />
              <p className="text-xs text-muted-foreground">Quantos dias antes do vencimento enviar lembrete.</p>
            </div>
            <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> Salvar Preferências de Notificação
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Aparência
            </CardTitle>
            <CardDescription>Personalize a interface do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="darkMode" className="flex flex-col space-y-1">
                <span>Modo Escuro</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Alternar para o tema escuro.
                </span>
              </Label>
              {/* This is a placeholder. Real dark mode toggle requires theme context. */}
              <Switch id="darkMode" defaultChecked={mockSettings.theme === 'dark'} disabled /> 
            </div>
            <p className="text-sm text-muted-foreground">
              Mais opções de personalização de tema estarão disponíveis em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
