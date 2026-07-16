#!/bin/bash

# Script para gerenciar o ambiente Docker do projeto Doacao
# Uso: ./docker.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Docker e Docker Compose estão instalados
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado!"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado!"
        exit 1
    fi

    info "Docker e Docker Compose estão instalados ✓"
}

# Criar arquivo .env se não existir
setup_env() {
    if [ ! -f .env ]; then
        warning "Arquivo .env não encontrado. Criando a partir do .env.example..."
        cp .env.example .env
        warning "Por favor, edite o arquivo .env com suas configurações antes de continuar!"
        echo "Principais variáveis a configurar:"
        echo "- BETTER_AUTH_SECRET (use uma string aleatória segura)"
        echo "- Configurações SMTP (se for usar email)"
        read -p "Pressione Enter para continuar após configurar o .env..."
    fi
}

# Iniciar serviços
start() {
    info "Iniciando serviços..."
    setup_env
    docker-compose up -d
    
    info "Aguardando serviços ficarem prontos..."
    sleep 5
    
    # Verificar se os serviços estão rodando
    if docker-compose ps | grep -q "Up"; then
        success "Serviços iniciados com sucesso!"
        echo ""
        echo "🌐 API: http://localhost:3000"
        echo "📚 Documentação: http://localhost:3000/docs"
        echo "🗄️  PostgreSQL: localhost:5432"
        echo ""
        echo "Para ver os logs: ./docker.sh logs"
    else
        error "Erro ao iniciar serviços. Verifique os logs: ./docker.sh logs"
    fi
}

# Parar serviços
stop() {
    info "Parando serviços..."
    docker-compose down
    success "Serviços parados!"
}

# Reiniciar serviços
restart() {
    info "Reiniciando serviços..."
    docker-compose restart
    success "Serviços reiniciados!"
}

# Mostrar logs
logs() {
    if [ -n "$2" ]; then
        info "Mostrando logs do serviço: $2"
        docker-compose logs -f "$2"
    else
        info "Mostrando logs de todos os serviços..."
        docker-compose logs -f
    fi
}

# Status dos serviços
status() {
    info "Status dos serviços:"
    docker-compose ps
}

# Rebuild da API
rebuild() {
    info "Reconstruindo a API..."
    docker-compose build api
    docker-compose up -d api
    success "API reconstruída!"
}

# Executar comando no container da API
exec_api() {
    shift # Remove o primeiro argumento (exec)
    info "Executando comando na API: $*"
    docker-compose exec api "$@"
}

# Executar migrações Prisma
migrate() {
    info "Executando migrações Prisma..."
    docker-compose exec api bunx prisma migrate deploy
    success "Migrações executadas!"
}

# Seed do banco
seed() {
    info "Executando seed do banco..."
    docker-compose exec api bunx prisma db seed
    success "Seed executado!"
}

# Reset completo (remove volumes)
reset() {
    warning "Isso irá remover TODOS os dados do banco!"
    read -p "Tem certeza? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Removendo tudo..."
        docker-compose down -v
        docker-compose build
        docker-compose up -d
        success "Reset completo realizado!"
    else
        info "Operação cancelada."
    fi
}

# Backup do banco
backup() {
    info "Criando backup do banco..."
    timestamp=$(date +"%Y%m%d_%H%M%S")
    docker-compose exec postgres pg_dump -U postgres doacao > "backup_${timestamp}.sql"
    success "Backup criado: backup_${timestamp}.sql"
}

# Help
show_help() {
    echo "🐳 Script de gerenciamento Docker - Projeto Doacao"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start         - Inicia todos os serviços"
    echo "  stop          - Para todos os serviços"
    echo "  restart       - Reinicia todos os serviços"
    echo "  status        - Mostra status dos serviços"
    echo "  logs [serviço] - Mostra logs (opcionalmente de um serviço específico)"
    echo "  rebuild       - Reconstrói e reinicia a API"
    echo "  exec [cmd]    - Executa comando no container da API"
    echo "  migrate       - Executa migrações Prisma"
    echo "  seed          - Executa seed do banco"
    echo "  backup        - Cria backup do banco"
    echo "  reset         - Reset completo (remove dados)"
    echo "  help          - Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 start"
    echo "  $0 logs api"
    echo "  $0 exec bun --version"
}

# Main
main() {
    check_dependencies
    
    case "${1:-help}" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        status)
            status
            ;;
        logs)
            logs "$@"
            ;;
        rebuild)
            rebuild
            ;;
        exec)
            exec_api "$@"
            ;;
        migrate)
            migrate
            ;;
        seed)
            seed
            ;;
        backup)
            backup
            ;;
        reset)
            reset
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Comando desconhecido: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"