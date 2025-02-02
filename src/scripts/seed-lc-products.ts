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
          amount: 2,
          currency_code: "usd",
        },
      ],
    });
  }

  // holiday gift product
  products.push({
    title: "Level Crush Holiday Gift",
    handle: "holiday-gift",
    status: ProductStatus.PUBLISHED,
    options: [
      {
        title: "Year",
        values: ["2024"],
      },
      {
        title: "Pack",
        values: [
          "Active Founder",
          "Retired Founder",
          "Server Booster",
          "Normal",
        ],
      },
    ],
    variants: [
      {
        title: "Active Founder (2024)",
        sku: "GIFT-H24-FNDR",
        options: {
          Year: "2024",
          Pack: "Active Founder",
        },
        allow_backorder: true,
        manage_inventory: true,
        prices: [{ amount: 0, currency_code: "usd" }],
      },
      {
        title: "Retired Founder (2024)",
        sku: "GIFT-H24-RETF",
        options: {
          Year: "2024",
          Pack: "Retired Founder",
        },
        allow_backorder: true,
        manage_inventory: true,
        prices: [{ amount: 0, currency_code: "usd" }],
      },
      {
        title: "Server Booster (2024)",
        sku: "GIFT-H24-BOOSTER",
        options: {
          Year: "2024",
          Pack: "Server Booster",
        },
        allow_backorder: true,
        manage_inventory: true,
        prices: [{ amount: 0, currency_code: "usd" }],
      },
      {
        title: "Normal (2024)",
        sku: "GIFT-H24-CLAN",
        options: {
          Year: "2024",
          Pack: "Normal",
        },
        allow_backorder: true,
        manage_inventory: true,
        prices: [{ amount: 0, currency_code: "usd" }],
      },
    ],
    sales_channels: [
      {
        id: defaultSalesChannel[0].id,
      },
    ],
  });

  // gift product
  products.push({
    title: "Level Crush Gift: Destiny 2 Seal",
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

  // ctumbler
  products.push({
    title: "Level Crush Tumbler",
    weight: 1,
    status: ProductStatus.PUBLISHED,
    handle: "tumbler",
    images: [],
    options: [
      {
        title: "Style",
        values: ["Engraved"],
      },
      {
        title: "Oz",
        values: ["30"],
      },
    ],
    variants: [
      {
        title: "30oz Engraved Tumbler",
        sku: "LVL-TUMBLER-ENG-30",
        allow_backorder: true,
        manage_inventory: true,
        options: {
          Style: "Engraved",
          Oz: "30",
        },
        prices: [
          {
            amount: 25,
            currency_code: "usd",
          },
        ],
      },
    ],
    sales_channels: [
      {
        id: defaultSalesChannel[0].id,
      },
    ],
  });

  products.push({
    title: "Level Crush Keepsake Box",
    handle: "keepsake-box",
    status: ProductStatus.PUBLISHED,
    weight: 1,
    options: [
      {
        title: "Preference",
        values: ["Auto", "Freestyle", "Personalized"],
      },
    ],
    variants: [
      {
        title: "(Auto) Keepsake Box",
        allow_backorder: true,
        manage_inventory: true,
        sku: "LVL-BOX-KEEPSAKE-AUTO",
        prices: [
          {
            amount: 25,
            currency_code: "usd",
          },
        ],
        options: {
          Preference: "Auto"
        }
      },
      {
        title: "Freestyle Keepsake Box",
        allow_backorder: true,
        manage_inventory: true,
        sku: "LVL-BOX-KEEPSAKE-FS",
        options: {
          Preference: "Freestyle",
        },
        prices: [
          {
            amount: 25,
            currency_code: "usd",
          },
        ],
      },
      {
        title: "Personalized Keepsake Box",
        allow_backorder: true,
        manage_inventory: true,
        sku: "LVL-BOX-KEEPSAKE-PERSONAL",
        options: {
          Preference: "Personalized",
        },
        prices: [
          {
            amount: 25,
            currency_code: "usd",
          },
        ],
      },
    ],
    sales_channels: [
      {
        id: defaultSalesChannel[0].id,
      },
    ],
  });

  products.push({
    title: "Level Crush Membership Card",
    description: "Subject to approval when order is placed",
    handle: "membership-card",
    status: ProductStatus.PUBLISHED,
    metadata: {
      Required: "Discord Id",
      Approval: true,
    },
    weight: 1,
    options: [
      {
        title: "Type",
        values: ["Active Founder", "Retired Founder", "Omnicron", "Standard"],
      },
      {
        title: "Color",
        values: ["Red", "Blue", "Stainless Steel", "Black"],
      },
    ],
    variants: [
      {
        title: "Active Founder",
        allow_backorder: true,
        manage_inventory: true,
        sku: "LVL-MCARD-FNDR",
        options: {
          Type: "Active Founder",
          Color: "Red",
        },
        prices: [
          {
            amount: 20,
            currency_code: "usd",
          },
        ],
      },
      {
        title: "Retired Founder",
        allow_backorder: true,
        manage_inventory: true,
        sku: "LVL-MCARD-RETF",
        options: {
          Type: "Retired Founder",
          Color: "Blue",
        },
        prices: [
          {
            amount: 20,
            currency_code: "usd",
          },
        ],
      },
      {
        title: "Omnicron",
        allow_backorder: true,
        manage_inventory: true,
        sku: "LVL-MCARD-OMNI",
        options: {
          Type: "Omnicron",
          Color: "Stainless Steel",
        },
        prices: [
          {
            amount: 20,
            currency_code: "usd",
          },
        ],
      },
      {
        title: "Standard",
        allow_backorder: true,
        manage_inventory: true,
        sku: "LVL-MCARD-STND",
        options: {
          Type: "Standard",
          Color: "Black",
        },
        prices: [
          {
            amount: 20,
            currency_code: "usd",
          },
        ],
      },
    ],
    sales_channels: [
      {
        id: defaultSalesChannel[0].id,
      },
    ],
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
