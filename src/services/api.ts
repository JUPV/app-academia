import { AppError } from '@utils/AppError';
import axios, { AxiosInstance } from 'axios';
import { storageAuhtTokenGet, storageAuhtTokenSave } from '@storage/storageAuthToken';



type PromiseType = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

type processQueueParams = {
  error: Error | null;
  token: string | null;
}

//refreshTokenUpdated

type registerIntercptTokenManagerProps = {
  signOut: () => void;
  refreshTokenUpdated: (newToken: string) => void;
}

type APIInstanceProps = AxiosInstance & {
  registerIntercptTokenManager: ({}:registerIntercptTokenManagerProps) => () => void;
};
//baseURL: 'http://env-5987957.jelastic.saveincloud.net' || baseURL: 'http://192.168.0.156:3333'
const api = axios.create({
  baseURL: 'http://env-5987957.jelastic.saveincloud.net'
}) as APIInstanceProps;

let isRefreshing = false;
let failedQueue: Array<PromiseType> = [];

const processQueue = ({ error, token = null }: processQueueParams ): void => {
  failedQueue.forEach(request => {
    if(error){
      request.reject(error);
    }else{
      request.resolve(token);
    }
    
  });
  failedQueue = [];
}

api.registerIntercptTokenManager = ({ signOut, refreshTokenUpdated }) => {

  const intercptTokenManager = api.interceptors.response.use(Response => Response, async requestError => {
    if(requestError?.response?.status === 401){
      if(requestError.response.data?.message === 'token.expired' || requestError.response.data?.message === 'token.invalid'){
        const oldToken = await storageAuhtTokenGet();

        if(!oldToken){
          signOut();
          return Promise.reject(requestError);
        }

        const originalRequest = requestError.config;
        if(isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({  resolve, reject});
          })
          .then(( token ) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((Error) => {
            throw Error;
          });
        }
        isRefreshing = true;

        return new Promise(async (resolve, reject) => {
          try {
            const {data} = await api.post('/sessions/refresh-token', { token: oldToken });
       
            await storageAuhtTokenSave(data.token);
            api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            originalRequest.headers['Authorization'] = `Bearer ${data.token}`;

            
            refreshTokenUpdated(data.token)
            processQueue({ error: null, token: data.token });

            resolve(originalRequest);            
          } catch (error: any) {
            processQueue({ error, token: null });
            signOut();
            reject(error);
          } finally {
            isRefreshing = false;
          }

        });

      }
      signOut();
    }


    if(requestError.response && requestError.response.data){
      return Promise.reject(new AppError(requestError.response.data.message));
    } else {
      return Promise.reject(requestError);
    }
  });

  return () => {
    api.interceptors.response.eject(intercptTokenManager);
  };

};



export { api };