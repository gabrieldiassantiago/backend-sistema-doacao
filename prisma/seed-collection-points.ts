import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Iniciando seed de pontos de coleta...");

  const points = [
    {
      name: "EcoPonto Lorena Centro",
      street: "Rua Principal",
      number: "100",
      neighborhood: "Centro",
      city: "Lorena",
      state: "SP",
      zipCode: "12600-000",
      latitude: -22.7317,
      longitude: -45.1206,
      acceptedItems: ["Papel", "Plástico", "Vidro", "Metal"],
    },
    {
      name: "Ponto de Coleta Seletiva Guará",
      street: "Av. Juscelino Kubitschek",
      number: "500",
      neighborhood: "Vila Paraíba",
      city: "Guaratinguetá",
      state: "SP",
      zipCode: "12500-000",
      latitude: -22.8164,
      longitude: -45.1917,
      acceptedItems: ["Eletrônicos", "Pilhas", "Baterias"],
    },
    {
      name: "Centro de Reciclagem Taubaté",
      street: "Rua do Bosque",
      number: "SN",
      neighborhood: "Independência",
      city: "Taubaté",
      state: "SP",
      zipCode: "12000-000",
      latitude: -23.0264,
      longitude: -45.5558,
      acceptedItems: ["Óleo de Cozinha", "Pneus", "Móveis Antigos"],
    },
    {
      name: "Coleta Solidária Aparecida",
      street: "Rua das Oliveiras",
      number: "22",
      neighborhood: "Ponte Alta",
      city: "Aparecida",
      state: "SP",
      zipCode: "12570-000",
      latitude: -22.8469,
      longitude: -45.2302,
      acceptedItems: ["Roupas", "Alimentos", "Brinquedos"],
    },
    {
      name: "EcoPonto São José - Centro",
      street: "Av. Nelson d'Ávila",
      number: "1200",
      neighborhood: "Centro",
      city: "São José dos Campos",
      state: "SP",
      zipCode: "12245-000",
      latitude: -23.1891,
      longitude: -45.8844,
      acceptedItems: ["Papel", "Cartão", "Lixo Eletrônico"],
    },
    {
      name: "Ponto de Entrega Voluntária (PEV) Jacareí",
      street: "Rua das Indústrias",
      number: "333",
      neighborhood: "Parque Industrial",
      city: "Jacareí",
      state: "SP",
      zipCode: "12300-000",
      latitude: -23.3053,
      longitude: -45.9658,
      acceptedItems: ["Entulho", "Restos de Poda", "Madeira"],
    },
  ];

  for (const point of points) {
    const { acceptedItems, ...pointData } = point;
    
    // Verifica se já existe para evitar duplicatas básicas pelo nome e cidade
    const existing = await prisma.collectionPoint.findFirst({
      where: { name: point.name, city: point.city }
    });

    if (!existing) {
      const createdPoint = await prisma.collectionPoint.create({
        data: {
          ...pointData,
          isActive: true,
          acceptedItems: {
            create: acceptedItems.map(item => ({ name: item }))
          }
        }
      });
      console.log(`✅ Criado: ${createdPoint.name} em ${createdPoint.city}`);
    } else {
      console.log(`⏩ Pulado: ${point.name} já existe.`);
    }
  }

  console.log("🎉 Seed de pontos de coleta finalizado!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
