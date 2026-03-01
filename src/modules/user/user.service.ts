import { Prisma, User } from "../../../generated/prisma/client";
import { IUserRepository, UserProfile } from "./user.repository";
import { BADGE_META, BadgeMeta, LevelInfo, computeLevel } from "../donation/gamification.service";

export type UserProfileWithLevel = Omit<UserProfile, "badges"> & {
  level: LevelInfo;
  badges: (UserProfile["badges"][number] & { meta: BadgeMeta })[];
};

export interface IUserService {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByName(name: string): Promise<User | null>;
    update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
    getProfile(id: string): Promise<UserProfileWithLevel | null>;
}

export class UserService implements IUserService {
    constructor(private readonly userRepository: IUserRepository) {}

    async findById(id: string): Promise<User | null> {
        return this.userRepository.findById(id);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }

    async findByName(name: string): Promise<User | null> {
        return this.userRepository.findByName(name);
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.userRepository.update(id, data);
    }

    async getProfile(id: string): Promise<UserProfileWithLevel | null> {
        const profile = await this.userRepository.profile(id);
        if (!profile) return null;

        return {
            ...profile,
            level: computeLevel(profile.xpPoints),
            badges: profile.badges.map((b) => ({
                ...b,
                meta: BADGE_META[b.badgeKey],
            })),
        };
    }
}