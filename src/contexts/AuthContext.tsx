import { UserDTO } from "@dtos/UserDTO";
import { createContext, ReactNode, useEffect, useState } from "react";

import { storageAuhtTokenSave, storageAuhtTokenGet, storageAuhtTokenRemuve } from "@storage/storageAuthToken";
import { storageUserSave, storageUserGet, storageUserRemove } from "@storage/storageUser";

import { api } from "@services/api";

export type AuthContextDataProsp = {
  user: UserDTO;
  signIn: (email: string, senha: string) => Promise<void>;
  updateUserProfile: (userUpdated: UserDTO) => Promise<void>;
  signOut: () => Promise<void>;
  isLoasdingUserStorageData: boolean;
  refreshedToken: string;
}

type AuthContextProviderProps = {
  children : ReactNode;
}

export const AuthContext = createContext<AuthContextDataProsp>({} as AuthContextDataProsp);

export function AuthContextProvider({ children }: AuthContextProviderProps){
  const [ user , setUser] = useState<UserDTO>({} as UserDTO);
  const [ refreshedToken, setRefreshedToken] = useState('');
  const [isLoasdingUserStorageData, setIsLoasdingUserStorageData] = useState(true);

  async function userAndTokenUpdate(userData: UserDTO, token: string) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData);
  }

  async function storageUserAndTokenSave(userData: UserDTO, token: string) {
    try {
      setIsLoasdingUserStorageData(true);
      await storageUserSave(userData);
      await storageAuhtTokenSave(token);
    } catch (error) {
      throw error;
    } finally {
      setIsLoasdingUserStorageData(false);
    }
    
  }

  async function signIn(email: string, senha: string){

    const password = senha
    try {
      const { data } = await api.post('/sessions', {email, password});
      
      if (data.user && data.token) {
     
        await storageUserAndTokenSave(data.user, data.token) 
       
        await userAndTokenUpdate(data.user, data.token);
     
      }
    } catch (error) {

      throw error;
    }
  }

  async function signOut() {
    try {
      setIsLoasdingUserStorageData(true);

      setUser({} as UserDTO);
      await storageUserRemove();
      await storageAuhtTokenRemuve();

    } catch (error) {
      throw error;
    }finally {
      setIsLoasdingUserStorageData(false);
    }
  }

  async function updateUserProfile(userUpdated: UserDTO) {
    try {
      setUser(userUpdated);
      await storageUserSave(userUpdated);
    } catch (error) {
      throw error;
    }
  }

  async function loadUserData() {
    try {
      setIsLoasdingUserStorageData(true);

      const userLogged = await storageUserGet();
      const token = await storageAuhtTokenGet();

      if(token && userLogged){
        userAndTokenUpdate(userLogged, token);
      }
    } catch (error) {
        throw error;
    } finally {
      setIsLoasdingUserStorageData(false);
    }
    
  }

  function refreshTokenUpdated(newToken: string){
    setRefreshedToken(newToken);
  }

  useEffect(() => {
    loadUserData();
  }, []);
  useEffect(() => {
    const subscribe = api.registerIntercptTokenManager({ signOut, refreshTokenUpdated });
    return () => {
      subscribe();
    }
  }, [signOut]);

  return(
    <AuthContext.Provider value={
      {
        user, 
        signIn,
        signOut,
        updateUserProfile,
        isLoasdingUserStorageData,
        refreshedToken,
      }
    }>
      {children}
    </AuthContext.Provider>
  )
}