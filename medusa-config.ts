import { loadEnv, defineConfig, Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { LEVELCRUSH_AUTH_MODULE } from "./src/modules/levelcrush-auth";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  modules: [
    {
      resolve: "@medusajs/medusa/auth",
      options: {
        providers: [
          // default provider
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
            id: "emailpass",
          },

          {
            resolve: "./src/modules/levelcrush-auth",
            id: "levelcrush-auth",
            dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
            options: {
               authServer: process.env["LEVELCRUSH_AUTH_SERVER"],
               authServerSecret: process.env["LEVELCRUSH_AUTH_SERVER_SECRET"],
               storeUrl: process.env["MEDUSA_STORE_URL"]
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },

    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },

    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          url: process.env.REDIS_URL,
        },
      },
    },
  ],
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE as
      | "shared"
      | "worker"
      | "server",
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
});
