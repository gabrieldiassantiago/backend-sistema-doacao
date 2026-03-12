import { Prisma, PrismaClient, User } from "../../../generated/prisma/client";
import type { IUserRepository, UserProfile } from "./user.types";

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