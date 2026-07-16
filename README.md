<p align="center">
  <img src="https://img.shields.io/badge/Bun-1.x-f9f1e1?style=for-the-badge&logo=bun&logoColor=black" />
  <img src="https://img.shields.io/badge/Elysia-latest-8B5CF6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

# 🤝 API de Doações Gamificadas

> Plataforma backend de caridade com sistema de **XP**, **badges**, **leaderboard**, pagamentos via **PIX (Mercado Pago)** e causas verificadas por moderação administrativa.

---

## 📑 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Módulos do Sistema](#-módulos-do-sistema)
- [Diagrama de Banco de Dados](#-diagrama-de-banco-de-dados)
- [Fluxos Principais](#-fluxos-principais)
- [Sistema de Gamificação](#-sistema-de-gamificação)
- [Endpoints da API](#-endpoints-da-api)
- [Emails Transacionais](#-emails-transacionais)
- [Setup Local](#-setup-local)
- [Docker](#-docker)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Scripts Úteis](#-scripts-úteis)

---

## 🌍 Visão Geral

Esta API é o backend de uma plataforma de doações que conecta **doadores** a **causas sociais** verificadas. O diferencial é a camada de **gamificação**: cada doação concede **XP**, desbloqueando **níveis** e **badges**. Os doadores competem em um **leaderboard** global, incentivando a solidariedade de forma engajante.

### Principais funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Causas com moderação** | Criação, documentos de verificação e aprovação por admin |
| **Doações gamificadas** | XP, badges e leaderboard por doação |
| **Pagamento PIX** | Integração completa com Mercado Pago (QR Code + Webhook) |
| **Saques via PIX** | Donos de causas sacam o saldo arrecadado |
| **Pontos de coleta** | Cadastro de locais físicos para doações presenciais |
| **Sugestões comunitárias** | Usuários sugerem novos pontos de coleta |
| **Autenticação robusta** | Email/senha com OTP, Google OAuth, sessões seguras |
| **Emails transacionais** | Templates React renderizados e enviados via fila assíncrona |
| **Busca geográfica** | Filtro por coordenadas + raio para causas e pontos de coleta |

---

## 🏗 Arquitetura

A aplicação segue uma arquitetura em camadas com **Dependency Injection** manual via container:

```mermaid
graph TB
    subgraph "Clientes"
        WEB["🌐 Frontend Web<br/>(Vercel)"]
        MP_HOOK["💳 Mercado Pago<br/>(Webhook)"]
    end

    subgraph "API Layer"
        ELYSIA["⚡ Elysia Server<br/>:3000"]
        CORS["CORS Middleware"]
        AUTH_MW["Auth Middleware<br/>(Better Auth)"]
        ERR["Error Handler"]
        OPENAPI["OpenAPI /docs"]
    end

    subgraph "Controllers"
        C_CAUSE["CauseController"]
        C_DONATION["DonationController"]
        C_PAYMENT["PaymentController"]
        C_WITHDRAWAL["WithdrawalController"]
        C_USER["UserController"]
        C_CATEGORY["CategoryController"]
        C_CP["CollectionPointController"]
        C_SUGGEST["SuggestionController"]
    end

    subgraph "Services"
        S_CAUSE["CauseService"]
        S_DONATION["DonationService"]
        S_PAYMENT["PaymentService"]
        S_WITHDRAWAL["WithdrawalService"]
        S_USER["UserService"]
        S_CATEGORY["CategoryService"]
        S_CP["CollectionPointService"]
        S_SUGGEST["SuggestionService"]
        S_GAMIFICATION["GamificationEngine"]
    end

    subgraph "Infrastructure"
        CONTAINER["🏭 DI Container"]
        REPO["Repositories<br/>(Prisma)"]
        S3["☁️ S3 Storage"]
        MAILER["📧 Mailer<br/>(Nodemailer)"]
        EMAIL_Q["📨 Email Queue<br/>(BullMQ)"]
        MP_CLIENT["💳 MercadoPago<br/>Client"]
    end

    subgraph "Data Stores"
        PG[("🐘 PostgreSQL")]
        REDIS[("🔴 Redis")]
    end

    WEB --> ELYSIA
    MP_HOOK --> ELYSIA
    ELYSIA --> CORS --> AUTH_MW --> ERR
    ELYSIA --> OPENAPI
    
    ERR --> C_CAUSE & C_DONATION & C_PAYMENT & C_WITHDRAWAL & C_USER & C_CATEGORY & C_CP & C_SUGGEST

    C_CAUSE --> S_CAUSE
    C_DONATION --> S_DONATION
    C_PAYMENT --> S_PAYMENT
    C_WITHDRAWAL --> S_WITHDRAWAL
    C_USER --> S_USER
    C_CATEGORY --> S_CATEGORY
    C_CP --> S_CP
    C_SUGGEST --> S_SUGGEST

    S_DONATION --> S_GAMIFICATION

    CONTAINER --> S_CAUSE & S_DONATION & S_PAYMENT & S_WITHDRAWAL & S_USER & S_CATEGORY & S_CP & S_SUGGEST

    S_CAUSE & S_DONATION & S_PAYMENT & S_WITHDRAWAL & S_USER & S_CATEGORY & S_CP & S_SUGGEST --> REPO
    S_CAUSE & S_SUGGEST --> S3
    S_CAUSE & S_DONATION & S_PAYMENT & S_SUGGEST --> EMAIL_Q
    S_PAYMENT --> MP_CLIENT

    REPO --> PG
    EMAIL_Q --> REDIS
    EMAIL_Q --> MAILER
```

### Estrutura de Pastas

```
backend/
├── prisma/
│   ├── schema.prisma          # Esquema do banco de dados
│   ├── migrations/            # Migrações SQL
│   └── seed-*.ts              # Scripts de seed
├── src/
│   ├── index.ts               # Bootstrap da aplicação
│   ├── auth.ts                # Configuração Better Auth
│   ├── container.ts           # Dependency Injection container
│   ├── modules/
│   │   ├── cause/             # Causas (CRUD + moderação + docs)
│   │   ├── donation/          # Doações + gamificação
│   │   ├── payment/           # Pagamentos PIX (Mercado Pago)
│   │   ├── withdrawal/        # Saques via PIX
│   │   ├── user/              # Perfil do usuário
│   │   ├── category/          # Categorias de causas
│   │   └── collection-points/ # Pontos de coleta + sugestões
│   ├── emails/                # Templates React Email
│   ├── jobs/                  # Workers BullMQ (email, payments)
│   ├── lib/                   # Integrações (Prisma, S3, MP, Mailer, BullMQ)
│   ├── errors/                # Classes de erro + códigos
│   ├── middleware/            # Auth middleware
│   └── plugins/               # Error handler plugin
├── docker-compose.yml         # PostgreSQL + Redis + API
├── Dockerfile                 # Multi-stage build com Bun
└── package.json
```

---

## 🛠 Stack Tecnológica

| Tecnologia | Uso |
|---|---|
| **[Bun](https://bun.sh)** | Runtime JavaScript ultrarrápido |
| **[Elysia](https://elysiajs.com)** | Framework HTTP com tipagem end-to-end |
| **[Prisma 7](https://prisma.io)** | ORM com runtime Bun e PostgreSQL |
| **[Better Auth](https://better-auth.com)** | Autenticação (email/senha, Google OAuth, OTP) |
| **[BullMQ](https://bullmq.io)** | Fila de jobs assíncronos (emails, pagamentos) |
| **[React Email](https://react.email)** | Templates de email renderizados server-side |
| **[Mercado Pago SDK](https://www.mercadopago.com.br/developers)** | Pagamentos PIX e transferências |
| **[Bun S3 Client](https://bun.sh/docs/api/s3)** | Upload de imagens/documentos (S3/R2 compatível) |
| **[Nodemailer](https://nodemailer.com)** | Envio de emails via SMTP |
| **PostgreSQL 15** | Banco de dados relacional |
| **Redis 7** | Broker de filas do BullMQ |
| **Docker** | Containerização e orquestração |

---

## 📦 Módulos do Sistema

```mermaid
graph LR
    subgraph "Core Modules"
        USER["👤 User"]
        AUTH["🔐 Auth<br/>(Better Auth)"]
    end

    subgraph "Donation Flow"
        CAUSE["📋 Cause"]
        DONATION["💰 Donation"]
        PAYMENT["💳 Payment"]
        WITHDRAWAL["🏦 Withdrawal"]
        GAMIFICATION["🎮 Gamification"]
    end

    subgraph "Community"
        CATEGORY["🏷 Category"]
        CP["📍 Collection Point"]
        SUGGEST["💡 Suggestion"]
    end

    subgraph "Infrastructure"
        EMAIL["📧 Email Queue"]
        S3["☁️ Storage"]
        MP["💳 Mercado Pago"]
    end

    AUTH --> USER
    CAUSE --> CATEGORY
    DONATION --> CAUSE
    DONATION --> GAMIFICATION
    PAYMENT --> DONATION
    PAYMENT --> MP
    WITHDRAWAL --> CAUSE
    WITHDRAWAL --> MP
    SUGGEST --> CP
    CAUSE --> S3
    CAUSE --> EMAIL
    DONATION --> EMAIL
    PAYMENT --> EMAIL
    SUGGEST --> S3
    SUGGEST --> EMAIL
```

### Cada módulo segue o padrão:

```
module/
├── module.controller.ts   # Rotas HTTP (Elysia plugin)
├── module.service.ts      # Lógica de negócio
├── module.repository.ts   # Acesso ao banco (Prisma)
├── module.schema.ts       # Validação de entrada (Typebox)
└── module.types.ts        # Interfaces e tipos TypeScript
```

---

## 🗄 Diagrama de Banco de Dados

```mermaid
erDiagram
    User ||--o{ Session : "tem"
    User ||--o{ Account : "tem"
    User ||--o{ Cause : "cria"
    User ||--o{ Donation : "faz"
    User ||--o{ Payment : "inicia"
    User ||--o{ Withdrawal : "solicita"
    User ||--o{ UserBadge : "ganha"
    User ||--o{ CollectionPointSuggestion : "sugere"

    Cause ||--o{ Donation : "recebe"
    Cause ||--o{ Payment : "recebe"
    Cause ||--o{ Withdrawal : "saca"
    Cause ||--o{ CauseImage : "tem"
    Cause ||--o{ CauseDocument : "tem"
    Cause }o--|| Category : "pertence"

    Payment |o--|| Donation : "gera"

    CollectionPoint ||--o{ AcceptedItem : "aceita"
    CollectionPointSuggestion ||--o{ SuggestionImage : "tem"

    User {
        string id PK
        string name
        string email UK
        boolean emailVerified
        string image
        int xpPoints
        float balance
        boolean isAdmin
        boolean isAnonymous
    }

    Cause {
        string id PK
        string title
        string description
        float goalAmount
        float raised
        float balance
        string status
        boolean isVerified
        boolean isFeatured
        string authorId FK
        string categoryId FK
        string city
        string state
        float latitude
        float longitude
    }

    Donation {
        string id PK
        float amount
        string message
        int xpEarned
        boolean isAnonymous
        string userId FK
        string causeId FK
    }

    Payment {
        string id PK
        string mpPaymentId UK
        string status
        float amount
        string payerEmail
        string qrCode
        string qrCodeBase64
        boolean isAnonymous
        string userId FK
        string causeId FK
        string donationId FK
    }

    Withdrawal {
        string id PK
        float amount
        string pixKey
        string status
        string mpTransferId
        string causeId FK
        string userId FK
    }

    UserBadge {
        string id PK
        string userId FK
        string badgeKey
        datetime earnedAt
    }

    Category {
        string id PK
        string name UK
        string description
    }

    CauseImage {
        string id PK
        string causeId FK
        string key
        int position
    }

    CauseDocument {
        string id PK
        string causeId FK
        string fileKey
        string fileName
        string docType
        string status
    }

    CollectionPoint {
        string id PK
        string name
        string street
        string city
        string state
        float latitude
        float longitude
        boolean isActive
    }

    AcceptedItem {
        string id PK
        string name
        string collectionPointId FK
    }

    CollectionPointSuggestion {
        string id PK
        string userId FK
        string name
        string city
        string state
        float latitude
        float longitude
        string status
        string adminNote
    }

    SuggestionImage {
        string id PK
        string suggestionId FK
        string key
        int position
    }
```

---

## 🔄 Fluxos Principais

### Fluxo de Doação via PIX

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant API as ⚡ API
    participant MP as 💳 Mercado Pago
    participant DB as 🐘 PostgreSQL
    participant Q as 📨 Email Queue
    participant M as 📧 Mailer

    U->>API: POST /payments/initiate
    API->>DB: Cria Payment (PENDING)
    API->>MP: Cria PIX Payment
    MP-->>API: QR Code + ID
    API->>DB: Atualiza Payment com dados MP
    API-->>U: { qrCode, qrCodeBase64, paymentId }
    
    Note over U: Usuário escaneia QR Code e paga

    MP->>API: POST /payments/webhook (approved)
    API->>MP: GET /v1/payments/:id (confirma status)
    MP-->>API: status: "approved"
    API->>DB: Cria Donation + XP + Badges (transação)
    API->>DB: Atualiza raised + balance da Causa
    API->>DB: Atualiza Payment → APPROVED
    API->>Q: Enfileira email de confirmação
    API-->>MP: 200 OK
    
    Q->>M: Processa job
    M-->>U: 📧 Email de confirmação com XP e badges
```

### Fluxo de Moderação de Causas

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant API as ⚡ API
    participant A as 🛡 Admin
    participant DB as 🐘 PostgreSQL
    participant Q as 📨 Email Queue

    U->>API: POST /causes (cria causa)
    API->>DB: Causa criada (status: ACTIVE)
    
    U->>API: POST /causes/:id/documents
    API->>DB: Anexa documento (status: PENDING)
    API->>Q: Email "Causa em análise"

    A->>API: PATCH /causes/admin/documents/:docId/review
    API->>DB: Atualiza status do documento

    A->>API: PATCH /causes/admin/:id/moderate
    API->>DB: Atualiza isVerified + status da causa
    API->>Q: Email "Causa aprovada/rejeitada"
```

### Fluxo de Saque

```mermaid
sequenceDiagram
    participant U as 👤 Dono da Causa
    participant API as ⚡ API
    participant DB as 🐘 PostgreSQL

    U->>API: POST /withdrawals
    API->>DB: Verifica ownership + saldo
    API->>DB: Decrementa balance atomicamente
    API->>DB: Cria Withdrawal (PENDING)
    API-->>U: { id, status, amount, pixKey }
```

---

## 🎮 Sistema de Gamificação

### Níveis

| Nível | Nome | XP Mínimo |
|:---:|---|---:|
| 1 | 🌱 Semente | 0 |
| 2 | 🌿 Broto | 100 |
| 3 | 🌳 Planta | 300 |
| 4 | 🌲 Árvore | 700 |
| 5 | 🌳🌳 Floresta | 1.500 |
| 6 | 🛡 Guardião | 3.000 |
| 7 | 🦸 Herói | 5.000 |

### Cálculo de XP

```
XP = max(1, floor(valor_doação_em_reais))

Bônus por marcos:
  • 1ª doação  → +50 XP
  • 5ª doação  → +20 XP
  • 10ª doação → +30 XP
  • 20ª doação → +50 XP
```

### Badges (Emblemas)

| Badge | Nome | Condição | Ícone |
|---|---|---|:---:|
| `FIRST_DONATION` | Primeiro Passo | 1ª doação realizada | 🌱 |
| `DONOR_5` | Doador Frequente | 5 doações | 💚 |
| `DONOR_10` | Generoso | 10 doações | 💛 |
| `DONOR_20` | Filantropo | 20 doações | 🏆 |
| `TOTAL_500` | Grande Doador | R$ 500 doados no total | ⭐ |
| `TOTAL_1000` | Herói da Comunidade | R$ 1.000 doados no total | 🦸 |

> **Nota:** Doações anônimas (`isAnonymous: true`) **não concedem** XP nem badges.

---

## 📡 Endpoints da API

A documentação interativa OpenAPI está disponível em `/docs` (protegida por Basic Auth).

### 🔐 Autenticação (Better Auth)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/sign-up/email` | Cadastro com email/senha |
| `POST` | `/api/sign-in/email` | Login com email/senha |
| `POST` | `/api/sign-in/social` | Login via Google OAuth |
| `POST` | `/api/email-otp/send-verification-otp` | Enviar OTP de verificação |
| `POST` | `/api/email-otp/verify-email` | Verificar email com OTP |
| `POST` | `/api/forget-password` | Solicitar reset de senha |

---

### 📋 Causas — `/causes`

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `GET` | `/causes` | ❌ | Listar causas ativas com filtros |
| `GET` | `/causes/:id` | ❌ | Buscar causa por ID |
| `POST` | `/causes` | ✅ | Criar nova causa |
| `PATCH` | `/causes/:id` | ✅ | Atualizar causa (autor) |
| `DELETE` | `/causes/:id` | ✅ | Deletar causa (autor) |
| `POST` | `/causes/:id/documents` | ✅ | Anexar documento de verificação |
| `GET` | `/causes/:id/documents` | ✅ | Listar documentos da causa |
| `GET` | `/causes/admin/pending` | ✅🛡 | Listar causas pendentes (admin) |
| `PATCH` | `/causes/admin/:id/moderate` | ✅🛡 | Moderar causa (admin) |
| `PATCH` | `/causes/admin/documents/:docId/review` | ✅🛡 | Aprovar/rejeitar documento (admin) |

**Filtros disponíveis em `GET /causes`:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `sort` | `string` | `recent` · `most_popular` · `most_urgent` · `nearest` |
| `city` | `string` | Filtro parcial por cidade |
| `state` | `string` | Filtro parcial por estado |
| `lat` | `number` | Latitude do usuário |
| `lng` | `number` | Longitude do usuário |
| `radius` | `number` | Raio em km (padrão: 50) |
| `categoryId` | `string` | Filtrar por categoria |
| `search` | `string` | Busca textual |
| `skip` / `take` | `number` | Paginação |

---

### 💰 Doações — `/donations`

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `POST` | `/donations` | ✅ | Fazer uma doação direta |
| `GET` | `/donations/me` | ✅ | Meu histórico de doações |
| `GET` | `/donations/:id` | ❌ | Buscar doação por ID |
| `GET` | `/donations/cause/:causeId` | ❌ | Doações de uma causa |
| `GET` | `/donations/leaderboard` | ❌ | Top doadores por XP |

---

### 💳 Pagamentos — `/payments`

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `POST` | `/payments/initiate` | ✅ | Iniciar pagamento PIX |
| `POST` | `/payments/webhook` | ❌ | Webhook do Mercado Pago |
| `GET` | `/payments/:id` | ❌ | Buscar pagamento por ID |
| `GET` | `/payments/me` | ✅ | Meus pagamentos |
| `GET` | `/payments/cause/:causeId` | ❌ | Pagamentos de uma causa |

---

### 🏦 Saques — `/withdrawals`

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `POST` | `/withdrawals` | ✅ | Solicitar saque via PIX |
| `GET` | `/withdrawals/me` | ✅ | Meus saques |
| `GET` | `/withdrawals/:id` | ❌ | Buscar saque por ID |
| `GET` | `/withdrawals/cause/:causeId` | ✅ | Saques de uma causa (dono) |

---

### 👤 Usuários — `/users`

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `GET` | `/users/:id` | ❌ | Buscar usuário por ID |
| `GET` | `/users/me` | ✅ | Meu perfil básico |
| `GET` | `/users/me/profile` | ✅ | Perfil completo (causas + doações) |
| `PATCH` | `/users/me` | ✅ | Atualizar perfil (nome, avatar) |

---

### 🏷 Categorias — `/categories`

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `GET` | `/categories` | ❌ | Listar categorias |
| `POST` | `/categories` | ✅🛡 | Criar categoria (admin) |

---

### 📍 Pontos de Coleta — `/collection-points`

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `GET` | `/collection-points` | ❌ | Listar pontos ativos com filtros |
| `GET` | `/collection-points/:id` | ❌ | Buscar ponto por ID |
| `GET` | `/collection-points/admin/all` | ✅🛡 | Listar todos (admin) |
| `POST` | `/collection-points` | ✅🛡 | Criar ponto (admin) |
| `PATCH` | `/collection-points/:id` | ✅🛡 | Atualizar ponto (admin) |
| `DELETE` | `/collection-points/:id` | ✅🛡 | Deletar ponto (admin) |

---

### 💡 Sugestões de Pontos — `/suggestions`

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `POST` | `/suggestions` | ✅ | Sugerir novo ponto de coleta |
| `GET` | `/suggestions/me` | ✅ | Minhas sugestões |
| `GET` | `/suggestions/admin/pending` | ✅🛡 | Sugestões pendentes (admin) |
| `PATCH` | `/suggestions/admin/:id/review` | ✅🛡 | Aprovar/rejeitar sugestão (admin) |

---

## 📧 Emails Transacionais

Todos os emails são processados via **BullMQ** (Redis) com retry automático (3 tentativas, backoff exponencial). Os templates são renderizados server-side com **React Email**.

| Tipo | Template | Trigger |
|---|---|---|
| 📧 OTP | `otp.tsx` | Verificação de email / Reset de senha |
| ✅ Confirmação de doação | `donation-confirmation.tsx` | Doação aprovada (via webhook) |
| ❌ Pagamento falhou | `payment-failed.tsx` | Webhook do MP com status rejeitado/cancelado |
| 📝 Causa em análise | `cause-under-review.tsx` | Documento anexado à causa |
| 🎉 Causa aprovada | `cause-approval.tsx` | Admin aprova a causa |
| 📍 Sugestão analisada | `suggestion-reviewed.tsx` | Admin revisa sugestão de ponto de coleta |

---

## 🚀 Setup Local

### Pré-requisitos

- **[Bun](https://bun.sh)** ≥ 1.x
- **PostgreSQL** 15+
- **Redis** 7+
- Conta no **Mercado Pago** (para pagamentos)
- Bucket **S3-compatível** (ex: Cloudflare R2, AWS S3, MinIO)

### 1. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/backend.git
cd backend
bun install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

### 3. Rodar migrações e gerar o Prisma Client

```bash
bunx prisma migrate dev
bunx prisma generate
```

### 4. (Opcional) Popular o banco com dados de teste

```bash
bun run prisma/seed-categories.ts
bun run prisma/seed-user.ts
bun run prisma/seed-causes.ts
bun run prisma/seed-collection-points.ts
bun run prisma/seed-suggestions.ts
```

### 5. Iniciar o servidor

```bash
bun run dev
```

O servidor estará disponível em `http://localhost:3000`.  
A documentação OpenAPI estará em `http://localhost:3000/docs`.

---

## 🐳 Docker

### Subir tudo com Docker Compose

```bash
docker compose up -d
```

Isso inicia 3 containers:

| Container | Porta | Descrição |
|---|---|---|
| `doacao_postgres` | 5432 | PostgreSQL 15 Alpine |
| `doacao_redis` | 6379 | Redis 7 Alpine (AOF) |
| `doacao_api` | 3000 | API (Bun + Elysia) |

### Build manual da imagem

```bash
docker build -t doacao-api .
```

O Dockerfile usa **multi-stage build**:
1. **Stage 1 (builder):** Instala deps + gera Prisma Client
2. **Stage 2 (production):** Copia artefatos, roda migrações no startup e inicia a aplicação

> Para mais detalhes sobre o Docker, consulte o [Docker-README.md](./Docker-README.md).

---

## 🔐 Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|:---:|---|
| `DATABASE_URL` | ✅ | Connection string do PostgreSQL |
| `BETTER_AUTH_SECRET` | ✅ | Secret para tokens de sessão |
| `BETTER_AUTH_URL` | ✅ | URL base da autenticação |
| `SMTP_HOST` | ✅ | Host do servidor SMTP |
| `SMTP_PORT` | ✅ | Porta SMTP (587 para TLS) |
| `SMTP_USER` | ✅ | Usuário SMTP |
| `SMTP_PASS` | ✅ | Senha/app password SMTP |
| `S3_ENDPOINT` | ✅ | Endpoint do storage S3-compatível |
| `S3_REGION` | ✅ | Região do bucket |
| `S3_BUCKET` | ✅ | Nome do bucket |
| `S3_ACCESS_KEY_ID` | ✅ | Access key do S3 |
| `S3_SECRET_ACCESS_KEY` | ✅ | Secret key do S3 |
| `MERCADOPAGO_ACCESS_TOKEN` | ✅ | Token de acesso do Mercado Pago |
| `GOOGLE_CLIENT_ID` | ❌ | Client ID do Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ❌ | Client Secret do Google OAuth |
| `REDIS_URL` | ❌ | URL do Redis (padrão: `redis://localhost:6379`) |
| `NODE_ENV` | ❌ | `development` ou `production` |
| `PORT` | ❌ | Porta do servidor (padrão: `3000`) |

---

## 📜 Scripts Úteis

```bash
# Desenvolvimento com hot-reload
bun run dev

# Gerar client Prisma
bunx prisma generate

# Rodar migrações
bunx prisma migrate dev

# Abrir Prisma Studio (GUI do banco)
bunx prisma studio

# Criar nova migração
bunx prisma migrate dev --name nome_da_migracao

# Docker compose
docker compose up -d      # Subir
docker compose down        # Derrubar
docker compose logs -f api # Ver logs da API
```

---

<p align="center">
  Feito com ❤️ para conectar doadores a causas que transformam vidas.
</p>
