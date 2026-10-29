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
  /** Vue 卸载前生命周期自动导入。 */
  const onBeforeUnmount: typeof import("vue")["onBeforeUnmount"];
  /** Vue Router 当前路由自动导入。 */
  const useRoute: typeof import("vue-router")["useRoute"];
  /** Vue Router 路由实例自动导入。 */
  const useRouter: typeof import("vue-router")["useRouter"];
  /** VueUse 挂载生命周期自动导入。 */
  const tryOnMounted: typeof import("@vueuse/core")["tryOnMounted"];
  /** VueUse 卸载生命周期自动导入。 */
  const tryOnUnmounted: typeof import("@vueuse/core")["tryOnUnmounted"];
  /** VueUse 媒体查询自动导入：仅在跨越断点时触发，替代连续的窗口宽度监听。 */
  const useMediaQuery: typeof import("@vueuse/core")["useMediaQuery"];
}
