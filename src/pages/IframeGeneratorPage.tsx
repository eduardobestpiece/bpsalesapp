import React from 'react';
import IframeGenerator from '../components/IframeGenerator';

const IframeGeneratorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Gerador de Iframe com Captura Automática de UTMs
        </h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-green-800 mb-2">
            🎯 Solução Completa para Captura de UTMs
          </h2>
          <p className="text-green-700 mb-2">
            Este gerador resolve completamente o problema de captura de UTMs em iframes embedados 
            em páginas externas. A solução funciona via JavaScript na página pai, capturando 
            automaticamente todos os dados de tracking e enviando para o iframe via postMessage.
          </p>
          <div className="bg-green-100 p-3 rounded mt-2">
            <p className="text-green-800 font-semibold text-sm">
              ✨ Principais vantagens:
            </p>
            <ul className="text-green-700 text-sm mt-1 list-disc list-inside">
              <li>Funciona em qualquer domínio externo</li>
              <li>Captura UTMs, cookies e dados da página pai</li>
              <li>Código auto-contido (não precisa de scripts externos)</li>
              <li>Redimensionamento automático do iframe</li>
            </ul>
          </div>
        </div>

        <IframeGenerator 
          formId="81ca325a-8add-4366-87f7-3c1eea486b76"
        />

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            🚀 Como funciona a nova solução:
          </h3>
          <ul className="list-disc list-inside text-blue-700 space-y-1">
            <li><strong>Captura na página pai:</strong> JavaScript captura UTMs da URL da página onde o iframe está embedado</li>
            <li><strong>Comunicação via postMessage:</strong> Dados são enviados para o iframe usando a API de mensagens</li>
            <li><strong>Sem dependências:</strong> Não precisa de scripts externos ou configurações especiais</li>
            <li><strong>Compatível com CORS:</strong> Funciona mesmo quando iframe e página pai estão em domínios diferentes</li>
            <li><strong>Auto-contida:</strong> Todo o código necessário está incluído no HTML gerado</li>
          </ul>
        </div>

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            🧪 Como testar em ambiente real:
          </h3>
          <ol className="list-decimal list-inside text-gray-700 space-y-1">
            <li>Copie o código HTML gerado acima</li>
            <li>Crie uma página HTML simples com UTMs na URL: <code>?utm_source=google&utm_campaign=teste</code></li>
            <li>Cole o código do iframe nessa página</li>
            <li>Abra o console do navegador para ver os logs de tracking</li>
            <li>Preencha o formulário e verifique se os UTMs foram capturados corretamente</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default IframeGeneratorPage;
