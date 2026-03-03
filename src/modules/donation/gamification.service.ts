import { BadgeKey } from "../../../generated/prisma/client";

export type LevelDef = {
  level: number;
  name: string;
  minXp: number;
};


export type LevelInfo = LevelDef & {
  nextLevelXp: number | null;
  progressPercent: number;
};


export const LEVELS: LevelDef[] = [
  { level: 1, name: "Semente",  minXp: 0    },
  { level: 2, name: "Broto",    minXp: 100  },
  { level: 3, name: "Planta",   minXp: 300  },
  { level: 4, name: "Árvore",   minXp: 700  },
  { level: 5, name: "Floresta", minXp: 1500 },
  { level: 6, name: "Guardião", minXp: 3000 },
  { level: 7, name: "Herói",    minXp: 5000 },
];


export type BadgeMeta = {
  key: BadgeKey;
  name: string;
  description: string;
  icon: string;
};


export const BADGE_META: Record<BadgeKey, BadgeMeta> = {
  FIRST_DONATION: {
    key: "FIRST_DONATION",
    name: "Primeiro Passo",
    description: "Realizou sua primeira doação",
    icon: "🌱",
  },
  DONOR_5: {
    key: "DONOR_5",
    name: "Doador Frequente",
    description: "Realizou 5 doações",
    icon: "💚",
  },
  DONOR_10: {
    key: "DONOR_10",
    name: "Generoso",
    description: "Realizou 10 doações",
    icon: "💛",
  },
  DONOR_20: {
    key: "DONOR_20",
    name: "Filantropo",
    description: "Realizou 20 doações",
    icon: "🏆",
  },
  TOTAL_500: {
    key: "TOTAL_500",
    name: "Grande Doador",
    description: "Doou R$ 500 no total",
    icon: "⭐",
  },
  TOTAL_1000: {
    key: "TOTAL_1000",
    name: "Herói da Comunidade",
    description: "Doou R$ 1.000 no total",
    icon: "🦸",
  },
};


/**
 * Retorna as informações do nível atual para uma quantidade de XP fornecida.
 */

export function computeLevel(xpPoints: number): LevelInfo {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xpPoints >= l.minXp) current = l;
    else break;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] ?? null;
  const progressPercent = next
    ? Math.floor(((xpPoints - current.minXp) / (next.minXp - current.minXp)) * 100)
    : 100;


  return { ...current, nextLevelXp: next?.minXp ?? null, progressPercent };
}


/**
 * Calcula o XP ganho por uma doação.
 * @param amount             - Valor da doação em R$
 * @param donationCountAfter - Total de doações APÓS esta doação (base 1)
 */
export function computeXpForDonation(amount: number, donationCountAfter: number): number {
  // Base: 1 XP por real doado
  let xp = Math.max(1, Math.floor(amount));


  // Bônus por marcos atingidos
  if (donationCountAfter === 1)  xp += 50; // bônus de primeira doação
  if (donationCountAfter === 5)  xp += 20;
  if (donationCountAfter === 10) xp += 30;
  if (donationCountAfter === 20) xp += 50;


  return xp;
}


/**
 * Retorna as chaves dos emblemas que o usuário acabou de conquistar (não possuídos anteriormente).
 */

export function computeNewBadges(
  donationCountAfter: number,
  totalDonatedAfter: number,
  alreadyEarnedKeys: BadgeKey[],
): BadgeKey[] {
  const earned = new Set(alreadyEarnedKeys);
  const newBadges: BadgeKey[] = [];


  const check = (condition: boolean, key: BadgeKey) => {
    if (condition && !earned.has(key)) newBadges.push(key);
  };

  check(donationCountAfter >= 1,   "FIRST_DONATION");
  check(donationCountAfter >= 5,   "DONOR_5");
  check(donationCountAfter >= 10,  "DONOR_10");
  check(donationCountAfter >= 20,  "DONOR_20");
  check(totalDonatedAfter >= 500,  "TOTAL_500");
  check(totalDonatedAfter >= 1000, "TOTAL_1000");


  return newBadges;
}
