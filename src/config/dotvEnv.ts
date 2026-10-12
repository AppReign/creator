export type DotvEnvironment = "local" | "stage" | "production";

/**
 * Target while running `npm start`. Same idea as the `stageEnv` switch in
 * `dotv-frontend/packages/web/src/config/env.ts`.
 *
 * - "local" → http://localhost:8082
 * - "stage" → api-stage + login-stage
 * - "production" → api + login
 *
 * Deploys ignore this and follow the host (`.env.staging` / `.env.production`).
 */
export const DEV_DOTV_ENV: DotvEnvironment = "stage";

export type DotvEnvConfig = {
  env: DotvEnvironment;
  apiUrl: string;
  loginAuthority: string;
  oidcClientId: string;
  oidcRedirectUri: string;
  postLogoutRedirectUri: string;
};

const DEFAULTS = {
  localApi: "http://localhost:8082",
  stageApi: "https://api-stage.dragonsofthevoid.com",
  prodApi: "https://api.dragonsofthevoid.com",
  stageLogin: "https://login-stage.dragonsofthevoid.com",
  prodLogin: "https://login.dragonsofthevoid.com",
  stageCreatorHost: "https://creator-stage.dragonsofthevoid.com",
  prodCreatorHost: "https://creator.dragonsofthevoid.com"
} as const;

function readExplicitEnv(): DotvEnvironment | null {
  const value = process.env.REACT_APP_DOTV_ENV?.trim().toLowerCase();
  if (value === "local" || value === "stage" || value === "production") {
    return value;
  }
  return null;
}

/** Resolved once at startup in the browser bundle. */
export function resolveDotvEnvironment(): DotvEnvironment {
  if (process.env.NODE_ENV !== "production") {
    return DEV_DOTV_ENV;
  }

  const explicit = readExplicitEnv();
  if (explicit) {
    return explicit;
  }

  if (typeof window !== "undefined") {
    return window.location.href.includes("stage") ? "stage" : "production";
  }

  return "production";
}

function localRedirectUri(): string {
  const publicUrl = process.env.PUBLIC_URL || "";
  const base = publicUrl.endsWith("/") ? publicUrl.slice(0, -1) : publicUrl;
  return `${window.location.origin}${base}/callback.html`;
}

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "development";
  }
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function appOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

function localOidcSettings(): Pick<
  DotvEnvConfig,
  "oidcClientId" | "oidcRedirectUri" | "postLogoutRedirectUri"
> {
  const origin = appOrigin();
  const publicUrl = process.env.PUBLIC_URL || "";
  const base = publicUrl.endsWith("/") ? publicUrl.slice(0, -1) : publicUrl;
  return {
    oidcClientId: "dotv-creator-local",
    oidcRedirectUri: typeof window !== "undefined" ? localRedirectUri() : `${origin}/callback.html`,
    postLogoutRedirectUri: `${origin}${base}`
  };
}

function buildConfig(env: DotvEnvironment): DotvEnvConfig {
  const devServer = process.env.NODE_ENV !== "production";
  const apiOverride = devServer ? undefined : process.env.REACT_APP_API_URL?.trim();
  const loginOverride = devServer ? undefined : process.env.REACT_APP_LOGIN_AUTHORITY?.trim();

  const apiUrl =
    apiOverride ||
    (env === "production"
      ? DEFAULTS.prodApi
      : env === "local"
        ? DEFAULTS.localApi
        : DEFAULTS.stageApi);
  const loginAuthority =
    loginOverride || (env === "production" ? DEFAULTS.prodLogin : DEFAULTS.stageLogin);

  const deployedOidc =
    env === "production"
      ? {
          oidcClientId: "dotv-creator",
          oidcRedirectUri: `${DEFAULTS.prodCreatorHost}/callback.html`,
          postLogoutRedirectUri: DEFAULTS.prodCreatorHost
        }
      : {
          oidcClientId: "dotv-creator-stage",
          oidcRedirectUri: `${DEFAULTS.stageCreatorHost}/callback.html`,
          postLogoutRedirectUri: DEFAULTS.stageCreatorHost
        };

  return {
    env,
    apiUrl,
    loginAuthority,
    ...(isLocalDevHost() ? localOidcSettings() : deployedOidc)
  };
}

let cachedConfig: DotvEnvConfig | null = null;

export function getDotvEnvConfig(): DotvEnvConfig {
  if (!cachedConfig) {
    cachedConfig = buildConfig(resolveDotvEnvironment());
    if (process.env.NODE_ENV === "development") {
      console.info("[creator] environment", cachedConfig);
    }
  }
  return cachedConfig;
}

export function resetDotvEnvConfigForTests(): void {
  cachedConfig = null;
}
