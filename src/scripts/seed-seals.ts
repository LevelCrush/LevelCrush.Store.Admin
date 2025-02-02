import {
  CreateInventoryLevelInput,
  CreateProductVariantDTO,
  CreateProductVariantWorkflowInputDTO,
  CreateProductWorkflowInputDTO,
  ExecArgs,
  StoreProduct,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function seedSeals({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  const seals = [
    "Conqueror",
    "BRAVE",
    "Dredgen",
    "Flamekeeper",
    "Iron Lord",
    "Star Baker",
    "Vidmaster",
    "Scallywag",
    "Deadeye",
    "Seraph",
    "Ghost Writer",
    "MMXXIII",
    "Virtual Fighter",
    "Haruspex",
    "Glorious",
    "Reveler",
    "Descendant",
    "Splicer",
    "Champ",
    "WANTED",
    "Godslayer",
    "Aquanaut",
    "Wishbearer",
    "Reaper",
    "MMXXII",
    "Warden",
    "Queensguard",
    "Risen",
    "Chosen",
    "MMXX",
    "MMXXI",
    "Realmwalker",
    "Cursebreaker",
    "Enlightened",
    "Forerunner",
    "Discerptor",
    "Rivensbane",
    "Unbroken",
    "Disciple-Slayer",
    "Fatebreaker",
    "Flawless",
    "Harbinger",
    "Legend",
    "Dream Warrior",
    "Intrepid",
    "Wrathbearer",
    "Ghoul",
    "Slayer Baron",
    "Splintered",
    "Almighty",
    "Wayfarer",
    "Gumshoe",
    "Iconoclast",
    "Kingslayer",
    "Savior",
    "Swordbearer",
    "Transcendent",
    "MMXIX",
    "Unleashed",
    "Chronicler",
    "Blacksmith",
    "Reckoner",
    "Shadow",
    "Undying",
  ];

  // normalize

  const sealMap = {} as Record<string, string>;
  for (const seal of seals) {
    sealMap[seal] = `GIFT-D2-${seal.toUpperCase().trim().replaceAll(" ", "-")}`;
  }

  const products = [] as CreateProductWorkflowInputDTO[];
  const varients = [] as CreateProductVariantWorkflowInputDTO[];

  // varient
  for (const title in sealMap) {
    varients.push({
      title: title,
      sku: sealMap[title],
      manage_inventory: true,
      allow_backorder: true,
      options: {
        Seal: title,
      },
      prices: [
        {
          amount: 0,
          currency_code: "usd",
        },
      ],
    });
  }

  // gift product
  products.push({
    title: "Gift: Destiny 2 Seal",
    description:
      "Unofficial, fan made, **personal** gifts. Not for commerical use",
    handle: "gift-seals",
    weight: 1,
    status: ProductStatus.PUBLISHED,
    images: [],
    options: [
      {
        title: "Seal",
        values: Object.keys(sealMap),
      },
    ],
    sales_channels: [
      {
        id: defaultSalesChannel[0].id,
      },
    ],
    variants: varients,
  });

  console.log("Creating product");
  await createProductsWorkflow(container).run({
    input: {
      products: products,
    },
  });

  console.log("Seeding inventory levels");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
    filters: {
      sku: {
        $like: "GIFT-D2-%",
      },
    },
  });

  // get stock location
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  });

  const stockLocation = stockLocations[0];

  const inventoryLevels = [] as CreateInventoryLevelInput[];
  for (const inventoryItem of inventoryItems) {
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 100,
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  console.log("Done seeding seals");
}
