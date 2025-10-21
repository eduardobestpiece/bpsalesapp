const fs = require('fs');
const path = require('path');

// Arquivos para processar
const files = [
  'src/services/integrationService.ts',
  'src/services/metaCapiService.ts',
  'src/pages/PublicForm.tsx',
  'src/utils/parentPageScriptSimple.js'
];

// Função para remover logs de debug
function removeDebugLogs(content) {
  // Remover console.log com Debug
  content = content.replace(/console\.log\(['"`]🔍 Debug[^'"`]*['"`][^)]*\);?\s*/g, '');
  content = content.replace(/console\.log\(['"`]📘 Debug[^'"`]*['"`][^)]*\);?\s*/g, '');
  content = content.replace(/console\.log\(['"`]📞 Debug[^'"`]*['"`][^)]*\);?\s*/g, '');
  content = content.replace(/console\.log\(['"`]👤 Debug[^'"`]*['"`][^)]*\);?\s*/g, '');
  content = content.replace(/console\.log\(['"`]🔗 Debug[^'"`]*['"`][^)]*\);?\s*/g, '');
  content = content.replace(/console\.log\(['"`]⚠️ Debug[^'"`]*['"`][^)]*\);?\s*/g, '');
  content = content.replace(/console\.log\(['"`]✅ Debug[^'"`]*['"`][^)]*\);?\s*/g, '');
  content = content.replace(/console\.log\(['"`]❌ Debug[^'"`]*['"`][^)]*\);?\s*/g, '');
  
  // Remover console.log com Debug (formato alternativo)
  content = content.replace(/console\.log\(['"`]Debug[^'"`]*['"`][^)]*\);?\s*/g, '');
  
  // Remover linhas vazias extras
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return content;
}

// Processar cada arquivo
files.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      content = removeDebugLogs(content);
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Processado: ${filePath}`);
      } else {
        console.log(`⏭️ Nenhuma alteração: ${filePath}`);
      }
    } else {
      console.log(`❌ Arquivo não encontrado: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
});

console.log('🎉 Remoção de logs de debug concluída!');
