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
      .rpc('execute_sql', {
        query: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'funnels' 
          AND column_name IN ('meeting_scheduled_stage_id', 'meeting_completed_stage_id');
        `
      });
    
    if (columnsError) {
      console.error('Erro ao verificar colunas:', columnsError);
      return;
    }
    
    if (columns && columns.length === 2) {
      console.log('As colunas já existem na tabela. Nenhuma ação necessária.');
      return;
    }
    
    // Executar a migração
    const { error } = await supabase
      .rpc('execute_sql', { query: migrationSQL });
    
    if (error) {
      console.error('Erro ao aplicar migração:', error);
      return;
    }
    
    console.log('Migração aplicada com sucesso!');
    
    // Verificar se as colunas foram criadas
    const { data: newColumns, error: newColumnsError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'funnels' 
          AND column_name IN ('meeting_scheduled_stage_id', 'meeting_completed_stage_id');
        `
      });
    
    if (newColumnsError) {
      console.error('Erro ao verificar novas colunas:', newColumnsError);
      return;
    }
    
    console.log('Colunas criadas:', newColumns);
  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
  }
}

applyMigration();