# BP Sales App - Plataforma de Simulação de Consórcio Patrimonial

## 📋 Sobre o Projeto

Esta é uma plataforma completa para simulação e gestão de consórcios patrimoniais, desenvolvida com tecnologias modernas e interface responsiva.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Vercel + GitHub Actions
- **State Management**: React Query + Context API

## 🛠️ Como Executar Localmente

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta Supabase configurada

### Instalação

```bash
# Clone o repositório
git clone https://github.com/eduardobestpiece/bpsalesapp.git

# Entre no diretório
cd bpsalesapp

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o arquivo .env.local com suas credenciais do Supabase

# Execute o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`

## 📦 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento (porta 8080)
- `npm run build` - Build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## 🌐 Deploy Automático

### Via Vercel (Recomendado)

1. **Conecte o repositório ao Vercel**:
   - Acesse [vercel.com](https://vercel.com)
   - Importe o repositório GitHub
   - Configure as variáveis de ambiente
   - Deploy automático será feito a cada push na branch `main`

2. **Configuração GitHub Actions**:
   - Configure os secrets no GitHub:
     - `VERCEL_TOKEN`: Token do Vercel
     - `ORG_ID`: ID da organização Vercel
     - `PROJECT_ID`: ID do projeto Vercel

### Via GitHub Pages

O projeto está configurado para deploy automático via GitHub Actions. A cada push na branch `main`, o deploy será executado automaticamente.

## 🔧 Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as tabelas necessárias usando as migrações em `/supabase/migrations/`
3. Configure as políticas RLS (Row Level Security)
4. Adicione as credenciais no arquivo `.env.local`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── Layout/         # Componentes de layout
│   ├── Simulator/      # Componentes do simulador
│   └── ...
├── pages/              # Páginas da aplicação
├── hooks/              # Custom hooks
├── contexts/           # Contextos React
├── services/           # Serviços e integrações
├── types/              # Definições TypeScript
└── utils/              # Utilitários
```

## 🔐 Funcionalidades Principais

- ✅ Sistema de autenticação completo
- ✅ Simulador de consórcio patrimonial
- ✅ Dashboard administrativo
- ✅ Gestão de usuários e permissões
- ✅ CRM integrado
- ✅ Relatórios e analytics
- ✅ Interface responsiva
- ✅ Modo escuro/claro

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através do repositório GitHub.

## 📄 Licença

Este projeto é proprietário e confidencial.
