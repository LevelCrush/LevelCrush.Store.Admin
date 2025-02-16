import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { INotificationModuleService } from "@medusajs/framework/types";

export default async function passwordResetHandler({
  event,
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);

  const queryService = container.resolve("query");
  const data = event.data;

  let targetEmail = data.entity_id;

  if (event.data.actor_type === "customer") {
    // customers always pull from levelcrush-auth provider
    const identityReq = await queryService.graph({
      entity: "provider_identity",
      fields: ["*"],
      filters: {
        entity_id: data.entity_id,
        provider: "levelcrush-auth",
      },
    });
    if (identityReq.data.length > 0) {
      const metadata = identityReq.data[0].provider_metadata || {};
      targetEmail = (metadata["discord.email"] as string) || "";
    }
  }

  const prefix =
    event.data.actor_type === "customer"
      ? process.env["MEDUSA_STORE_URL"]
      : `${process.env["MEDUSA_ADMIN_BACKEND_URL"]}/app`;
  var forgotPasswordLink = `${prefix}/reset-password?token=${encodeURIComponent(
    data.token
  )}&email=${encodeURIComponent(targetEmail)}`;

  var emailVars = {
    link: forgotPasswordLink,
  };

  if (targetEmail) {
    await notificationModuleService.createNotifications({
      to: targetEmail,
      channel: "email",
      template: "d-4c363e7ff3464e61b1557fe402b8e70d",
      data: emailVars,
      attachments: [],
    });
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};
