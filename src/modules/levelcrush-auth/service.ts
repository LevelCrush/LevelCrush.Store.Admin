import {
  AuthenticationInput,
  AuthenticationResponse,
  AuthIdentityProviderService,
  Logger,
  Query,
} from "@medusajs/framework/types";
import {
  AbstractAuthModuleProvider,
  isString,
  MedusaError,
} from "@medusajs/framework/utils";

import crypto from "crypto";
import bcrypt from "bcrypt";
import { sdk } from "src/admin/lib/config";

type InjectedDependencies = {
  logger: Logger;
  query: Query;
};

type Options = {
  authServer: string;
  authServerSecret: string;
  storeUrl: string;
  backendUrl: string;
  saltRounds: string;
  apiKey: string;
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
  isBooster: boolean;
  isRetired: boolean;
}

export default class LevelCrushAuthService extends AbstractAuthModuleProvider {
  static identifier = "levelcrush-auth";
  static DISPLAY_NAME = "LevelCrush Network";

  protected options: Options;
  protected query: Query;

  constructor(container: InjectedDependencies, options: Options) {
    super();
    this.options = options;
    this.query = container.query;
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

    if (!options.saltRounds) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Need Salt Rounds");
    }
  }

  public async update(
    data: Record<string, unknown>,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const { password, entity_id } = data ?? {};
    if (!entity_id) {
      return {
        success: false,
        error: `Cannot update provider identity without entity_id`,
      };
    }

    if (!password || !isString(password)) {
      return { success: true };
    }

    let authIdentity;

    try {
      const passwordHash = await bcrypt.hash(
        password,
        parseInt(this.options.saltRounds)
      );
      authIdentity = await authIdentityProviderService.update(
        entity_id as string,
        {
          provider_metadata: {
            "account.password": passwordHash,
          },
        }
      );
    } catch (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      authIdentity,
    };
  }

  public async register(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    // for now disable this.
    if (true) {
      return {
        success: false,
        error: "This method is not supported at this moment.",
      };
    }

    const headers = data.headers || {};
    const body = (data.body ?? {}) as unknown as DiscordValidationResult;

    if (typeof headers["X-API-KEY"] === "undefined") {
      return {
        success: false,
        error: "bad request",
      };
    }

    if (headers["X-API-KEY"] !== this.options.apiKey) {
      return {
        success: false,
        error: "unauthorized",
      };
    }

    if (!body.email || !isString(body.email)) {
      return {
        success: false,
        error: "No associated email",
      };
    }

    if (!body.discordId || !isString(body.discordId)) {
      return {
        success: false,
        error: "No discord id",
      };
    }

    const { authIdentity, success } = await this.upsert(
      body,
      authIdentityProviderService
    );

    return {
      success,
      authIdentity,
    };
  }

  public async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const query = data.query || {};
    const userRedirect = query["redirect"] || "";

    const body: Record<string, string> = data.body ?? {};
    const email = body.email || "";
    const password = body.password || "";

    // we have an email and password provided. Time to login via email instead of authenticating via discord
    // note: for this to work, a user must have logged into discord already once or an identity has been setup ahead of time
    if (`${email}`.trim() && `${password}`) {
      const cleanEmail = `${email}`.trim();
      const inputPassword = `${password}`;

      const qResults = await this.query.graph({
        entity: "provider_identity",
        fields: ["*"],
        filters: {
          provider: "levelcrush-auth",
          provider_metadata: {
            "discord.email": cleanEmail,
          },
        },
      });

      // compare and find assuming there is an identity provider with an account password set
      for (const identity of qResults.data) {
        const metadata = identity.provider_metadata || {};
        const accountPassword = metadata["account.password"] || "";
        if (accountPassword) {
          const isMatch = await bcrypt.compare(inputPassword, accountPassword);
          if (isMatch) {
            return {
              success: true,
              authIdentity: await authIdentityProviderService.retrieve({
                entity_id: identity.entity_id,
              }),
            };
          }
        }
      }

      // if we have gone down this branch for authentication just quit.
      // this section should eventually be rewritten to be better clear on what is going on but for now it works for the time crunch
      return {
        success: false,
        authIdentity: undefined,
        error: "Failed to find a match for those credentials",
      };
    }

    // if we havent used email / pass to authenticate, that means we are logging in via discord

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
      userRedirect,
    });

    return {
      success: true,
      location: `${
        this.options.authServer
      }/platform/discord/login?token=${encodeURIComponent(
        stateKey
      )}&redirectUrl=${encodeURIComponent(
        redirectUrl
      )}&userRedirect=${encodeURIComponent(userRedirect)}`,
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
        userRedirect: authState.userRedirect || "",
      } as AuthenticationResponse;
    } catch (error) {
      return {
        success: false,
        error: "Unable to complete validation: " + error,
        userRedirect: "",
      } as AuthenticationResponse;
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
      "discord.booster": data.isBooster,
      "discord.retired": data.isRetired,
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
    } catch (error) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        const createdIdentity = await authIdentityProvider.create({
          entity_id,
          user_metadata: metadata,
          provider_metadata: metadataProvider,
        });

        authIdentity = createdIdentity;
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
