import Medusa from "@medusajs/js-sdk";


let baseUrl = "/";

if(typeof process != "undefined" && typeof process.env != "undefined") { 
    console.log("Backend Url is: ", process.env["MEDUSA_ADMIN_BACKEND_URL"] );
    baseUrl = process.env["MEDUSA_ADMIN_BACKEND_URL"] || "/";
} else if(typeof window !== "undefined") {
    baseUrl = window["__BACKEND_URL__" as any] as unknown as string;
}

export const sdk = new Medusa({
  baseUrl: baseUrl,
  debug: process.env.NODE_ENV === "development",
  auth: {
    type: "session",
  },
});
