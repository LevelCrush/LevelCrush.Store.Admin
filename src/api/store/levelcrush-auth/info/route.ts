import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import user from "@medusajs/medusa/commands/user";

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.query || {};
  const inputToken = (query.token as string) || "";

  const authModuleService = req.scope.resolve("auth");
  const providerService =
    authModuleService.getAuthIdentityProviderService("levelcrush-auth");

  const authState = await providerService.getState(inputToken);
  console.warn("Auth state check", authState);
  if (!authState) {
    return res.json({
      success: false,
      error: "Failed to find matching identity",
      data: {},
    });
  }

  return res.json({
    success: true,
    data: {
      redirect: authState.userRedirect,
      metadata: authState.metadata || {},
    },
    errors: {},
  });
}
