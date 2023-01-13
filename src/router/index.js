import { createRouter, createWebHistory } from "vue-router";
import SynergyView from "../views/SynergyView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: SynergyView,
    },
  ],
});

export default router;
