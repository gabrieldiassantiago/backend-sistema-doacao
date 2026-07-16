import { prisma } from "../src/lib/prisma";

const CATEGORIES = [
  {
    name: "Animais",
    description: "Causas voltadas para proteção, resgate e bem-estar animal.",
  },
  {
    name: "Saúde",
    description: "Apoio a tratamentos médicos, hospitais e campanhas de saúde pública.",
  },
  {
    name: "Educação",
    description: "Iniciativas de ensino, bolsas de estudo, materiais escolares e bibliotecas.",
  },
  {
    name: "Meio Ambiente",
    description: "Reflorestamento, reciclagem, conservação e sustentabilidade.",
  },
  {
    name: "Assistência Social",
    description: "Apoio a famílias em vulnerabilidade, abrigos e distribuição de alimentos.",
  },
  {
    name: "Crianças e Jovens",
    description: "Projetos voltados para o desenvolvimento e proteção de crianças e adolescentes.",
  },
  {
    name: "Idosos",
    description: "Causas de amparo, cuidado e inclusão para a terceira idade.",
  },
  {
    name: "Pessoas com Deficiência",
    description: "Inclusão, acessibilidade e suporte para pessoas com deficiência.",
  },
  {
    name: "Cultura e Arte",
    description: "Projetos culturais, artísticos e de preservação do patrimônio.",
  },
  {
    name: "Esporte",
    description: "Incentivo ao esporte, lazer e atividade física em comunidades.",
  },
];

async function main() {
  console.log("🌱 Criando categorias...\n");

  let created = 0;
  let skipped = 0;

  for (const cat of CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { name: cat.name } });

    if (existing) {
      console.log(`⏩ Pulado: "${cat.name}" já existe.`);
      skipped++;
    } else {
      await prisma.category.create({ data: cat });
      console.log(`✅ Criado: "${cat.name}"`);
      created++;
    }
  }

  console.log(`\n🎉 Concluído! ${created} criadas, ${skipped} já existiam.`);

  const all = await prisma.category.findMany({ select: { id: true, name: true } });
  console.log("\n📋 Todas as categorias no banco:");
  all.forEach((c) => console.log(`   ${c.id}  →  ${c.name}`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
