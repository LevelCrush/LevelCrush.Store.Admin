import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { INotificationModuleService } from "@medusajs/framework/types";
import { sdk } from "src/admin/lib/config";

export default async function orderHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);

  const orderSystem = container.resolve("order");
  const order = await orderSystem.retrieveOrder(event.data.id);

  let orderDetails = [] as string[];
  orderDetails.push("You ordered the following items");

  const items = order.items || [];
  for (const item of items) {
    
    orderDetails.push(
      `${item.quantity}x${item.title} [${item.variant_sku || ""}]`
    );
  }

  const emailVars = {
    orderNumber: order.display_id,
    orderDetails: orderDetails.join("\r\n"),
  };


  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "d-aae5ef4be14e4bf3aaa0d13fe27e0075",
    data: emailVars,
    attachments: [],
  });
}

export const config: SubscriberConfig = {
  event: ["order.placed"],
};
