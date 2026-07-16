import { prisma } from "../src/lib/prisma";

async function main() {

  const existing = await prisma.user.findUnique({ where: { email: "gabrieldiassantiago09@gmail.com" } });

  const user = existing ?? await prisma.user.create({
    data: {
      name: "Gabriel Dias Santiago",
      email: "gabrieldiassantiago09@gmail.com",
      emailVerified: true,
      isAdmin: true,
    },
  });

  console.log(`✅ Usuário de seed: ${user.email} (${user.id})`);
  console.log(`   Execute seed-causes.ts novamente com este usuário já criado.`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
