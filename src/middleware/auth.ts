import { Elysia } from 'elysia'
import { auth } from '../auth'

export const betterAuthMiddleware = new Elysia({ name: 'better-auth' })
    .macro({
        auth: {
            async resolve({ status, request: { headers } }) {
                const session = await auth.api.getSession({
                    headers
                })

                if (!session) return status(401, { error: 'Unauthorized' })

                return {
                    user: session.user,
                    session: session.session
                }
            }   
        }
    })