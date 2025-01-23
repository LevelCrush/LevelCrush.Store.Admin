import LevelCrushAuthService from "./service";
import { Module, ModuleProvider, Modules } from "@medusajs/framework/utils";

export const LEVELCRUSH_AUTH_MODULE = "levelcrush-auth";

export default ModuleProvider(Modules.AUTH, {
  services: [LevelCrushAuthService],
});
