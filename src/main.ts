import { createApp } from 'vue'
import { createPinia } from 'pinia'
import "./assets/index.css"
import App from './App.vue'
import router from './router'
import NProgress from './utils/NProgress'
import "nprogress/nprogress.css"


const app = createApp(App)
app.use(createPinia())
app.use(router)
NProgress(router)
app.mount('#app')
