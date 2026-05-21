# wx-wechat-mini-program-manager

招人 More 微信小程序后台管理系统（本次测试使用）。

## 本地启动

先确保本地后端 `ai-training-backend` 已运行在 `http://localhost:8080`。

```bash
pnpm install
pnpm dev
```

管理端默认地址：

```text
http://localhost:5174
```

如需对齐微信小程序当前开发环境服务（`https://aihire.welsend.com/prod-api`），启动额外测试服务：

```bash
pnpm dev:miniapp
```

额外测试服务默认地址：

```text
http://localhost:5175
```

## 功能范围

- 埋点总览：对接 `/api/admin/candidate/trace/metrics`
- 链路事件：对接 `/api/admin/candidate/trace/flow`
- 错误日志：基于指定链路中的 `fail` / `warning` 埋点展示

首版为本地免登录模式，不新增或修改后端接口。
