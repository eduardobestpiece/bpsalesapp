import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AvatarUpload } from '@/components/CRM/AvatarUpload';

export interface PersonalDataTabProps {
  formData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    birth_date: string;
    bio: string;
    avatar_url: string;
  };
  isSaving: boolean;
  userInitials: string;
  userId: string;
  onInputChange: (field: string, value: string) => void;
  onSave: () => void;
  onAvatarChange: (avatarUrl: string) => void;
}

export function PersonalDataTab({
  formData,
  isSaving,
  userInitials,
  userId,
  onInputChange,
  onSave,
  onAvatarChange,
}: PersonalDataTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-foreground">Foto do Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <AvatarUpload
            currentAvatar={formData.avatar_url}
            onAvatarChange={onAvatarChange}
            userId={userId}
            userInitials={userInitials}
          />
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground">Informações Pessoais</CardTitle>
              <Button
                variant="brandPrimaryToSecondary"
                onClick={onSave}
                disabled={isSaving}
                className="brand-radius"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nome</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => onInputChange('first_name', e.target.value)}
                  disabled={isSaving}
                  className="brand-radius field-secondary-focus no-ring-focus"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Sobrenome</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => onInputChange('last_name', e.target.value)}
                  disabled={isSaving}
                  className="brand-radius field-secondary-focus no-ring-focus"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="brand-radius bg-muted text-foreground disabled:opacity-75 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => onInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  disabled={isSaving}
                  className="brand-radius field-secondary-focus no-ring-focus"
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => onInputChange('birth_date', e.target.value)}
                  disabled={isSaving}
                  className="brand-radius field-secondary-focus no-ring-focus"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                value={formData.bio}
                onChange={(e) => onInputChange('bio', e.target.value)}
                disabled={isSaving}
                className="brand-radius field-secondary-focus no-ring-focus"
                placeholder="Conte um pouco sobre você..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
