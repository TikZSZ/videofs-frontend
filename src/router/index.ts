import { useStore } from "@/stores";
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/about",
      name: "about",
      component: () => import("@/views/AboutView.vue"),
    },
    {
      path: "/signup",
      name: "signup",
      component: () => import("@/views/SignUp.vue"),
      meta: {
        requiresWallet: true,
      },
    },
    {
      path: "/app",
      name: "app",
      component: () => import("@/views/App.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/views/Dashboard/Dashboard.vue"),
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: "topic",
          name: "topic",
          component: () => import("@/views/Dashboard/Topic.vue"),
        },
        {
          path: "decentralised-identity",
          name: "di",
          component: () => import("@/views/Dashboard/DI.vue"),
        },
        {
          path: "profile",
          name: "profile",
          component: () => import("@/views/Dashboard/Profile.vue"),
        },
        {
          path: "channel",
          name: "prod",
          component: () => import("@/views/Dashboard/Channel.vue"),
        },
        {
          name: "videos",
          path: "videos",
          component: () => import("@/views/Dashboard/Videos.vue"),
        },
        {
          name: "ipfs-videos",
          path: "ipfs-videos",
          component: () => import("@/views/Dashboard/IpfsVideos.vue"),
        },
        {
          name: "Tokens",
          path: "Tokens",
          component: () => import("@/views/Dashboard/Tokens.vue"),
        },
        {
          name: "Payments",
          path: "Payments",
          component: () => import("@/views/Dashboard/Payments.vue"),
        },
      ],
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const store = useStore();
  let fullPath: string = to.fullPath;
  // check if wallet required
  if (
    to.matched.some((route) => {
      return !!route.meta.requiresWallet;
    })
  ) {
    if (!store.isWalletConnected) {
      fullPath = "/";
      next({ path: "/" });
    } else {
      next();
    }
  }
  // check if authentication required
  else if (
    to.matched.some((route) => {
      return !!route.meta.requiresAuth;
    })
  ) {
    if (store.isLoggedIn) {
      next();
    } else {
      const user = await store.getCurrentUser();
      if (store.isLoggedIn) {
        next();
      } else {
        fullPath = "/";
        next({ path: "/" });
      }
    }
  }
  // standard next call
  else {
    next();
  }
  store.setActivePath(fullPath);
});

export default router;
