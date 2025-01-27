import type {
    SubscriberArgs,
    SubscriberConfig,
  } from "@medusajs/framework"
  import { Modules } from "@medusajs/framework/utils"
  import { INotificationModuleService } from "@medusajs/framework/types"
  
  export default async function passwordResetHandler({
    event,
    container,
  }: SubscriberArgs<{ entity_id: string, token: string, actor_type: string}>) {
    const notificationModuleService: INotificationModuleService =
      container.resolve(Modules.NOTIFICATION)

     const data = event.data;
     const prefix = event.data.actor_type === 'customer' ? process.env['MEDUSA_STORE_URL'] : `${process.env["MEDUSA_ADMIN_BACKEND_URL"]}/app`;
    var forgotPasswordLink = `${prefix}/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.token)}`;

    var emailVars = {
        link: forgotPasswordLink
    };

 
    await notificationModuleService.createNotifications({
        to: data.entity_id,
        channel: "email",
        template: "d-4c363e7ff3464e61b1557fe402b8e70d",
        data: emailVars, 
        attachments: []
    }); 
    
    /*
    await notificationModuleService.createNotifications({
      to: data.id,
      from: "test@medusajs.com", // Optional var, verified sender required
      channel: "email",
      template: "product-created",
      data,
      attachments: [ // optional var
        {
          content: base64,
          content_type: "image/png", // mime type
          filename: filename.ext,
          disposition: "attachment or inline attachment",
          id: "id", // only needed for inline attachment
        },
      ],
    }) */
  }
  
  export const config: SubscriberConfig = {
    event: "auth.password_reset",
  }