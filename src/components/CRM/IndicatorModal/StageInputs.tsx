
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StageInputsProps {
  stages: any[];
  stageValues: Record<string, number>;
  onStageValueChange: (stageId: string, value: number) => void;
  disabled: boolean;
}

export const StageInputs = ({
  stages,
  stageValues,
  onStageValueChange,
  disabled
}: StageInputsProps) => {
  if (!stages || stages.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valores por Etapa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage) => (
          <div key={stage.id}>
            <Label htmlFor={`stage_${stage.id}`}>
              {stage.name}
            </Label>
            <Input
              id={`stage_${stage.id}`}
              type="number"
              min="0"
              value={stageValues[stage.id] || 0}
              onChange={(e) => onStageValueChange(stage.id, parseInt(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
