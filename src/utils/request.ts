import axios from "axios";
import { start, done } from "nprogress";

const api =  axios.create({
  baseURL:import.meta.env['VITE_APP_BASEURL'] as string || 'http://localhost:5000' ,
  withCredentials:true
})



api.interceptors.request.use(
  (config) => {
    start()
    return config
  },
  (error) => {
    done()
    return Promise.reject(error)
  }
);

api.interceptors.response.use(
  (config) => {
    done()
    return config
  },
  (error) => {
    done()
    return Promise.reject(error)
  }
);

export default api;