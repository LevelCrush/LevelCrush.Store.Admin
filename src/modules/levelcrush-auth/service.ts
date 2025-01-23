import {
  AuthenticationInput,
  AuthenticationResponse,
  AuthIdentityProviderService,
  Logger,
} from "@medusajs/framework/types";
import {
  AbstractAuthModuleProvider,
  MedusaError,
} from "@medusajs/framework/utils";

import crypto from "crypto";
import { sdk } from "src/admin/lib/config";

type InjectedDependencies = {
  logger: Logger;
};

type Options = {
  authServer: string;
  authServerSecret: string;
  storeUrl: string;
  backendUrl: string;
};

interface DiscordValidationResult {
  discordHandle: string;
  discordId: string;
  inServer: boolean;
  email: string;
  isAdmin: boolean;
  isModerator: boolean;
  nicknames: string[];
  globalName: string;
}

export default class LevelCrushAuthService extends AbstractAuthModuleProvider {
  static identifier = "levelcrush-auth";
  static DISPLAY_NAME = "LevelCrush Network";

  protected options: Options;

  constructor(container: InjectedDependencies, options: Options) {
    super();

    this.options = options;
  }

  public static validateOptions(options: Record<any, any>): void | never {
    if (!options.authServer) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Need Auth Server defined"
      );
    }

    if (!options.authServerSecret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Need Auth Server Secret defined"
      );
    }

    if (!options.storeUrl) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Need Storefront url "
      );
    }
  }

  public async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const isAdminPath = (data.url || "").includes("auth/user");
    const stateKey = crypto.randomBytes(32).toString("hex");

    const target = (data.url || "").includes("auth/user")
      ? `${this.options.backendUrl}/app/login${encodeURIComponent(stateKey)}`
      : `${this.options.storeUrl}/callback`;

    const redirectUrl = `${target}?token=${encodeURIComponent(stateKey)}`;

    await authIdentityProviderService.setState(stateKey, {
      redirectUrl: redirectUrl,
      token: stateKey,
      admin: isAdminPath,
    });

    return {
      success: true,
      location: `${
        this.options.authServer
      }/platform/discord/login?token=${encodeURIComponent(
        stateKey
      )}&redirectUrl=${encodeURIComponent(redirectUrl)}`,
    };
  }

  public async validateCallback(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    //
    const query: Record<string, string> = data.query ?? {};
    const body: Record<string, string> = data.body ?? {};

    const inputToken = query.token || "";

    const authState = await authIdentityProviderService.getState(inputToken);
    if (!authState) {
      return {
        success: false,
        error: "Failed to login or session expired",
      };
    }

    const token = authState.token;

    if (token !== inputToken) {
      return {
        success: false,
        error: "State mismatch",
      };
    }

    try {
      const claimReq = await fetch(
        `${this.options.authServer}/platform/discord/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": this.options.authServerSecret,
            Accept: "application/json",
          },
          body: JSON.stringify({ token: token }),
        }
      );

      const claimData = (await claimReq.json()) as DiscordValidationResult;

      // for now admins or mods can access this if they have the right privs
      if ((claimData.isAdmin || claimData.isModerator) && authState.admin) {
        return {
          success: false,
          error: "Insufficient authorization",
        };
      }

      const { authIdentity, success } = await this.upsert(
        claimData,
        authIdentityProviderService
      );

      return {
        success,
        authIdentity,
      };
    } catch (error) {
      return {
        success: false,
        error: "Unable to complete validation: " + error,
      };
    }
  }

  private async upsert(
    data: DiscordValidationResult,
    authIdentityProvider: AuthIdentityProviderService
  ) {
    if (data.discordId.trim().length === 0) {
      return {
        success: false,
        error: "No discord id found",
      };
    }

    const entity_id = data.discordId;

    const metadata = {
      "discord.id": data.discordId,
      "discord.handle": data.discordHandle,
      "discord.globalName": data.globalName,
      "discord.server_member": data.inServer,
      "discord.nicknames": data.nicknames,
      "discord.admin": data.isAdmin,
      "discord.moderator": data.isModerator,
      "discord.email": data.email,
    };

    const metadataProvider = {
      "discord.id": data.discordId,
      "discord.email": data.email,
    };

    let authIdentity;

    try {
      authIdentity = await authIdentityProvider.update(entity_id, {
        provider_metadata: metadataProvider,
        user_metadata: metadata,
      });
      console.log(
        "Returning old identity",
        authIdentity,
        authIdentity.provider_identities
      );

    } catch (error) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        const createdIdentity = await authIdentityProvider.create({
          entity_id,
          user_metadata: metadata,
          provider_metadata: metadataProvider,
        });

        authIdentity = createdIdentity;

        console.log(
          "Returning new identity",
          authIdentity,
          authIdentity.provider_identities
        );
      } else {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    return {
      success: true,
      authIdentity,
    };
  }
}
