import { Elysia } from 'elysia'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/error-classes'
import { ErrorCodes } from '../errors/error-codes'

export const betterAuthMiddleware = new Elysia({ name: 'better-auth' })
    .macro({
        auth: {
            async resolve({ request: { headers } }) {
                const session = await auth.api.getSession({
                    headers
                })

                if (!session) {
                    throw new UnauthorizedError('Não autenticado', ErrorCodes.UNAUTHORIZED)
                }

                return {
                    user: session.user,
                    session: session.session
                }
            }   
        }
    })
