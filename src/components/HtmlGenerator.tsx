import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Copy, Download, Eye } from 'lucide-react';

interface HtmlGeneratorProps {
  formId: string;
  formData: any;
  formStyle: any;
  baseUrl?: string;
}

export const HtmlGenerator: React.FC<HtmlGeneratorProps> = ({ 
  formId, 
  formData,
  formStyle,
  baseUrl = 'http://localhost:8080' 
}) => {
  const [htmlCode, setHtmlCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    generateHtmlCode();
  }, [formId, formData, formStyle, baseUrl]);

  const generateHtmlCode = () => {
    if (!formData || !formStyle) return;

    // Capturar parâmetros UTM da URL atual da página pai
    const captureUTMParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const utmParams = new URLSearchParams();
      
      // Parâmetros UTM
      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');
      const utmContent = urlParams.get('utm_content');
      const utmTerm = urlParams.get('utm_term');
      
      // Parâmetros de tracking
      const gclid = urlParams.get('gclid');
      const fbclid = urlParams.get('fbclid');
      
      // Adicionar apenas parâmetros que existem
      if (utmSource) utmParams.set('utm_source', utmSource);
      if (utmMedium) utmParams.set('utm_medium', utmMedium);
      if (utmCampaign) utmParams.set('utm_campaign', utmCampaign);
      if (utmContent) utmParams.set('utm_content', utmContent);
      if (utmTerm) utmParams.set('utm_term', utmTerm);
      if (gclid) utmParams.set('gclid', gclid);
      if (fbclid) utmParams.set('fbclid', fbclid);
      
      return utmParams.toString();
    };

    const utmParams = captureUTMParams();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const formUrl = `${baseUrl}/form/${formId}?v=${timestamp}&r=${randomId}${utmParams ? '&' + utmParams : ''}`;

    // Gerar estilos CSS baseados na configuração do formulário
    const generateStyles = () => {
      const styles = `
        <style>
          /* Reset e estilos base */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: ${formStyle.fontFamily || 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'};
            background-color: ${formStyle.backgroundColor || '#ffffff'};
            color: ${formStyle.textColor || '#333333'};
            line-height: 1.6;
          }
          
          .bp-form-container {
            max-width: 600px;
            margin: 0 auto;
            padding: ${formStyle.paddingPx || 20}px;
            background: ${formStyle.backgroundColor || '#ffffff'};
            border-radius: ${formStyle.borderRadiusPx || 8}px;
            box-shadow: ${formStyle.shadowEnabled !== false ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none'};
            border: ${formStyle.borderWidthPx || 0}px solid ${formStyle.borderColor || '#e5e5e5'};
          }
          
          .bp-form-title {
            font-size: ${formStyle.titleFontSizePx || 24}px;
            font-weight: ${formStyle.titleFontWeight || 'bold'};
            color: ${formStyle.titleColor || '#333333'};
            margin-bottom: ${formStyle.titleMarginBottomPx || 20}px;
            text-align: ${formStyle.titleAlign || 'left'};
          }
          
          .bp-form-description {
            font-size: ${formStyle.descriptionFontSizePx || 16}px;
            color: ${formStyle.descriptionColor || '#666666'};
            margin-bottom: ${formStyle.descriptionMarginBottomPx || 30}px;
            text-align: ${formStyle.descriptionAlign || 'left'};
          }
          
          .bp-form-field {
            margin-bottom: ${formStyle.fieldMarginBottomPx || 20}px;
          }
          
          .bp-form-label {
            display: block;
            font-size: ${formStyle.labelFontSizePx || 14}px;
            font-weight: ${formStyle.labelFontWeight || 'medium'};
            color: ${formStyle.labelColor || '#333333'};
            margin-bottom: ${formStyle.labelMarginBottomPx || 8}px;
          }
          
          .bp-form-input,
          .bp-form-select,
          .bp-form-textarea {
            width: 100%;
            padding: ${formStyle.inputPaddingPx || 12}px;
            font-size: ${formStyle.inputFontSizePx || 16}px;
            border: ${formStyle.inputBorderWidthPx || 1}px solid ${formStyle.inputBorderColor || '#d1d5db'};
            border-radius: ${formStyle.inputBorderRadiusPx || 6}px;
            background-color: ${formStyle.inputBackgroundColor || '#ffffff'};
            color: ${formStyle.inputTextColor || '#333333'};
            transition: border-color 0.2s ease;
          }
          
          .bp-form-input:focus,
          .bp-form-select:focus,
          .bp-form-textarea:focus {
            outline: none;
            border-color: ${formStyle.inputFocusBorderColor || '#3b82f6'};
            border-width: ${formStyle.inputFocusBorderWidthPx || 2}px;
          }
          
          .bp-form-button {
            width: 100%;
            padding: ${formStyle.buttonPaddingPx || 12}px;
            font-size: ${formStyle.buttonFontSizePx || 16}px;
            font-weight: ${formStyle.buttonFontWeight || 'medium'};
            color: ${formStyle.buttonTextColor || '#ffffff'};
            background: ${formStyle.buttonBackgroundColor || 'linear-gradient(180deg, #3b82f6, #2563eb)'};
            border: ${formStyle.buttonBorderWidthPx || 0}px solid ${formStyle.buttonBorderColor || 'transparent'};
            border-radius: ${formStyle.buttonBorderRadiusPx || 6}px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .bp-form-button:hover {
            background: ${formStyle.buttonHoverBackgroundColor || 'linear-gradient(180deg, #2563eb, #1d4ed8)'};
            transform: translateY(-1px);
          }
          
          .bp-form-button:active {
            transform: translateY(0);
          }
          
          .bp-form-error {
            color: ${formStyle.errorColor || '#ef4444'};
            font-size: ${formStyle.errorFontSizePx || 14}px;
            margin-top: 4px;
          }
          
          .bp-form-success {
            color: ${formStyle.successColor || '#10b981'};
            font-size: ${formStyle.successFontSizePx || 14}px;
            margin-top: 4px;
          }
          
          /* Responsividade */
          @media (max-width: 768px) {
            .bp-form-container {
              margin: 10px;
              padding: 15px;
            }
            
            .bp-form-title {
              font-size: 20px;
            }
            
            .bp-form-input,
            .bp-form-select,
            .bp-form-textarea {
              font-size: 16px; /* Evita zoom no iOS */
            }
          }
        </style>
      `;
      return styles;
    };

    // Gerar campos do formulário
    const generateFormFields = () => {
      if (!formData.fields || !Array.isArray(formData.fields)) return '';
      
      return formData.fields.map((field: any, index: number) => {
        const fieldId = `field_${index}`;
        const isRequired = field.required || false;
        
        switch (field.type) {
          case 'text':
          case 'email':
          case 'tel':
            return `
              <div class="bp-form-field">
                <label for="${fieldId}" class="bp-form-label">
                  ${field.label || field.name}${isRequired ? ' *' : ''}
                </label>
                <input 
                  type="${field.type}" 
                  id="${fieldId}" 
                  name="${field.name}" 
                  class="bp-form-input"
                  ${isRequired ? 'required' : ''}
                  placeholder="${field.placeholder || ''}"
                />
                <div class="bp-form-error" id="${fieldId}_error"></div>
              </div>
            `;
            
          case 'select':
            const options = field.options || [];
            return `
              <div class="bp-form-field">
                <label for="${fieldId}" class="bp-form-label">
                  ${field.label || field.name}${isRequired ? ' *' : ''}
                </label>
                <select 
                  id="${fieldId}" 
                  name="${field.name}" 
                  class="bp-form-select"
                  ${isRequired ? 'required' : ''}
                >
                  <option value="">Selecione uma opção</option>
                  ${options.map((option: any) => 
                    `<option value="${option.value}">${option.label}</option>`
                  ).join('')}
                </select>
                <div class="bp-form-error" id="${fieldId}_error"></div>
              </div>
            `;
            
          case 'textarea':
            return `
              <div class="bp-form-field">
                <label for="${fieldId}" class="bp-form-label">
                  ${field.label || field.name}${isRequired ? ' *' : ''}
                </label>
                <textarea 
                  id="${fieldId}" 
                  name="${field.name}" 
                  class="bp-form-textarea"
                  rows="${field.rows || 4}"
                  ${isRequired ? 'required' : ''}
                  placeholder="${field.placeholder || ''}"
                ></textarea>
                <div class="bp-form-error" id="${fieldId}_error"></div>
              </div>
            `;
            
          default:
            return '';
        }
      }).join('');
    };

    // Gerar JavaScript para funcionalidades
    const generateJavaScript = () => {
      return `
        <script>
          // Função para capturar UTMs da URL atual
          function captureUTMs() {
            const urlParams = new URLSearchParams(window.location.search);
            return {
              utm_source: urlParams.get('utm_source') || '',
              utm_medium: urlParams.get('utm_medium') || '',
              utm_campaign: urlParams.get('utm_campaign') || '',
              utm_content: urlParams.get('utm_content') || '',
              utm_term: urlParams.get('utm_term') || '',
              gclid: urlParams.get('gclid') || '',
              fbclid: urlParams.get('fbclid') || ''
            };
          }
          
          // Função para capturar cookies
          function captureCookies() {
            const cookies = {};
            document.cookie.split(';').forEach(cookie => {
              const [name, value] = cookie.trim().split('=');
              if (name && value) {
                cookies[name] = value;
              }
            });
            return cookies;
          }
          
          // Função para validar formulário
          function validateForm() {
            const form = document.getElementById('bp-form');
            const fields = form.querySelectorAll('[required]');
            let isValid = true;
            
            fields.forEach(field => {
              const errorElement = document.getElementById(field.id + '_error');
              if (!field.value.trim()) {
                errorElement.textContent = 'Este campo é obrigatório';
                isValid = false;
              } else {
                errorElement.textContent = '';
              }
            });
            
            return isValid;
          }
          
          // Função para enviar formulário
          async function submitForm(event) {
            event.preventDefault();
            
            if (!validateForm()) {
              return;
            }
            
            const form = document.getElementById('bp-form');
            const formData = new FormData(form);
            const utms = captureUTMs();
            const cookies = captureCookies();
            
            // Adicionar UTMs aos dados do formulário
            Object.keys(utms).forEach(key => {
              if (utms[key]) {
                formData.append(key, utms[key]);
              }
            });
            
            // Adicionar cookies aos dados do formulário
            Object.keys(cookies).forEach(key => {
              if (cookies[key]) {
                formData.append('cookie_' + key, cookies[key]);
              }
            });
            
            try {
              const response = await fetch('${formUrl}', {
                method: 'POST',
                body: formData
              });
              
              if (response.ok) {
                // Sucesso
                const successElement = document.getElementById('form-success');
                successElement.style.display = 'block';
                form.style.display = 'none';
              } else {
                throw new Error('Erro ao enviar formulário');
              }
            } catch (error) {
              console.error('Erro:', error);
              alert('Erro ao enviar formulário. Tente novamente.');
            }
          }
          
          // Inicializar quando a página carregar
          document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('bp-form');
            if (form) {
              form.addEventListener('submit', submitForm);
            }
          });
        </script>
      `;
    };

    // Gerar HTML completo
    const completeHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${formData.name || 'Formulário de Contato'}</title>
    ${generateStyles()}
</head>
<body>
    <div class="bp-form-container">
        ${formData.title ? `<h1 class="bp-form-title">${formData.title}</h1>` : ''}
        ${formData.description ? `<p class="bp-form-description">${formData.description}</p>` : ''}
        
        <form id="bp-form" method="POST" action="${formUrl}">
            ${generateFormFields()}
            
            <button type="submit" class="bp-form-button">
                ${formData.buttonText || 'Enviar'}
            </button>
        </form>
        
        <div id="form-success" class="bp-form-success" style="display: none;">
            <h3>Formulário enviado com sucesso!</h3>
            <p>Obrigado pelo seu contato. Entraremos em contato em breve.</p>
        </div>
    </div>
    
    ${generateJavaScript()}
</body>
</html>`;

    setHtmlCode(completeHtml);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(htmlCode);
    alert('Código HTML copiado para a área de transferência!');
  };

  const downloadHtml = () => {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formulario_${formId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openPreview = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlCode);
      newWindow.document.close();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Gerador de HTML Completo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="html-code">Código HTML Completo</Label>
          <Textarea
            id="html-code"
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
            placeholder="O código HTML será gerado automaticamente..."
            className="min-h-[400px] font-mono text-sm"
            readOnly
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={copyToClipboard} variant="outline" className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Copiar HTML
          </Button>
          <Button onClick={downloadHtml} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Baixar HTML
          </Button>
          <Button onClick={openPreview} variant="outline" className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Instruções de Uso:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Copie o HTML:</strong> Use o botão "Copiar HTML" para copiar o código</li>
            <li>• <strong>Cole em seu site:</strong> Cole o código HTML em qualquer página web</li>
            <li>• <strong>Funciona independente:</strong> Não precisa de scripts externos</li>
            <li>• <strong>Captura UTMs:</strong> Automaticamente captura UTMs da URL atual</li>
            <li>• <strong>Responsivo:</strong> Funciona em desktop e mobile</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
