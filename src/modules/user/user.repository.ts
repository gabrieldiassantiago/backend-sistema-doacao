import { BadgeKey, Prisma, PrismaClient, User } from "../../../generated/prisma/client";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  xpPoints: number;
  createdAt: Date;
  badges: {
    id: string;
    badgeKey: BadgeKey;
    earnedAt: Date;
  }[];
  donations: {
    id: string;
    amount: number;
    message: string | null;
    createdAt: Date;
    cause: {
      id: string;
      title: string;
      imageUrl: string | null;
    };
  }[];
  createdCauses: {
    id: string;
    title: string;
    imageUrl: string | null;
    goalAmount: number;
    raised: number;
    status: string;
    createdAt: Date;
  }[];
  _count: {
    donations: number;
    createdCauses: number;
  };
};

export interface IUserRepository {
   findById(id: string): Promise<User | null>;
   findByEmail(email: string): Promise<User | null>;
   findByName(name: string): Promise<User | null>;
   update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
   profile(id: string): Promise<UserProfile | null>;
}

export class UserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findByName(name: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { name },
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async profile(id: string): Promise<UserProfile | null> {
      return this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          xpPoints: true,
          createdAt: true,
          badges: {
            orderBy: { earnedAt: "desc" },
            select: {
              id: true,
              badgeKey: true,
              earnedAt: true,
            },
          },
          donations: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              amount: true,
              message: true,
              createdAt: true,
              cause: {
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                },
              },
            },
          },
          createdCauses: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
              imageUrl: true,
              goalAmount: true,
              raised: true,
              status: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              donations: true,
              createdCauses: true,
            },
          },
        },
      }) as Promise<UserProfile | null>;
    }
}