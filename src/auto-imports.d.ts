// 自动导入 API 类型声明，供 vue-tsc 与编辑器识别。
export {};

declare global {
  /** Vue computed 自动导入。 */
  const computed: typeof import("vue")["computed"];
  /** Vue ref 自动导入。 */
  const ref: typeof import("vue")["ref"];
  /** Vue watch 自动导入。 */
  const watch: typeof import("vue")["watch"];
  /** Vue 模板引用自动导入。 */
  const useTemplateRef: typeof import("vue")["useTemplateRef"];
  /** Vue Router 当前路由自动导入。 */
  const useRoute: typeof import("vue-router")["useRoute"];
  /** Vue Router 路由实例自动导入。 */
  const useRouter: typeof import("vue-router")["useRouter"];
  /** VueUse 挂载生命周期自动导入。 */
  const tryOnMounted: typeof import("@vueuse/core")["tryOnMounted"];
  /** VueUse 卸载生命周期自动导入。 */
  const tryOnUnmounted: typeof import("@vueuse/core")["tryOnUnmounted"];
  /** VueUse 尺寸监听自动导入。 */
  const useResizeObserver: typeof import("@vueuse/core")["useResizeObserver"];
  /** VueUse 窗口尺寸自动导入。 */
  const useWindowSize: typeof import("@vueuse/core")["useWindowSize"];
}
