import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { INotificationModuleService } from "@medusajs/framework/types";
import { sdk } from "src/admin/lib/config";

export default async function inviteHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);

  const queryService = container.resolve("query");
 
  const data = event.data;

  const inviteInfoQuery =  await queryService.graph({
    entity: "invite",
    fields: ["email", "accepted", "token"],
    filters: {
      id: event.data.id,
    },
  });

  if(!inviteInfoQuery || inviteInfoQuery.data.length === 0) {
    console.log(`No invite could be found for ${event.data.id}`)
    return;
  }

  const inviteInfo = inviteInfoQuery.data[0];

  if (!inviteInfo.accepted) {

    const prefix = `${process.env["MEDUSA_ADMIN_BACKEND_URL"]}/app`;
    const url = `${prefix}/invite?token=${encodeURIComponent(inviteInfo.token)}`;
     
    const emailVars = {
      link: url,
    };

    await notificationModuleService.createNotifications({
      to: inviteInfo.email,
      channel: "email",
      template: "d-8bfb6b7b4c3c405cb487f1d8f902df94",
      data: emailVars,
      attachments: [],
    });
  } else {
    console.log("invite already accepted");
  }
}

export const config: SubscriberConfig = {
  event: ["invite.created", "invite.resent"],
};
