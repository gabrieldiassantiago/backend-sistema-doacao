import { t } from "elysia";

export const CreateCauseSchema = t.Object({
    title: t.String({ minLength: 1 }),
    description: t.String({ minLength: 1 }),
    goalAmount: t.Numeric({ minimum: 1 }),
    categoryId: t.String(),
    images: t.Optional(t.Files()),
    imageKeys: t.Optional(t.Array(t.String())),
    isFeatured: t.Optional(t.BooleanString()),

    // Localização
    locationName: t.Optional(t.String()),
    address: t.Optional(t.String()),
    city: t.Optional(t.String()),
    state: t.Optional(t.String()),
    country: t.Optional(t.String()),
    latitude: t.Optional(t.Numeric({ minimum: -90, maximum: 90 })),
    longitude: t.Optional(t.Numeric({ minimum: -180, maximum: 180 })),
});

export const UpdateCauseSchema = t.Object({
    title: t.Optional(t.String({ minLength: 1 })),
    description: t.Optional(t.String({ minLength: 1 })),
    goalAmount: t.Optional(t.Numeric({ minimum: 1 })),
    categoryId: t.Optional(t.String()),
    images: t.Optional(t.Files()),
    imageKeys: t.Optional(t.Array(t.String())),
    isFeatured: t.Optional(t.BooleanString()),

    // Localização
    locationName: t.Optional(t.String()),
    address: t.Optional(t.String()),
    city: t.Optional(t.String()),
    state: t.Optional(t.String()),
    country: t.Optional(t.String()),
    latitude: t.Optional(t.Numeric({ minimum: -90, maximum: 90 })),
    longitude: t.Optional(t.Numeric({ minimum: -180, maximum: 180 })),
});

/**
 * Query params aceitos pelo GET /causes.
 *
 * Filtros de ordenação:
 *  - `recent`       → mais recentes primeiro (padrão)
 *  - `most_popular` → mais doações primeiro
 *  - `most_urgent`  → menor arrecadação primeiro (maior necessidade)
 *  - `nearest`      → distância crescente (requer `lat` e `lng`)
 *
 * Filtro por localização:
 *  - `city` / `state`   → texto parcial, case-insensitive
 *  - `lat` + `lng`      → coordenadas do usuário (usadas com sort=nearest)
 *  - `radius`           → raio máximo em km (padrão 50, máx 500)
 */
export const GetCausesQuerySchema = t.Object({
    skip: t.Optional(t.Numeric({ description: "Número de causas a pular (paginação)." })),
    take: t.Optional(t.Numeric({ description: "Número máximo de causas a retornar." })),
    sort: t.Optional(
        t.Union(
            [
                t.Literal("recent"),
                t.Literal("most_popular"),
                t.Literal("most_urgent"),
                t.Literal("nearest"),
            ],
            {
                description:
                    "Critério de ordenação. `nearest` requer latitude e longitude do usuário.",
            }
        )
    ),
    city: t.Optional(t.String({ description: "Filtrar causas pela cidade (parcial, case-insensitive)." })),
    state: t.Optional(t.String({ description: "Filtrar causas pelo estado (parcial, case-insensitive)." })),
    lat: t.Optional(
        t.Numeric({
            minimum: -90,
            maximum: 90,
            description: "Latitude do usuário para cálculo de distância. Obrigatório com sort=nearest.",
        })
    ),
    lng: t.Optional(
        t.Numeric({
            minimum: -180,
            maximum: 180,
            description: "Longitude do usuário para cálculo de distância. Obrigatório com sort=nearest.",
        })
    ),
    radius: t.Optional(
        t.Numeric({
            minimum: 1,
            maximum: 500,
            description: "Raio máximo de busca em km quando sort=nearest (padrão: 50).",
        })
    ),
    categoryId: t.Optional(t.String({ description: "Filtrar por ID de categoria." })),
    search: t.Optional(t.String({ description: "Buscar por título ou descrição da causa." })),
});

export const CauseParamsSchema = t.Object({
    id: t.String(),
});

export type CreateCauseDTO = typeof CreateCauseSchema.static;
export type UpdateCauseDTO = typeof UpdateCauseSchema.static;
export type CauseParams = typeof CauseParamsSchema.static;
export type GetCausesQuery = typeof GetCausesQuerySchema.static;

export const AddDocumentSchema = t.Object({
    file: t.File(),
    docType: t.Union([
        t.Literal('CNPJ_OR_CPF'),
        t.Literal('ADDRESS_PROOF'),
        t.Literal('POLICE_REPORT'),
        t.Literal('MEDICAL_REPORT'),
        t.Literal('OTHER')
    ])
});

export const ReviewDocumentSchema = t.Object({
    status: t.Union([
        t.Literal('PENDING'),
        t.Literal('APPROVED'),
        t.Literal('REJECTED')
    ]),
    rejectionReason: t.Optional(t.String())
});

export const ModerateCauseSchema = t.Object({
    status: t.String(),
    isVerified: t.Boolean()
});