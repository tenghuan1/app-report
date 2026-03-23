import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    currentMenu: null,
  }),
  actions: {
    setCurrentMenu(menu) {
      this.currentMenu = menu
    },
    clearCurrentMenu() {
      this.currentMenu = null
    },
  },
  getters: {
    getCurrentMenu: (state) => state.currentMenu,
  },
})
