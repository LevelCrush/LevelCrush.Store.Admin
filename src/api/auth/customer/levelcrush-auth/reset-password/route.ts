import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { generateResetPasswordTokenWorkflow } from "@medusajs/medusa/core-flows";

export async function POST(req: MedusaRequest, res: MedusaResponse) {

  const auth_provider = "levelcrush-auth";
  const actor_type = "customer";

  const { identifier } = req.body;

  const { http } = req.scope.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  ).projectConfig;


  const queryService = req.scope.resolve("query");
  const identities = await queryService.graph({
    entity: "provider_identity",
    fields: ["*"],
    filters: {
      provider: "levelcrush-auth",
      provider_metadata: {
        "discord.email": identifier || "",
      },
    },
    pagination: {
      take: 1,
      order: {
        created_at: "DESC",
      },
    },
  });


  if (identities.data.length > 0) {
    await generateResetPasswordTokenWorkflow(req.scope).run({
      input: {
        entityId: identities.data[0].entity_id,
        actorType: actor_type,
        provider: auth_provider,
        secret: http.jwtSecret as string,
      },
      throwOnError: false, // we don't want to throw on error to avoid leaking information about non-existing identities
    });

    res.sendStatus(201);
  } else {
    res.sendStatus(404);
  }
}
