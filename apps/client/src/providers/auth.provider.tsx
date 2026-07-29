import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type ProfileResponse,
  type UserAbilities,
  getUserAbilities,
  userResponseToJwtStrategyPayload,
} from 'platform/common-base';
import { AuthProviderType } from 'platform/prisma';
import { api } from '../api/client.api';

type AuthStatus = 'checking' | 'guest' | 'authenticated';

type AuthContextValue = {
  status: AuthStatus;
  user?: ProfileResponse;
  abilities: UserAbilities;
  isAuthenticated: boolean;
  completeGoogleOauth: (query: string) => Promise<ProfileResponse>;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<ProfileResponse>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<ProfileResponse>();

  const applyProfile = useCallback((profile: ProfileResponse) => {
    setUser(profile);
    setStatus('authenticated');
    return profile;
  }, []);

  const reloadProfile = useCallback(
    async () => applyProfile(await api.auth.profile()),
    [applyProfile],
  );

  const completeGoogleOauth = useCallback(
    async (query: string) => {
      await api.auth.createOauthSession({
        provider: AuthProviderType.Google,
        query,
      });
      return reloadProfile();
    },
    [reloadProfile],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(undefined);
      setStatus('guest');
    }
  }, []);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const session = await api.auth.check();
        if (!session.active && session.refreshable) {
          await api.auth.refreshSession();
        }

        if (!session.active && !session.refreshable) {
          if (active) {
            setStatus('guest');
          }
          return;
        }

        const profile = await api.auth.profile();
        if (active) {
          applyProfile(profile);
        }
      } catch {
        if (active) {
          setUser(undefined);
          setStatus('guest');
        }
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, [applyProfile]);

  const abilities = useMemo(
    () => getUserAbilities(userResponseToJwtStrategyPayload(user)),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      abilities,
      isAuthenticated: status === 'authenticated',
      completeGoogleOauth,
      logout,
      reloadProfile,
    }),
    [abilities, completeGoogleOauth, logout, reloadProfile, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
};

export const useAuthenticatedUser = () => {
  const { user } = useAuth();
  if (!user) {
    throw new Error(
      'useAuthenticatedUser must be used inside an authenticated route.',
    );
  }
  return user;
};
