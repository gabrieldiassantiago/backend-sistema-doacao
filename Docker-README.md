# Doacao Backend - Docker Setup

Este projeto inclui configuração Docker para facilitar o desenvolvimento e deployment.

## 🐳 Executando com Docker

### Pré-requisitos
- Docker
- Docker Compose

### Inicio Rápido

1. **Clone o repositório e navegue para a pasta backend**:
```bash
cd backend
```

2. **Configure as variáveis de ambiente**:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. **Execute o projeto**:
```bash
docker-compose up -d
```

Isso irá:
- Criar e executar um container PostgreSQL
- Construir e executar a API
- Executar as migrações do Prisma automaticamente
- Expor a API na porta 3000

### Comandos Úteis

**Visualizar logs:**
```bash
# Logs de todos os serviços
docker-compose logs -f

# Logs apenas da API
docker-compose logs -f api

# Logs apenas do banco
docker-compose logs -f postgres
```

**Parar os serviços:**
```bash
docker-compose down
```

**Parar e remover volumes (dados do banco):**
```bash
docker-compose down -v
```

**Reconstruir a API:**
```bash
docker-compose build api
docker-compose up -d
```

### Estrutura dos Containers

- **postgres**: Container PostgreSQL na porta 5432
- **api**: Container da API Node.js/Bun na porta 3000

### Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis no arquivo `.env`:

- `DATABASE_URL`: URL de conexão com o banco
- `BETTER_AUTH_SECRET`: Chave secreta para autenticação
- `SMTP_*`: Configurações de email (se necessário)

### Troubleshooting

**Problema de conexão com banco:**
- Verifique se o container postgres está rodando: `docker-compose ps`
- Verifique os logs do banco: `docker-compose logs postgres`

**API não inicia:**
- Verifique os logs da API: `docker-compose logs api`
- Certifique-se de que as migrações foram executadas com sucesso

**Problemas de performance:**
- Considere aumentar os recursos do Docker (CPU/Memory)

## 🚀 Deploy em Produção

Para deploy em produção, considere:

1. **Usar variáveis de ambiente apropriadas**
2. **Configurar um banco PostgreSQL gerenciado** (AWS RDS, Google Cloud SQL, etc.)
3. **Usar secrets para senhas e chaves**
4. **Configurar SSL/TLS**
5. **Implementar backup do banco de dados**