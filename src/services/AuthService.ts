import { User, UserManager, UserManagerSettings, WebStorageStateStore } from "oidc-client";

import { getDotvEnvConfig } from "../config/dotvEnv";

class AuthService {
  private userManager: UserManager;

  constructor() {
    const config = getDotvEnvConfig();
    const settings: UserManagerSettings = {
      userStore: new WebStorageStateStore({ store: window.localStorage }),
      authority: config.loginAuthority,
      client_id: config.oidcClientId,
      redirect_uri: config.oidcRedirectUri,
      post_logout_redirect_uri: config.postLogoutRedirectUri,
      response_type: "id_token token",
      scope: "openid profile email api1.read api1.write",
      automaticSilentRenew: false,
      monitorSession: false
    };
    this.userManager = new UserManager(settings);
  }

  getUser(): Promise<User | null> {
    return this.userManager.getUser();
  }

  login(): Promise<void> {
    return this.userManager.signinRedirect();
  }

  logout(): Promise<void> {
    return this.userManager.signoutRedirect();
  }
}

const authService = new AuthService();
export default authService;
