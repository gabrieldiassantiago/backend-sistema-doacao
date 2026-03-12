
import { prisma } from "./lib/prisma";

import { CauseRepository } from "./modules/cause/cause.repository";
import { UserRepository } from "./modules/user/user.repository";
import { DonationRepository } from "./modules/donation/donation.repository";
import { PaymentRepository } from "./modules/payment/payment.repository";
import { WithdrawalRepository } from "./modules/withdrawal/withdrawal.repository";

import { CauseService } from "./modules/cause/cause.service";
import { UserService } from "./modules/user/user.service";
import { DonationService } from "./modules/donation/donation.service";
import { PaymentService } from "./modules/payment/payment.service";
import { WithdrawalService } from "./modules/withdrawal/withdrawal.service";

const causeRepository      = new CauseRepository(prisma);
const userRepository       = new UserRepository(prisma);
const donationRepository   = new DonationRepository(prisma);
const paymentRepository    = new PaymentRepository(prisma);
const withdrawalRepository = new WithdrawalRepository(prisma);

const causeService = new CauseService(causeRepository);

const userService = new UserService(userRepository);

const donationService = new DonationService(
  donationRepository,
  causeRepository,
  userRepository,
);

const paymentService = new PaymentService(
  paymentRepository,
  causeRepository,
  userRepository,
  donationService,
);

const withdrawalService = new WithdrawalService(
  withdrawalRepository,
  causeRepository,
  prisma,
);

export const container = {

  causeRepository,
  userRepository,
  donationRepository,
  paymentRepository,
  withdrawalRepository,

  causeService,
  userService,
  donationService,
  paymentService,
  withdrawalService,
} as const;

export type Container = typeof container;
