import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { INotificationModuleService } from "@medusajs/framework/types";
import { sdk } from "src/admin/lib/config";

export default async function shipmentHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  
    const querySystem = container.resolve("query");
    

    
  
}

export const config: SubscriberConfig = {
  event: ["shipment.created"]
};
