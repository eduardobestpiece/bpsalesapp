# Deploy Configuration Guide

## 🚀 Deploy Automático Configurado

### Status Atual
✅ Repositório GitHub: https://github.com/eduardobestpiece/bpsalesapp.git
✅ GitHub Actions configurado
✅ Vercel configurado
✅ Build automático ativo

### Próximos Passos para Deploy

1. **Acesse o Vercel**:
   - Vá para https://vercel.com
   - Faça login com sua conta GitHub
   - Clique em "New Project"
   - Importe o repositório `eduardobestpiece/bpsalesapp`

2. **Configure as Variáveis de Ambiente**:
   - No painel do Vercel, vá em Settings > Environment Variables
   - Adicione as variáveis do Supabase:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Deploy Automático**:
   - A cada push na branch `main`, o deploy será executado automaticamente
   - O GitHub Actions também está configurado para deploy

### URLs de Deploy
- **GitHub**: https://github.com/eduardobestpiece/bpsalesapp
- **Vercel**: Será gerada automaticamente após importar o projeto

### Monitoramento
- Acesse o GitHub Actions para ver o status dos deploys
- Monitore os logs no painel do Vercel
- Use o dashboard do Supabase para monitorar o backend
