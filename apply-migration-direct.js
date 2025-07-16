// Script para aplicar a migração que adiciona colunas na tabela de funis
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler o arquivo de migração
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250715000000-add-meeting-stage-columns-to-funnels.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Configurar o cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://jbhocghbieqxjwsdstgm.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseKey) {
  console.error('SUPABASE_KEY não definida. Por favor, defina a variável de ambiente.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Aplicar a migração
async function applyMigration() {
  try {
    console.log('Aplicando migração...');
    console.log(migrationSQL);
    
    // Verificar se as colunas já existem
    const { data: columns, error: columnsError } = await supabase
      .from('funnels')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.error('Erro ao verificar colunas:', columnsError);
      return;
    }
    
    // Verificar se as colunas já existem no primeiro registro
    if (columns && columns.length > 0 && 
        ('meeting_scheduled_stage_id' in columns[0] || 'meeting_completed_stage_id' in columns[0])) {
      console.log('As colunas já existem na tabela. Nenhuma ação necessária.');
      return;
    }
    
    // Executar a migração diretamente
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Se a função exec_sql não existir, tentar executar diretamente
      if (error.message.includes('Could not find the function')) {
        console.log('Função exec_sql não encontrada. Tentando executar SQL diretamente...');
        
        // Tentar executar o SQL diretamente (isso só funcionará se o cliente tiver permissões adequadas)
        const { error: directError } = await supabase.auth.admin.executeSql(migrationSQL);
        
        if (directError) {
          console.error('Erro ao executar SQL diretamente:', directError);
          console.log('\nPor favor, execute o seguinte SQL manualmente no console do Supabase:');
          console.log(migrationSQL);
          return;
        }
      } else {
        console.error('Erro ao aplicar migração:', error);
        console.log('\nPor favor, execute o seguinte SQL manualmente no console do Supabase:');
        console.log(migrationSQL);
        return;
      }
    }
    
    console.log('Migração aplicada com sucesso!');
    
    // Verificar se as colunas foram criadas
    const { data: newColumns, error: newColumnsError } = await supabase
      .from('funnels')
      .select('*')
      .limit(1);
    
    if (newColumnsError) {
      console.error('Erro ao verificar novas colunas:', newColumnsError);
      return;
    }
    
    console.log('Colunas criadas:', 
      'meeting_scheduled_stage_id' in (newColumns[0] || {}) ? 'Sim' : 'Não',
      'meeting_completed_stage_id' in (newColumns[0] || {}) ? 'Sim' : 'Não'
    );
  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
    console.log('\nPor favor, execute o seguinte SQL manualmente no console do Supabase:');
    console.log(migrationSQL);
  }
}

applyMigration();