import { Prisma, User } from "../../../generated/prisma/client";
import type { IUserRepository, IUserService, UserProfileWithLevel } from "./user.types";
import { BADGE_META, computeLevel } from "../donation/gamification.service";

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