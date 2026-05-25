# wx-wechat-mini-program-manager

招人 More 微信小程序后台管理系统（本次测试使用）。

## 本地启动

开发环境服务地址已与 `wansaiwap` 小程序项目保持一致：`http://192.168.0.100:8080`。

```bash
pnpm install
pnpm dev
```

管理端默认地址：

```text
http://localhost:5174
```

如需以小程序开发模式启动额外测试服务：

```bash
pnpm dev:miniapp
```

额外测试服务默认地址：

```text
http://localhost:5175
```

## 功能范围

- 生产环境服务地址：`https://aihire.welsend.com/prod-api`
- 埋点总览：对接 `/admin/candidate/trace/metrics`
- 链路事件：对接 `/admin/candidate/trace/flow`
- 错误日志：基于指定链路中的 `fail` / `warning` 埋点展示

首版为本地免登录模式，不新增或修改后端接口。
