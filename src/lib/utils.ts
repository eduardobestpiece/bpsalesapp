import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para gerar períodos diários de um mês/ano
export function gerarPeriodosDiarios(mes: number, ano: number) {
  const periodos: { label: string; value: string }[] = [];
  const diasNoMes = new Date(ano, mes, 0).getDate();
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const value = data.toISOString().split('T')[0];
    periodos.push({
      label: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      value
    });
  }
  return periodos;
}

// Função para gerar períodos semanais de um mês/ano, com dia inicial customizável (0=domingo, 1=segunda...)
export function gerarPeriodosSemanais(mes: number, ano: number, diaInicioSemana: number = 1) {
  const periodos: { label: string; value: string }[] = [];
  const diasNoMes = new Date(ano, mes, 0).getDate();
  let inicio = 1;
  while (inicio <= diasNoMes) {
    const dataInicio = new Date(ano, mes - 1, inicio);
    // Encontrar o próximo diaInicioSemana
    while (dataInicio.getDay() !== diaInicioSemana && inicio <= diasNoMes) {
      inicio++;
      dataInicio.setDate(inicio);
    }
    if (inicio > diasNoMes) break;
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataInicio.getDate() + 6);
    if (dataFim.getMonth() !== mes - 1) {
      dataFim.setMonth(mes - 1);
      dataFim.setDate(diasNoMes);
    }
    const value = `${dataInicio.toISOString().split('T')[0]}_${dataFim.toISOString().split('T')[0]}`;
    const label = `De ${dataInicio.toLocaleDateString('pt-BR')} até ${dataFim.toLocaleDateString('pt-BR')}`;
    periodos.push({ label, value });
    inicio = dataFim.getDate() + 1;
  }
  return periodos;
}

// Função para gerar períodos mensais (apenas um por mês)
export function gerarPeriodoMensal(mes: number, ano: number) {
  const dataInicio = new Date(ano, mes - 1, 1);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataFim = new Date(ano, mes - 1, diasNoMes);
  return [{
    label: `De ${dataInicio.toLocaleDateString('pt-BR')} até ${dataFim.toLocaleDateString('pt-BR')}`,
    value: `${dataInicio.toISOString().split('T')[0]}_${dataFim.toISOString().split('T')[0]}`
  }];
}

// Função para extrair o último dia de um período (value pode ser 'YYYY-MM-DD' ou 'YYYY-MM-DD_YYYY-MM-DD')
export function getUltimoDiaPeriodo(value: string): string {
  if (value.includes('_')) {
    // Período semanal ou mensal
    return value.split('_')[1];
  }
  // Período diário
  return value;
}
