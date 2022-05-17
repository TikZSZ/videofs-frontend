/// <reference types="vite/client" />

// declare module '*.vue' {
//   import { DefineComponent } from 'vue'
//   // eslint-disable-next-line
//   const component: DefineComponent<{}, {}, any>
//   export default component
// }

import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    // must be declared by every route
    requiresAuth?: boolean,
    requiresWallet?:boolean
  }
}
