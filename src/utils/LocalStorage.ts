import { useLocalStorage } from "@vueuse/core";
import type {RemovableRef} from "@vueuse/core"

interface Keys{
  public_key:string,
  x25519_public_key:string,
  privateKey:string
}

class LocalStore<T = any>{
  private  state:RemovableRef<Partial<T>> 
  constructor(private key:string){
    this.state = useLocalStorage(this.key,{})
  }

  setKeys(keys:Partial<T>){
    this.state.value = {...this.state.value,...keys}
    return this
  }

  clearKeys(){
    this.state.value = {}
    return this
  }

  get getKeys(){
    return this.state
  }
}

export const localKeysStore = new LocalStore<Keys>('keys');