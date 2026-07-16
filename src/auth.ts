import { betterAuth } from "better-auth";
import { openAPI, emailOTP } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./lib/prisma";
import { container } from "./container";


export const auth = betterAuth({

    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    user: {
        additionalFields: {
            isAdmin: {
                type: "boolean",
                required: true,
                defaultValue: false,
            }
        },
        changeEmail: {
            enabled: true,
        }
    },

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }
    },


    trustedOrigins: ["https://doacao-frontend-swart.vercel.app", "http://localhost:3001", "https://doacao-frontend-amber.vercel.app"],
    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
        requireEmailVerification: true,

        sendResetPassword: async ({ user, url, token }, request) => {
            await container.emailQueueService.enqueueResetPassword(user.email, token, user.name);
        },

    },
    baseURL: process.env.BETTER_AUTH_BASE_URL,

    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
            httpOnly: true,
        },
    },
    plugins: [
        openAPI(),
        emailOTP({
            sendVerificationOnSignUp: true,
            expiresIn: 600,
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp }) {
                const userName = email.split('@')[0];
                await container.emailQueueService.enqueueOtp(email, otp, userName);
            },
        })
    ],
    basePath: "/api"
});

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema())

export const OpenAPI = {
    getPaths: (prefix = '/auth/api') =>
        getSchema().then(({ paths }) => {
            const reference: typeof paths = Object.create(null)

            for (const path of Object.keys(paths)) {
                const key = prefix + path
                reference[key] = paths[path]

                for (const method of Object.keys(paths[path])) {
                    const operation = (reference[key] as any)[method]

                    operation.tags = ['Better Auth']
                }
            }

            return reference
        }) as Promise<any>,
    components: getSchema().then(({ components }) => components) as Promise<any>
} as const;