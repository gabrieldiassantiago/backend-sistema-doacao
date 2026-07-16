import { prisma } from "../src/lib/prisma";

/**
 * Seed de teste para o fluxo de Sugestão de Ponto de Coleta.
 *
 * Cria:
 *   1. Um usuário ADMIN (admin@teste.com)
 *   2. Um usuário comum (user@teste.com)
 *   3. Duas sugestões de pontos de coleta enviadas pelo usuário comum
 *      (uma com imagens simuladas e outra sem)
 *
 * Senhas: ambos usam "Teste@123" (hash gerado via Bun.password)
 *
 * Uso:
 *   bun run prisma/seed-suggestions.ts
 */

const ADMIN_EMAIL = "admin@teste.com";
const USER_EMAIL  = "user@teste.com";
const PASSWORD    = "Teste@123";

async function main() {
  console.log("🌱 Seed de sugestões de pontos de coleta\n");

  // ── Hash da senha ────────────────────────────────────────────────────────
  const passwordHash = await Bun.password.hash(PASSWORD, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // ── 1. Criar usuário ADMIN ───────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      name: "Admin Teste",
      email: ADMIN_EMAIL,
      emailVerified: true,
      isAdmin: true,
      passwordHash,
    },
  });
  console.log(`✅ Admin criado: ${admin.email} (id: ${admin.id})`);

  // ── 2. Criar conta (Account) para o admin ────────────────────────────────
  const adminAccountId = `account-admin-${admin.id}`;
  await prisma.account.upsert({
    where: { id: adminAccountId },
    update: {},
    create: {
      id: adminAccountId,
      accountId: admin.id,
      providerId: "credential",
      userId: admin.id,
      password: passwordHash,
    },
  });
  console.log(`   📧 Account (credential) vinculada ao admin`);

  // ── 3. Criar usuário comum ───────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: USER_EMAIL },
    update: {},
    create: {
      name: "João da Silva",
      email: USER_EMAIL,
      emailVerified: true,
      isAdmin: false,
      passwordHash,
    },
  });
  console.log(`✅ User criado: ${user.email} (id: ${user.id})`);

  // ── 4. Criar conta (Account) para o user ──────────────────────────────────
  const userAccountId = `account-user-${user.id}`;
  await prisma.account.upsert({
    where: { id: userAccountId },
    update: {},
    create: {
      id: userAccountId,
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: passwordHash,
    },
  });
  console.log(`   📧 Account (credential) vinculada ao user`);

  // ── 5. Criar sugestões de ponto de coleta ─────────────────────────────────

  const suggestion1 = await prisma.collectionPointSuggestion.create({
    data: {
      userId: user.id,
      name: "Igreja São Benedito - Ponto de Doações",
      street: "Rua Dom Bosco",
      number: "45",
      complement: "Ao lado da praça",
      neighborhood: "Centro",
      city: "Lorena",
      state: "SP",
      zipCode: "12600-010",
      latitude: -22.7290,
      longitude: -45.1235,
      suggestedItems: ["Roupas", "Alimentos não perecíveis", "Cobertores", "Brinquedos"],
      reason: "A igreja já recebe doações informais há anos. Seria ótimo oficializar como ponto de coleta. Fica na praça central, muito movimentado.",
      status: "PENDING",
      // Sem imagens nessa sugestão
    },
    include: { images: true },
  });
  console.log(`\n📍 Sugestão 1 criada: "${suggestion1.name}" (status: ${suggestion1.status})`);
  console.log(`   ID: ${suggestion1.id}`);
  console.log(`   Itens: ${suggestion1.suggestedItems.join(", ")}`);

  const suggestion2 = await prisma.collectionPointSuggestion.create({
    data: {
      userId: user.id,
      name: "Mercadinho do Zé - Coleta de Recicláveis",
      street: "Av. Brasil",
      number: "780",
      neighborhood: "Vila Nova",
      city: "Guaratinguetá",
      state: "SP",
      zipCode: "12500-100",
      latitude: -22.8120,
      longitude: -45.1940,
      suggestedItems: ["Plástico", "Papelão", "Latas de alumínio", "Vidro"],
      reason: "O dono do mercadinho, seu Zé, se voluntariou para receber materiais recicláveis. Tem um galpão nos fundos que pode ser usado como depósito.",
      status: "PENDING",
      // Simula imagens (keys fictícias, como se já tivessem sido uploaded)
      images: {
        create: [
          { key: "suggestions/fachada-mercadinho-ze.jpg", position: 0 },
          { key: "suggestions/galpao-fundos.jpg", position: 1 },
        ],
      },
    },
    include: { images: true },
  });
  console.log(`\n📍 Sugestão 2 criada: "${suggestion2.name}" (status: ${suggestion2.status})`);
  console.log(`   ID: ${suggestion2.id}`);
  console.log(`   Itens: ${suggestion2.suggestedItems.join(", ")}`);
  console.log(`   Imagens: ${suggestion2.images.length} foto(s) anexadas`);

  // ── Resumo ────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("🎉 Seed concluído! Dados para teste:\n");
  console.log("┌─────────────────────────────────────────────────┐");
  console.log("│  ADMIN                                          │");
  console.log(`│  Email: ${ADMIN_EMAIL.padEnd(40)}│`);
  console.log(`│  Senha: ${PASSWORD.padEnd(40)}│`);
  console.log("├─────────────────────────────────────────────────┤");
  console.log("│  USUÁRIO                                        │");
  console.log(`│  Email: ${USER_EMAIL.padEnd(40)}│`);
  console.log(`│  Senha: ${PASSWORD.padEnd(40)}│`);
  console.log("└─────────────────────────────────────────────────┘");
  console.log("\n📋 Fluxo de teste sugerido:");
  console.log("   1. Logar como USER  → GET /collection-points/suggestions/mine");
  console.log("   2. Logar como ADMIN → GET /collection-points/suggestions/admin/pending");
  console.log(`   3. Aprovar sugestão → PATCH /collection-points/suggestions/admin/${suggestion1.id}/review`);
  console.log('      Body: { "status": "APPROVED", "adminNote": "Local verificado!" }');
  console.log(`   4. Rejeitar sugestão → PATCH /collection-points/suggestions/admin/${suggestion2.id}/review`);
  console.log('      Body: { "status": "REJECTED", "adminNote": "Endereço incorreto" }');
  console.log("   5. Verificar email do user com a notificação");
  console.log("   6. GET /collection-points → Ponto aprovado deve aparecer!\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
