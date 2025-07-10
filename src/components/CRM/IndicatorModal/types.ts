
export interface PeriodOption {
  label: string;
  value: string;
  isMissing?: boolean;
  isAllowed?: boolean;
}

export interface IndicatorFormData {
  period_date: string;
  funnel_id: string;
  month_reference: number;
  year_reference: number;
  stages: Record<string, number>;
}

export interface IndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  indicator?: any;
}
