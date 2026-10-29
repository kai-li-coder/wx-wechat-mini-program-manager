<!-- 管理端账号密码登录页面：浅青画布 + 白色圆角登录卡片 -->
<template>
  <!-- 登录页面容器 -->
  <main class="login-page">
    <!-- 背景光晕：青蓝与浅青各一枚，低透明度大范围模糊 -->
    <span class="login-page__glow login-page__glow--teal" aria-hidden="true" />
    <span class="login-page__glow login-page__glow--mint" aria-hidden="true" />

    <!-- 登录面板 -->
    <section class="login-page__panel">
      <!-- 品牌标识 -->
      <header class="login-page__brand">
        <span class="login-page__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M2 12h4l3-7 4 14 3-7h6"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
            />
          </svg>
        </span>
        <div class="login-page__brand-text">
          <span class="login-page__brand-title">TRACE ADMIN</span>
          <span class="login-page__brand-sub">招人more埋点监测</span>
        </div>
      </header>

      <!-- 标题区 -->
      <span class="login-page__eyebrow">ADMIN ACCESS</span>
      <h1 class="login-page__title">登录控制台</h1>
      <p class="login-page__desc">使用管理端账号登录</p>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-page__form"
        label-position="top"
        size="large"
        @keyup.enter="handleLogin"
      >
        <!-- 账号输入框 -->
        <el-form-item label="账号" prop="account">
          <el-input
            v-model.trim="loginForm.account"
            :prefix-icon="User"
            autocomplete="username"
            placeholder="请输入账号"
          />
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            :prefix-icon="Lock"
            autocomplete="current-password"
            placeholder="请输入密码"
            show-password
            type="password"
          />
        </el-form-item>

        <!-- 登录提交按钮 -->
        <el-button
          class="login-page__submit"
          :loading="isSubmitting"
          type="primary"
          @click="handleLogin"
        >
          登录
        </el-button>
      </el-form>

      <!-- 底部标识 -->
      <p class="login-page__foot">招人More 埋点检测 · 管理端</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { Lock, User } from "@element-plus/icons-vue";
// ElMessage 走组件子路径导入，避免 Element Plus 桶入口把全量组件带进产物；
// FormInstance / FormRules 是纯类型，编译期即被擦除，保留包入口导入不影响体积。
import { ElMessage } from "element-plus/es/components/message/index";
import type { FormInstance, FormRules } from "element-plus";

import type { AdminLoginRequest } from "@/api/auth";
import { resolveLoginRedirectPath } from "@/router/authGuard";
import { useAuthStore } from "@/stores/useAuthStore";

/** 登录表单模板引用。 */
const loginFormRef = useTemplateRef<FormInstance>("loginFormRef");
/** 当前路由对象。 */
const currentRoute = useRoute();
/** 路由实例。 */
const router = useRouter();
/** 管理端鉴权状态。 */
const authStore = useAuthStore();

/** 登录表单数据。 */
const loginForm = ref<AdminLoginRequest>({
  account: "",
  password: "",
});

/** 登录表单校验规则。 */
const loginRules: FormRules<AdminLoginRequest> = {
  account: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

/** 登录提交状态。 */
const isSubmitting = ref(false);

/** 登录成功后跳转路径。 */
const redirectPath = computed(() => resolveLoginRedirectPath(currentRoute.query.redirect));

/** 提交登录表单。 */
const handleLogin = async () => {
  const formInstance = loginFormRef.value;
  if (!formInstance) {
    return;
  }

  const isValid = await formInstance.validate().catch(() => false);
  if (!isValid) {
    return;
  }

  isSubmitting.value = true;
  try {
    await authStore.login({
      account: loginForm.value.account.trim(),
      password: loginForm.value.password,
    });
    ElMessage.success("登录成功");
    await router.replace(redirectPath.value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "登录失败";
    ElMessage.error(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 48px 24px;
  background: $color-background;
}

/* 大范围模糊光晕，替代纯色平铺，保持参考图的轻盈氛围 */
.login-page__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
}

.login-page__glow--teal {
  top: -180px;
  right: -100px;
  width: 520px;
  height: 520px;
  background: rgba(10, 144, 161, 0.16);
}

.login-page__glow--mint {
  bottom: -200px;
  left: -120px;
  width: 480px;
  height: 480px;
  background: rgba(124, 196, 205, 0.24);
}

.login-page__panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  border: 1px solid #eff4f5;
  border-radius: $radius-lg;
  background: $color-surface;
  box-shadow: $shadow-overlay;
  animation: page-rise $dur-slow $ease-out both;
}

.login-page__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: $space-6;
  border-bottom: 1px solid $color-border-soft;
}

.login-page__mark {
  display: grid;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #12a5b7, #077987);
  box-shadow: 0 8px 18px rgba(10, 144, 161, 0.28);
  color: #ffffff;
}

.login-page__mark svg {
  width: 20px;
  height: 20px;
}

.login-page__brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.login-page__brand-title {
  color: $color-text-primary;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 18px;
}

.login-page__brand-sub {
  color: $color-text-muted;
  font-size: 11px;
  line-height: 15px;
}

.login-page__eyebrow {
  display: block;
  margin-top: $space-6;
  color: $color-accent-strong;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.login-page__title {
  margin-top: 6px;
  color: $color-text-primary;
  font-size: $font-size-2xl;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.login-page__desc {
  margin-top: 4px;
  color: $color-text-muted;
  font-size: $font-size-base;
}

.login-page__form {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: $space-5;
}

.login-page__form :deep(.el-form-item__label) {
  height: auto;
  padding-bottom: 6px;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  line-height: 18px;
}

.login-page__submit {
  width: 100%;
  height: 44px;
  margin-top: $space-2;
  border-radius: 12px;
  font-size: $font-size-md;
  letter-spacing: 0.06em;
}

.login-page__foot {
  margin-top: $space-6;
  padding-top: $space-4;
  border-top: 1px solid $color-border-soft;
  color: $color-text-muted;
  font-size: 10.5px;
  text-align: center;
}

@include screen-sm {
  .login-page {
    padding: $space-5 $space-4;
  }

  .login-page__glow {
    filter: blur(64px);
  }

  .login-page__panel {
    padding: 28px 22px;
    border-radius: $radius-md;
  }

  .login-page__title {
    font-size: $font-size-xl;
  }
}
</style>
