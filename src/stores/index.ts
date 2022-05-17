import type { AuthEntity, User, UserEntity } from "@/interface";
import { LibLoginTypes } from "@/utils/liblogin";
import api from "@/utils/request";
import { wallet } from "@/utils/wallet";
import { defineStore } from "pinia";

interface PairingState {
  pairingString: string;
  connectLocalWallet: Function;
  selectedWallet: LibLoginTypes.WalletMetadata;
  initialPair: boolean;
}

interface State {
  activePath: string | null;
  accountIds: string[];
  pairingState: Partial<PairingState>;
  walletsFound: LibLoginTypes.WalletMetadata[];
  selectedAccount: string;
  user: UserEntity | null;
  registered: Partial<User>;
  height?: number | string;
  width?: number | string;
}

export const useStore = defineStore({
  id: "main",
  state: () =>
    ({
      activePath: "/",
      accountIds: [],
      pairingState: {},
      walletsFound: [],
      selectedAccount: "",
      user: null,
      registered: {
        hasToken: false,
        isRegistered: false,
      },
    } as State),
  getters: {
    isWalletConnected(state) {
      return state.accountIds.length > 0;
    },
    isLoggedIn(state) {
      return !!state.user;
    },
    hasToken(state) {
      return !!state.registered.hasToken;
    },
    isRegistered(state) {
      return (
        !!state.registered.isRegistered ||
        (state.user && state.selectedAccount === state.user.authAccountId)
      );
    },
    hasDI(state) {
      return !!(state.user && state.user.diCid);
    },
    hasUserCid(state){
      return !!(state.user?.userCid)
    },
    hasTopic(state){
      return !!(state.user && state.user.topicId)
    },
    hasChannelCid(state){
      return !!(state.user && state.user.channel && state.user.channel.channelCid)
    },
    hasChannel(state){
      return !!(state.user && state.user.channel && state.user.channel.id)
    },
    getChannelId(state){
      return state.user?.channel?.id!
    },
    getChannelCid(state){
      return state.user?.channel?.channelCid!
    }
  },
  actions: {
    setActivePath(path: string) {
      this.activePath = path;
    },
    updateAccountIds(accountIds: string[]) {
      this.accountIds = accountIds;
      this.selectIntialAccount(accountIds);
    },
    async connectWallet(meta?: LibLoginTypes.WalletMetadata) {
      let state = this.pairingState;
      state["selectedWallet"] = meta;
      const data = await wallet.connect(meta);
      console.log(data);
      if (!data) return (state["initialPair"] = false);
      else {
        state["initialPair"] = true;
        state["pairingString"] = data.pairingString;
        state["connectLocalWallet"] = data.connectLocalWallet;
      }
    },
    async disconnectWallet() {
      await wallet.disconnect();
      this.updateAccountIds([]);
      this.selectedAccount = "";
    },
    async selectAccount(accountId: string) {
      // check if same account id selected again
      // also check if currently logged in user's account is selected
      if(!accountId) return
      if (
        this.selectedAccount === accountId ||
        (this.user && accountId === this.user.authAccountId)
      ) {
        this.selectedAccount = accountId;
        return;
      }

      // logout the current user if they are logged in
      if (this.isLoggedIn) await this.logout();

      // fetch if user registered etc
      this.registered = {
        hasToken: false,
        isRegistered: false,
      };
      this.selectedAccount = accountId;
      const { data: user } = await api.get<User | null>(`/users/${accountId}`);
      console.log({ user, registered: this.isRegistered });

      if (!user || !user.hasToken || !user.isRegistered) return;
      user.hasToken
        ? (this.registered["hasToken"] = true)
        : (this.registered["hasToken"] = false);
      user.isRegistered
        ? (this.registered["isRegistered"] = true)
        : (this.registered["isRegistered"] = false);
      console.log({ user, registered: this.isRegistered });
    },
    async selectIntialAccount(accountId: string[]) {
      if(accountId.length === 0) return
      if (this.isLoggedIn) {
        if (
          this.accountIds.findIndex(
            (accId) => accId === this.user!.authAccountId
          ) === -1
        ) {
          // authticated user's account not found in wallet connection
          await this.logout();
        } else {
          this.selectAccount(this.user!.authAccountId);
          return;
        }
      }
      this.selectAccount(accountId[0]);
    },
    async getCurrentUser() {
      const { data: user } = await api.get<UserEntity>(`/users/user`);
      user.id ? this.setUser(user) : this.setUser(null);
    },
    async logout() {
      try {
        await api.post("/users/logout");
        this.setUser(null);
      } catch (err) {
        console.log(err);
      }
    },
    setUser(user: UserEntity | null) {
      this.user = user;
      if (user) {
        this.registered = {
          hasToken: true,
          isRegistered: true,
        };
        this.selectAccount(user.authAccountId);
      }
    },
    checkIfUserRegisterd() {},
  },
});
