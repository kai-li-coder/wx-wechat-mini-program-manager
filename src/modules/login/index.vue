<!-- 管理端账号密码登录页面 -->
<template>
  <!-- 登录页面容器 -->
  <main class="login-page">
    <!-- 登录品牌区域 -->
    <section class="login-page__brand">
      <div class="login-page__logo">埋</div>
      <h1 class="login-page__title">Trace Admin</h1>
      <p class="login-page__subtitle">微信小程序后台管理系统</p>
    </section>

    <!-- 登录表单区域 -->
    <section class="login-page__panel">
      <div class="login-page__panel-header">
        <h2 class="login-page__panel-title">登录</h2>
      </div>

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
          <el-input v-model.trim="loginForm.account" :prefix-icon="User" autocomplete="username" placeholder="请输入账号" />
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
        <el-button class="login-page__submit" :loading="isSubmitting" type="primary" @click="handleLogin">
          登录
        </el-button>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { Lock, User } from "@element-plus/icons-vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";

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
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(320px, 0.9fr) minmax(360px, 1.1fr);
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(20, 184, 166, 0.08) 42%, rgba(245, 158, 11, 0.08)),
    $color-background;
}

.login-page__brand {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 56px;
  border-right: 1px solid rgba(229, 231, 235, 0.72);
  background: #ffffff;
}

.login-page__logo {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, #2563eb, #14b8a6);
  color: #fff;
  font-size: 22px;
  font-weight: 800;
}

.login-page__title {
  margin: 28px 0 8px;
  color: $color-text-primary;
  font-size: 34px;
  font-weight: 800;
  line-height: 42px;
}

.login-page__subtitle {
  margin: 0;
  color: $color-text-secondary;
  font-size: 15px;
  line-height: 24px;
}

.login-page__panel {
  align-self: center;
  width: min(420px, calc(100% - 48px));
  margin: 0 auto;
  padding: 32px;
  border: 1px solid $color-border;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: $shadow-panel;
}

.login-page__panel-header {
  margin-bottom: 24px;
}

.login-page__panel-title {
  margin: 0;
  color: $color-text-primary;
  font-size: 22px;
  font-weight: 700;
  line-height: 30px;
}

.login-page__form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.login-page__submit {
  width: 100%;
  margin-top: 8px;
}

@media (max-width: 860px) {
  .login-page {
    display: flex;
    min-height: 100vh;
    flex-direction: column;
  }

  .login-page__brand {
    padding: 32px 24px 16px;
    border-right: 0;
    background: transparent;
  }

  .login-page__title {
    margin-top: 18px;
    font-size: 28px;
    line-height: 36px;
  }

  .login-page__panel {
    width: calc(100% - 32px);
    margin: 20px auto 32px;
    padding: 24px;
  }
}
</style>
