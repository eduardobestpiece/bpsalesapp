import { useState, useEffect } from 'react';

interface UserInfo {
  browser: string;
  device: string;
  ip: string;
  fullUrl: string;
  urlWithoutParams: string;
  urlParams: string;
  utm_campaign: string;
  utm_medium: string;
  utm_content: string;
  utm_source: string;
  utm_term: string;
  gclid: string;
  fbclid: string;
  fbp: string;
  fbc: string;
}

export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    browser: '',
    device: '',
    ip: '',
    fullUrl: '',
    urlWithoutParams: '',
    urlParams: '',
    utm_campaign: '',
    utm_medium: '',
    utm_content: '',
    utm_source: '',
    utm_term: '',
    gclid: '',
    fbclid: '',
    fbp: '',
    fbc: ''
  });

  useEffect(() => {
    const captureUserInfo = async () => {
      // Capturar informações do navegador
      const userAgent = navigator.userAgent;
      const browserInfo = getBrowserInfo(userAgent);
      
      // Capturar informações do dispositivo
      const deviceInfo = getDeviceInfo(userAgent);
      
      // Capturar URL atual
      const currentUrl = window.location.href;
      const urlWithoutParams = window.location.origin + window.location.pathname;
      const urlParams = window.location.search;
      
      // Capturar parâmetros UTM e outros
      const urlSearchParams = new URLSearchParams(window.location.search);
      
      // Capturar cookies do Facebook
      const fbp = getCookie('_fbp') || '';
      const fbc = getCookie('_fbc') || '';
      
      // Tentar capturar IP (será preenchido via API)
      let ip = '';
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ip = data.ip;
      } catch (error) {
        console.log('Não foi possível capturar o IP');
      }

      setUserInfo({
        browser: browserInfo,
        device: deviceInfo,
        ip,
        fullUrl: currentUrl,
        urlWithoutParams,
        urlParams,
        utm_campaign: urlSearchParams.get('utm_campaign') || '',
        utm_medium: urlSearchParams.get('utm_medium') || '',
        utm_content: urlSearchParams.get('utm_content') || '',
        utm_source: urlSearchParams.get('utm_source') || '',
        utm_term: urlSearchParams.get('utm_term') || '',
        gclid: urlSearchParams.get('gclid') || '',
        fbclid: urlSearchParams.get('fbclid') || '',
        fbp,
        fbc
      });
    };

    captureUserInfo();
  }, []);

  return userInfo;
};

// Função para detectar navegador e versão
const getBrowserInfo = (userAgent: string): string => {
  let browser = 'Unknown';
  let version = '';

  if (userAgent.includes('Firefox/')) {
    browser = 'Firefox';
    version = userAgent.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (userAgent.includes('Chrome/')) {
    browser = 'Chrome';
    version = userAgent.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    browser = 'Safari';
    version = userAgent.match(/Version\/(\d+)/)?.[1] || '';
  } else if (userAgent.includes('Edge/')) {
    browser = 'Edge';
    version = userAgent.match(/Edge\/(\d+)/)?.[1] || '';
  } else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
    browser = 'Opera';
    version = userAgent.match(/(?:Opera|OPR)\/(\d+)/)?.[1] || '';
  }

  return version ? `${browser} ${version}` : browser;
};

// Função para detectar dispositivo
const getDeviceInfo = (userAgent: string): string => {
  if (/Android/i.test(userAgent)) {
    const match = userAgent.match(/Android\s([^;]+)/);
    return `Android ${match?.[1] || ''}`.trim();
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    const match = userAgent.match(/OS\s+(\d+_\d+)/);
    return `iOS ${match?.[1]?.replace('_', '.') || ''}`.trim();
  } else if (/Windows/i.test(userAgent)) {
    const match = userAgent.match(/Windows NT (\d+\.\d+)/);
    return `Windows ${match?.[1] || ''}`.trim();
  } else if (/Mac OS X/i.test(userAgent)) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    return `macOS ${match?.[1]?.replace('_', '.') || ''}`.trim();
  } else if (/Linux/i.test(userAgent)) {
    return 'Linux';
  }

  return 'Desktop';
};

// Função para obter cookie
const getCookie = (name: string): string => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}; 