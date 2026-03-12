import type { BadgeKey, Prisma, User } from "../../../generated/prisma/client";

export type UserProfile = {
  id:        string;
  name:      string;
  email:     string;
  image:     string | null;
  xpPoints:  number;
  createdAt: Date;
  badges: {
    id:       string;
    badgeKey: BadgeKey;
    earnedAt: Date;
  }[];
  donations: {
    id:        string;
    amount:    number;
    message:   string | null;
    createdAt: Date;
    cause: {
      id:       string;
      title:    string;
      imageUrl: string | null;
    };
  }[];
  createdCauses: {
    id:         string;
    title:      string;
    imageUrl:   string | null;
    goalAmount: number;
    raised:     number;
    status:     string;
    createdAt:  Date;
  }[];
  _count: {
    donations:     number;
    createdCauses: number;
  };
};

export type UserProfileWithLevel = Omit<UserProfile, "badges"> & {
  level:  import("../donation/gamification.service").LevelInfo;
  badges: (UserProfile["badges"][number] & {
    meta: import("../donation/gamification.service").BadgeMeta;
  })[];
};

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByName(name: string): Promise<User | null>;
  update(
    id: string,
    data: import("../../../generated/prisma/client").Prisma.UserUpdateInput,
  ): Promise<User>;
  profile(id: string): Promise<UserProfile | null>;
}

export interface IUserService {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByName(name: string): Promise<User | null>;
  update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<User>;
  getProfile(id: string): Promise<UserProfileWithLevel | null>;
}
