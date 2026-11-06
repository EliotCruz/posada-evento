const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.PUBLIC_FIREBASE_API_KEY as string | undefined,
  authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.PUBLIC_FIREBASE_PROJECT_ID as string | undefined,
  appId: env.PUBLIC_FIREBASE_APP_ID as string | undefined,
};

export const hayFirebase = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
