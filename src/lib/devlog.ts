export function isSimDebugEnabled(): boolean {
  try {
    if (typeof window !== 'undefined') {
      const flag = localStorage.getItem('SIM_DEBUG');
      if (flag !== null) return flag === '1' || flag === 'true';
    }
  } catch {}
  // Pode ser habilitado via Vite env: VITE_SIM_DEBUG=true
  // Atenção: valores de env são strings
  // @ts-ignore
  return (import.meta?.env?.VITE_SIM_DEBUG as string) === 'true';
}

export function simDebugLog(...args: any[]) {
  if (isSimDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.debug(...args);
  }
}

export function simInfoLog(...args: any[]) {
  if (isSimDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

export function simWarnLog(...args: any[]) {
  if (isSimDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
} 