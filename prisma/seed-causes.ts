import { prisma } from "../src/lib/prisma";

async function main() {
  // ── Busca usuário ────────────────────────────────
  const user = await prisma.user.findFirst({ select: { id: true, email: true } });
  if (!user) {
    console.error("❌ Nenhum usuário encontrado. Crie um usuário primeiro.");
    process.exit(1);
  }

  // ── Busca ou cria categorias ────────────────────────────────
  let categories = await prisma.category.findMany({ select: { id: true, name: true } });

  if (categories.length === 0) {
    console.log("📦 Criando categorias...");
    await prisma.category.createMany({
      data: [
        { name: "Animais" },
        { name: "Saúde" },
        { name: "Educação" },
        { name: "Meio Ambiente" },
        { name: "Assistência Social" },
        { name: "Esporte" },
        { name: "Cultura e Arte" }
      ],
    });
    categories = await prisma.category.findMany({ select: { id: true, name: true } });
  }

  const cat = (name: string) =>
    categories.find((c) => c.name.toLowerCase().includes(name.toLowerCase()))?.id ??
    categories[0].id;

  console.log(`✅ Usando usuário: ${user.email}`);
  console.log(`✅ Categorias disponíveis: ${categories.map((c) => c.name).join(", ")}`);

  // Gera imagens reais com uma query relacionada usando Unsplash source alternativo / loremflickr
  // Para evitar que o front-end cacheie a mesma foto, usamos o parâmetro `lock` ou `random`
  const getImages = (keyword: string, count: number, startLock: number = 1) => {
    return Array.from({ length: count }).map(
      (_, i) => `https://loremflickr.com/800/600/${keyword}?lock=${startLock + i}`
    );
  };

  const causes = [
    // --- ANIMAIS ---
    {
      title: "Resgate e Castração de Animais Abandonados na Zona Leste",
      description: "Nossa ONG atua na Zona Leste de São Paulo, resgatando diariamente cães e gatos em situação de rua, atropelados ou vítimas de maus-tratos. Atualmente, temos mais de 150 animais sob nossos cuidados. Precisamos arrecadar fundos urgentemente para realizar mutirões de castração, comprar vacinas importadas (V10 e antirrábica) e garantir a alimentação de todos eles até que sejam adotados. O valor também ajudará em cirurgias ortopédicas de emergência.",
      goalAmount: 15000,
      raised: 4500,
      city: "São Paulo",
      state: "SP",
      country: "Brasil",
      address: "Rua do Oratório, 1200 - Mooca",
      latitude: -23.5739,
      longitude: -46.5938,
      categoryId: cat("animais"),
      images: getImages("dog,rescue", 4, 100),
    },
    {
      title: "Santuário de Aves Silvestres Apreendidas",
      description: "Este santuário é um refúgio seguro para aves de diversas espécies (araras, papagaios, tucanos) vitimadas pelo tráfico de animais silvestres. Nossa missão é reabilitá-las física e psicologicamente para que, se possível, voltem à natureza. Caso não possam voltar, recebem um lar definitivo com recintos espaçosos e alimentação adequada (frutas frescas e ração super premium). A doação financiará a construção de três novos recintos de voo livre.",
      goalAmount: 35000,
      raised: 12000,
      city: "Petrópolis",
      state: "RJ",
      country: "Brasil",
      address: "Estrada União e Indústria, 8000 - Itaipava",
      latitude: -22.3912,
      longitude: -43.1255,
      categoryId: cat("animais"),
      images: getImages("parrot,macaw", 4, 110),
    },
    {
      title: "Abrigo Gatinhos da Serra: Reforma e Ampliação",
      description: "Abrigos mais de 200 felinos em nossa base na Serra Gaúcha. Durante o inverno prolongado, o frio é muito intenso e nossas instalações atuais estão com o telhado comprometido e infiltrações severas. O objetivo desta causa é financiar a reforma total dos gatis, implementando isolamento térmico nas paredes e camas suspensas com aquecimento seguro para que nossos gatinhos de todas as idades não sofram nas baixas temperaturas.",
      goalAmount: 20000,
      raised: 18500,
      city: "Gramado",
      state: "RS",
      country: "Brasil",
      address: "Av. Borges de Medeiros, 10 - Centro",
      latitude: -29.3804,
      longitude: -50.8753,
      categoryId: cat("animais"),
      images: getImages("cat,kitten", 5, 120),
    },

    // --- SAÚDE ---
    {
      title: "Tratamento de Leucemia para o pequeno Lucas (4 anos)",
      description: "Lucas foi diagnosticado com uma forma rara de leucemia e precisa de um tratamento com urgência que não é totalmente coberto pelo nosso plano de saúde ou pelo SUS em nossa região. Os custos incluem medicamentos de alto custo para as sessões de quimioterapia, despesas com viagens semanais ao centro oncológico de referência e suplementação alimentar. Ajude o nosso menino a vencer esta batalha! Qualquer contribuição é uma gota de esperança.",
      goalAmount: 85000,
      raised: 35200,
      city: "Belo Horizonte",
      state: "MG",
      country: "Brasil",
      address: "Av. Afonso Pena, 2000 - Savassi",
      latitude: -19.9288,
      longitude: -43.9388,
      categoryId: cat("saúde"),
      images: getImages("hospital,child", 4, 130),
    },
    {
      title: "Cadeiras de Rodas Motorizadas para a AACD",
      description: "A mobilidade transforma vidas. Muitos dos nossos pacientes adolescentes precisam de cadeiras de rodas motorizadas para garantir independência para estudar e trabalhar, mas o custo de cada cadeira é muito elevado. Nossa meta é arrecadar fundos para adquirir e doar 5 cadeiras motorizadas para jovens atendidos por nossa unidade há mais de 10 anos. Eles já passaram por avaliações clínicas e estão aguardando ansiosamente essa mudança de vida.",
      goalAmount: 50000,
      raised: 5500,
      city: "Campinas",
      state: "SP",
      country: "Brasil",
      address: "Av. Brasil, 400 - Guanabara",
      latitude: -22.8833,
      longitude: -47.0700,
      categoryId: cat("saúde"),
      images: getImages("wheelchair,rehabilitation", 4, 140),
    },
    {
      title: "Carreta de Exames de Mamografia Itinerante",
      description: "Sabemos que o diagnóstico precoce salva vidas. Queremos equipar e colocar na estrada nossa primeira carreta itinerante que oferecerá exames de mamografia gratuitos para mulheres de cidades do interior do Nordeste, onde não há aparelhos disponíveis na rede pública local. O valor cobre a manutenção dos equipamentos radiológicos de ponta, pagamento da equipe técnica e insumos para os primeiros seis meses do projeto.",
      goalAmount: 120000,
      raised: 92000,
      city: "Recife",
      state: "PE",
      country: "Brasil",
      address: "Rua do Sol, 40 - Santo Antônio",
      latitude: -8.0619,
      longitude: -34.8789,
      categoryId: cat("saúde"),
      images: getImages("medical,exam", 4, 150),
    },

    // --- EDUCAÇÃO ---
    {
      title: "Laboratório de Informática na Comunidade do Gesso",
      description: "O pleno acesso à tecnologia é essencial para a educação contemporânea. Nossa escola comunitária atende cerca de 300 crianças e adolescentes do Gesso, e não tem um laboratório de informática há anos devido aos equipamentos queimados por raios. A meta é comprar 20 computadores novos, fones de ouvido, mesas ergonômicas e instalar internet de alta velocidade, além de garantir suporte técnico por um ano. Estamos preparando o futuro!",
      goalAmount: 40000,
      raised: 12000,
      city: "Crato",
      state: "CE",
      country: "Brasil",
      address: "Rua São Pedro, 80 - Pinto Madeira",
      latitude: -7.2348,
      longitude: -39.4124,
      categoryId: cat("educação"),
      images: getImages("computer,classroom", 4, 160),
    },
    {
      title: "Bolsas de Estudo para Jovens Negros na Tecnologia",
      description: "O projeto 'Tech Para Todos' cria pontes sólidas para tentar combater a desigualdade racial nas empresas de tecnologia. Esta campanha financiará diretamente 30 bolsas de estudo completas de um ano em um bootcamp intensivo de programação Full Stack (React, Node.js, Python), incluindo um auxílio financeiro mensal de meio salário mínimo, computador emprestado e mentoria profissional, garantindo que os jovens não precisem abandonar os estudos para trabalhar precariamente.",
      goalAmount: 90000,
      raised: 75000,
      city: "Salvador",
      state: "BA",
      country: "Brasil",
      address: "Largo do Pelourinho, 1 - Centro Histórico",
      latitude: -12.9718,
      longitude: -38.5074,
      categoryId: cat("educação"),
      images: getImages("programming,students", 4, 170),
    },
    {
      title: "Biblioteca Itinerante Barca dos Sonhos (Rio Amazonas)",
      description: "Muitas comunidades ribeirinhas no estado do Amazonas não possuem acesso a livros de literatura. A 'Barca dos Sonhos' é um barco de três andares que estamos convertendo numa biblioteca flutuante e espaço cultural móvel. A embarcação precisa de repintura do casco, adequações de segurança, móveis impermeáveis e uma aquisição de um acervo inicial de 5 mil exemplares voltados ao público infanto-juvenil. Venha participar desta viagem mágica!",
      goalAmount: 65000,
      raised: 15400,
      city: "Manaus",
      state: "AM",
      country: "Brasil",
      address: "Porto de Manaus, Centro",
      latitude: -3.1387,
      longitude: -60.0216,
      categoryId: cat("educação"),
      images: getImages("books,boat", 4, 180),
    },

    // --- MEIO AMBIENTE ---
    {
      title: "Recuperação de Nascentes do Cerrado Mineiro",
      description: "O Cerrado é a caixa d'água do Brasil, mas devido ao agronegócio predatório, inúmeras nascentes estão secando. Nosso grupo de ativistas vai focar na recuperação e no cercamento urgente de 20 nascentes importantes que abastecem pequenos municípios do interior. Também compraremos mudas de árvores nativas do cerrado e organizaremos mutirões com voluntários locais e estudantes universitários para reflorestar a área ao longo dos próximos três meses.",
      goalAmount: 28000,
      raised: 9200,
      city: "Uberlândia",
      state: "MG",
      country: "Brasil",
      address: "Rodovia BR-050, KM 65",
      latitude: -18.9186,
      longitude: -48.2772,
      categoryId: cat("meio"),
      images: getImages("nature,water,river", 4, 190),
    },
    {
      title: "Mutirão Limpa Praia: Retirada de Microplásticos",
      description: "Embora algumas praias pareçam limpas no horizonte, suas areias estão infestadas de microplásticos. Estima-se que removeremos mais de 2 toneladas de resíduos plásticos da Praia de Boa Viagem e região metropolitana de Recife usando equipamentos de peneira mecanizada inovadores e apoio de 500 mergulhadores e voluntários para limpeza de recifes. Precisamos bancar logística, equipamento de proteção, e o devido descarte ecologicamente responsável.",
      goalAmount: 22000,
      raised: 21500,
      city: "Recife",
      state: "PE",
      country: "Brasil",
      address: "Av. Boa Viagem, 1000",
      latitude: -8.1189,
      longitude: -34.8931,
      categoryId: cat("meio"),
      images: getImages("beach,plastic,cleaning", 4, 200),
    },

    // --- ASSISTÊNCIA SOCIAL ---
    {
      title: "Sopa Solidária das Madrugadas Geladas de Curitiba",
      description: "No forte inverno do sul, a população em situação de rua sofre com a fome aguda e hipotermia severa. Nossa ONG 'Coração Quente' prepara panelões com mais de 800 litros de sopa rica em proteínas e vitaminas todas as noites entre maio e setembro. O projeto precisa de dinheiro para adquirir uma van furgão usada em estado razoável, que servirá única e exclusivamente para acelerar a distribuição de alimentos e cobertores pelas praças antes que esfrie.",
      goalAmount: 60000,
      raised: 42000,
      city: "Curitiba",
      state: "PR",
      country: "Brasil",
      address: "Praça Rui Barbosa, Centro",
      latitude: -25.4357,
      longitude: -49.2741,
      categoryId: cat("social"),
      images: getImages("soup,homeless", 4, 210),
    },
    {
      title: "Construção de Moradias Dignas no Sertão Paraibano",
      description: "Ainda existem famílias no sertão profundo que vivem em construções de taipa (barro), extremamente vulneráveis a desabamentos, chuvas e ao inseto barbeiro (causador da doença de chagas). O projeto Cimento e Teto utiliza técnicas rápidas de construção civil modular para erguer casas de tijolo adequadas em um final de semana com ajuda comunitária profunda. Cada casa custa 18 mil reais e nossa meta é dar um lar seguro para 5 famílias de pequenos agricultores da região.",
      goalAmount: 90000,
      raised: 15300,
      city: "Campina Grande",
      state: "PB",
      country: "Brasil",
      address: "Centro - Praça da Bandeira",
      latitude: -7.2289,
      longitude: -35.8821,
      categoryId: cat("social"),
      images: getImages("house,construction", 5, 220),
    },
    {
      title: "Kit Dignidade Menstrual para Meninas da Favela",
      description: "Muitas adolescentes deixam de ir à escola e perdem até 45 dias letivos no ano por simples falta de acesso a absorventes higiênicos, um problema alarmante de saúde pública conhecido como Pobreza Menstrual. O instituto Florescer vai montar e distribuir ao menos 10.000 kits de dignidade (contendo absorventes descartáveis, calcinhas e sabonetes diários) acompanhado de palestras de autoconhecimento ministradas por médicas ginecologistas.",
      goalAmount: 25000,
      raised: 25000, // Goal reached!
      city: "Rio de Janeiro",
      state: "RJ",
      country: "Brasil",
      address: "Complexo da Maré",
      latitude: -22.8596,
      longitude: -43.2423,
      categoryId: cat("social"),
      images: getImages("hygiene,woman", 4, 230),
    },

    // --- ESPORTE ---
    {
      title: "Quimonos de Judô e Tatame para o Projeto Gol de Placa",
      description: "Nosso galpão que antes estava abandonado agora abriga um sonho: o dojô comunitário 'Lutando pela Vida'. Atualmente 80 jovens batem no peito pedindo pra treinar pesado todos os dias, e se afastam das influências das drogas do bairro, mas a gente treina num chão improvisado muito duro, o que causa várias lesões nos alunos. Queremos equipar o dojô com 100m² de tatame profissional emborrachado oficial (placas grossas) e comprar 50 quimonos novos de alta durabilidade.",
      goalAmount: 18000,
      raised: 7500,
      city: "Belford Roxo",
      state: "RJ",
      country: "Brasil",
      address: "Rua do Valério, 30",
      latitude: -22.7661,
      longitude: -43.3957,
      categoryId: cat("esporte"),
      images: getImages("judo,tatami", 4, 240),
    },
    {
      title: "Bicicletas Inclusivas para Crianças e Adultos Autistas",
      description: "Oferecer a liberdade do vento no rosto. Essa causa quer importar peças para adaptarmos cerca de trinta bicicletas. Montaremos triciclos e bicicletas articuladas side-car (duplas), as quais permitem que cuidadores e famílias possam pedalar ao lado e com a ajuda de jovens com TAI (Transtorno do Espectro Autista) ou síndrome de down e dificuldades motoras, aumentando suas capacidades e proporcionando esporte, coordenação e pura alegria familiar no parque municipal.",
      goalAmount: 32000,
      raised: 15000,
      city: "Porto Alegre",
      state: "RS",
      country: "Brasil",
      address: "Parque Farroupilha",
      latitude: -30.0381,
      longitude: -51.2185,
      categoryId: cat("esporte"),
      images: getImages("bicycle,inclusive", 4, 250),
    },

    // --- CULTURA E ARTE ---
    {
      title: "Instrumentos de Corda para Orquestra Jovem da Comunidade",
      description: "A Orquestra Sinfônica Popular atende jovens talentos que não têm condições próprias de comprar instrumentos clássicos. Nosso atual acervo está mofando e as cordas vivendo arrebentando nos ensaios diários, prejudicando muito o andamento e o preparo para as competições regionais e os recitais em datas comungadas. Vamos investir esse valor em 15 violinos profissionais usados, 5 cellos restaurados de luthiers e em encordoamento em geral de alta qualidade para o ano.",
      goalAmount: 48000,
      raised: 28000,
      city: "Goiânia",
      state: "GO",
      country: "Brasil",
      address: "Av. Goiás, 100",
      latitude: -16.6799,
      longitude: -49.2550,
      categoryId: cat("arte"),
      images: getImages("violin,orchestra", 4, 260),
    },
    {
      title: "Revitalização do Teatro Central com Cadeiras Acessíveis",
      description: "O Teatro do Povo do Bairro Amarelo é histórico, conta com mais de 70 anos e tem muita arte cênica gratuita, entretanto ele perdeu seu luxo, está muito degradado e com cupins nas antigas poltronas estofadas. Para reabrir as portas ao público integral com máximo conforto e oferecer ingressos de valor popular o ano todo, vamos focar em instalar 200 novas cadeiras ergométricas injetadas de material anti-chamas e adicionar espaços rampados modernos.",
      goalAmount: 150000,
      raised: 11000,
      city: "Belém",
      state: "PA",
      country: "Brasil",
      address: "Av. Nossa Sra. de Nazaré, 2038",
      latitude: -1.4550,
      longitude: -48.4902,
      categoryId: cat("arte"),
      images: getImages("theater,stage", 4, 270),
    },

    // --- OUTROS E MISTOS ---
    {
      title: "Saneamento Básico e Cisternas para Aldeia Indígena",
      description: "Nossos parceiros das aldeias sofrem sem reservatório correto de água durante a estiagem prolongada. O intuito é garantir que a escola da aldeia e mais 25 ocas não fiquem vulneráveis a desabastecimento através da compra de materiais para construção e implantação local de sistemas rurais robustos e eficientes de captação de água pluvial vindas dos telhados com reservatórios/cisternas fechados e modernos sem risco de dengue. O excedente financiará caixas d água.",
      goalAmount: 55000,
      raised: 25000,
      city: "Dourados",
      state: "MS",
      country: "Brasil",
      address: "Reserva Indígena",
      latitude: -22.2238,
      longitude: -54.8058,
      categoryId: cat("social"),
      images: getImages("indigenous,water", 4, 280),
    },
    {
      title: "Oficina de Geração de Renda em Costura Criativa",
      description: "Uma máquina boa transforma trapos em recomeços. Essa organização de empoderamento atendeu mães sozinhas cheias de dependência. Vamos focar a causa e sua doação na montagem e equipamento de um galpão profissional de costura com: aquisição de 10 máquinas industriais, tecidos variados atacado sob demanda (jeans, malha e algodão reciclável focado em upcycling) para garantir aos menos 6 meses de oficina. Toda renda com o patchwork é 100% delas para seu sustento digno e duradouro.",
      goalAmount: 38000,
      raised: 37500,
      city: "Vitória",
      state: "ES",
      country: "Brasil",
      address: "Av. Vitória, 3000",
      latitude: -20.3155,
      longitude: -40.3128,
      categoryId: cat("educação"),
      images: getImages("sewing,woman", 4, 290),
    }
  ];

  console.log(`\n🌱 Criando ${causes.length} causas detalhadas com imagens...\n`);

  for (const causeData of causes) {
    const { images, ...data } = causeData;
    const isGoalReached = data.raised >= data.goalAmount;

    try {
      const created = await prisma.cause.create({
        data: {
          ...data,
          status: "ACTIVE",
          authorId: user.id,
          isFeatured: Math.random() > 0.7,
          isGoalReached,
          // Insere as imagens relativas
          images: {
            create: images.map((url, idx) => ({
              key: url,
              position: idx,
            }))
          }
        },
      });
      console.log(
        `  ✅ [${created.city}] ${created.title.substring(0, 50)}... (criada c/ ${images.length} fotos)`
      );
    } catch (e) {
      console.error(`  ❌ Falha ao criar causa: ${data.title}`, e);
    }
  }

  console.log("\n🎉 Seed de causas (com imagens detalhadas) concluído com sucesso!");
  console.log("\nDicas para testar no front-end:");
  console.log("  Perto de SP (50km): GET /causes?sort=nearest&lat=-23.5739&lng=-46.5938&radius=50");
  console.log("  Mais urgentes:      GET /causes?sort=most_urgent");
  console.log("  Mais populares:     GET /causes?sort=most_popular");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
