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

// Função para gerar períodos semanais dos últimos 90 dias a partir de hoje
export function gerarPeriodosSemanaisUltimos90Dias(diaInicioSemana: number = 1) {
  const periodos: { label: string; value: string }[] = [];
  const hoje = new Date();
  const dataLimite = new Date(hoje);
  dataLimite.setDate(dataLimite.getDate() - 89); // 90 dias incluindo hoje

  // Encontrar a última data de término de semana <= hoje
  let dataFim = new Date(hoje);
  while (dataFim.getDay() !== ((diaInicioSemana + 6) % 7)) {
    dataFim.setDate(dataFim.getDate() - 1);
  }

  // Gerar períodos semanais retroativamente
  while (dataFim >= dataLimite) {
    const dataInicio = new Date(dataFim);
    dataInicio.setDate(dataFim.getDate() - 6);
    if (dataInicio < dataLimite) break;
    const value = `${dataInicio.toISOString().split('T')[0]}_${dataFim.toISOString().split('T')[0]}`;
    const label = `De ${dataInicio.toLocaleDateString('pt-BR')} até ${dataFim.toLocaleDateString('pt-BR')}`;
    periodos.push({ label, value });
    dataFim.setDate(dataFim.getDate() - 7);
  }
  return periodos;
}

// Função para gerar períodos mensais com dia customizável (ex: do dia 2 ao dia 1 do mês seguinte)
export function gerarPeriodosMensaisCustom(mes: number, ano: number, diaInicio: number = 1, quantidade: number = 3) {
  const periodos: { label: string; value: string }[] = [];
  let dataInicio = new Date(ano, mes - 1, diaInicio);
  for (let i = 0; i < quantidade; i++) {
    let dataFim: Date;
    if (diaInicio === 1) {
      // Fim: último dia do mesmo mês
      dataFim = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + 1, 0);
    } else {
      // Fim: dia (X-1) do mês seguinte
      dataFim = new Date(dataInicio);
      dataFim.setMonth(dataFim.getMonth() + 1);
      dataFim.setDate(diaInicio - 1 === 0 ? new Date(dataFim.getFullYear(), dataFim.getMonth(), 0).getDate() : diaInicio - 1);
      if (dataFim < dataInicio) {
        dataFim.setMonth(dataFim.getMonth() + 1);
      }
    }
    const value = `${dataInicio.toISOString().split('T')[0]}_${dataFim.toISOString().split('T')[0]}`;
    const label = `De ${dataInicio.toLocaleDateString('pt-BR')} até ${dataFim.toLocaleDateString('pt-BR')}`;
    periodos.push({ label, value });
    // Próximo período
    dataInicio = new Date(dataFim);
    dataInicio.setDate(dataInicio.getDate() + 1);
  }
  return periodos;
}

// Função para gerar dias dos últimos 90 dias até ontem (para funis diários)
export function gerarDiasUltimos90AteOntem() {
  const periodos: { label: string; value: string }[] = [];
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  for (let i = 0; i < 90; i++) {
    const data = new Date(ontem);
    data.setDate(ontem.getDate() - i);
    const value = data.toISOString().split('T')[0];
    periodos.push({
      label: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      value
    });
  }
  return periodos;
}
