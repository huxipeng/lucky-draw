import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import App from './App.vue'
import 'ant-design-vue/dist/reset.css'

const app = createApp(App)
const pinia = createPinia()

app.use(Antd)
app.use(pinia)
app.mount('#app')
