import { prisma } from "./lib/prisma";

import { CauseRepository } from "./modules/cause/cause.repository";
import { CategoryRepository } from "./modules/category/category.repository";
import { UserRepository } from "./modules/user/user.repository";
import { DonationRepository } from "./modules/donation/donation.repository";
import { PaymentRepository } from "./modules/payment/payment.repository";
import { WithdrawalRepository } from "./modules/withdrawal/withdrawal.repository";
import { CollectionPointRepository } from "./modules/collection-points/collection-points.repository";
import { SuggestionRepository } from "./modules/collection-points/suggestion/suggestion.repository";

import { CauseService } from "./modules/cause/cause.service";
import { CategoryService } from "./modules/category/category.service";
import { UserService } from "./modules/user/user.service";
import { DonationService } from "./modules/donation/donation.service";
import { PaymentService } from "./modules/payment/payment.service";
import { WithdrawalService } from "./modules/withdrawal/withdrawal.service";
import { CollectionPointService } from "./modules/collection-points/colleciton-points.service";
import { SuggestionService } from "./modules/collection-points/suggestion/suggestion.service";
import { S3StorageService } from "./lib/s3";
import { EmailQueueService } from "./jobs/email-queue";
import { getMailer } from "./lib/mailer";

export type AppContainer = {
  causeRepository: CauseRepository;
  categoryRepository: CategoryRepository;
  userRepository: UserRepository;
  donationRepository: DonationRepository;
  paymentRepository: PaymentRepository;
  withdrawalRepository: WithdrawalRepository;
  collectionPointRepository: CollectionPointRepository;
  suggestionRepository: SuggestionRepository;
  causeService: CauseService;
  categoryService: CategoryService;
  userService: UserService;
  donationService: DonationService;
  paymentService: PaymentService;
  withdrawalService: WithdrawalService;
  collectionPointService: CollectionPointService;
  suggestionService: SuggestionService;
  storageService: S3StorageService;
  emailQueueService: EmailQueueService;
};

export type ContainerOverrides = Partial<AppContainer>;

export function createContainer(overrides: ContainerOverrides = {}): AppContainer {
  // Repositories
  const causeRepository = overrides.causeRepository ?? new CauseRepository(prisma);
  const categoryRepository = overrides.categoryRepository ?? new CategoryRepository(prisma);
  const userRepository = overrides.userRepository ?? new UserRepository(prisma);
  const donationRepository = overrides.donationRepository ?? new DonationRepository(prisma);
  const paymentRepository = overrides.paymentRepository ?? new PaymentRepository(prisma);
  const withdrawalRepository = overrides.withdrawalRepository ?? new WithdrawalRepository(prisma);
  const collectionPointRepository =
    overrides.collectionPointRepository ?? new CollectionPointRepository(prisma);
  const suggestionRepository =
    overrides.suggestionRepository ?? new SuggestionRepository(prisma);

  // Infra services (precisam vir antes dos services que dependem deles)
  const storageService = overrides.storageService ?? new S3StorageService();
  const emailQueueService = overrides.emailQueueService ?? new EmailQueueService(getMailer());

  // Domain services
  const causeService =
    overrides.causeService ??
    new CauseService(causeRepository, categoryRepository, userRepository, storageService, emailQueueService);

  const categoryService = overrides.categoryService ?? new CategoryService(categoryRepository);
  const userService = overrides.userService ?? new UserService(userRepository);

  const donationService =
    overrides.donationService ??
    new DonationService(donationRepository, causeRepository, userRepository, emailQueueService);

  const paymentService =
    overrides.paymentService ??
    new PaymentService(paymentRepository, causeRepository, userRepository, donationService, emailQueueService);
  
  const withdrawalService =
    overrides.withdrawalService ??
    new WithdrawalService(withdrawalRepository, causeRepository, prisma);

  const collectionPointService =
    overrides.collectionPointService ?? new CollectionPointService(collectionPointRepository);

  const suggestionService =
    overrides.suggestionService ??
    new SuggestionService(
      suggestionRepository,
      collectionPointRepository,
      userRepository,
      storageService,
      emailQueueService,
    );

  return {
    causeRepository,
    categoryRepository,
    userRepository,
    donationRepository,
    paymentRepository,
    withdrawalRepository,
    collectionPointRepository,
    suggestionRepository,
    causeService,
    categoryService,
    userService,
    donationService,
    paymentService,
    withdrawalService,
    collectionPointService,
    suggestionService,
    storageService,
    emailQueueService,
  };
}

export const container = createContainer();

export type Container = AppContainer;