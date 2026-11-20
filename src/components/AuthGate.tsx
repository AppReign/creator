import React from "react";

import { useAuth } from "../context/AuthContext";
import classes from "./AuthGate.module.scss";

/** Requires OIDC login plus character-tool role (admin or designer on VPN). */
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ready, authenticated, canAccessCharacterTool, authError, profile, logout } = useAuth();

  if (!ready) {
    return (
      <div className={classes.centered}>
        <p>Signing in…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className={classes.centered}>
        {authError ? (
          <>
            <h1 className={classes.title}>Sign-in failed</h1>
            <p className={classes.error}>{authError}</p>
          </>
        ) : (
          <p>Redirecting to login…</p>
        )}
      </div>
    );
  }

  if (!canAccessCharacterTool) {
    return (
      <div className={classes.centered}>
        <h1 className={classes.title}>Access denied</h1>
        {authError && <p className={classes.error}>{authError}</p>}
        {profile && (
          <p className={classes.muted}>
            Signed in as <strong>{profile.characterName}</strong>
          </p>
        )}
        <p className={classes.muted}>
          Access Denied. 
        </p>
        <button type="button" className={classes.button} onClick={() => logout()}>
          Sign out
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

AuthGate.displayName = "AuthGate";

export default AuthGate;
