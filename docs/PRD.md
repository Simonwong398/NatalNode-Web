# NatalNode.com 网站产品需求文档（PRD）

**文档版本**：v1.0 — Launch Architecture Baseline  
**产品名称**：NatalNode.com  
**产品类型**：NatalNode Engine 第一方 Web Reference Application + Consumer Astrology Platform  
**状态**：Architecture Frozen / Implementation Ready  
**日期**：2026-08-25  
**网站域名**：natalnode.com  
**网站项目仓库建议**：`C:\NatalNode-Web`  
**核心原则**：Engine-first / Provider-neutral / Truthful provenance / No provider lock-in

---

# 0. 文档目的

本文档定义 NatalNode.com 的首发产品范围、网站架构、Engine 接入边界、用户流程、数据模型、API 约束、隐私安全、缓存、广告与订阅、性能、测试、部署与发布门槛。

NatalNode.com 必须能够在最终 production astronomy provider 尚未确定的情况下独立开发。网站层不得依赖或感知任何具体星历实现，也不得因为未来底层 provider 的替换而推倒重做。

本文档是**网站开发的 source of truth**。未经明确架构决策，不应由 Codex 或其他开发代理自行扩大范围。

---

# 1. 战略背景

NatalNode Platform 的产品结构固定为：

```text
NatalNode Platform
├── NatalNode Engine
├── NatalNode SDK / API
└── NatalNode.com
```

依赖关系固定为：

```text
NatalNode.com
      ↓
NatalNode Website API / BFF
      ↓
NatalNode Engine Public API
      ↓
AstronomyProvider
      ↓
Production Astronomy Provider
```

NatalNode.com 是 NatalNode Engine 的第一方客户端，但不得直接访问 astronomy provider，也不得内置星历算法。

当前 numerical astronomy provider 仍处于 rights / production-selection 决策阶段。因此网站开发必须与以下具体实现解耦：

- VSOP87
- TOP2013
- Candidate D
- Candidate E
- JPL/SPICE kernels
- Astronomy Engine
- Swiss Ephemeris
- 任何未来 Provider X

网站代码中禁止出现依赖这些实现的业务逻辑。

---

# 2. 产品定位

NatalNode.com 是一个面向普通用户、进阶占星爱好者和专业占星师的现代专业占星网站。

首发定位不是“做功能最多的占星网站”，而是：

> **快速、现代、透明、可验证的专业星盘体验。**

核心差异化来自：

1. NatalNode Engine 的确定性计算；
2. 专业、清晰、高质量的 Chart UX；
3. 计算过程的可追溯性；
4. AI 只解释 Engine facts，而不自行计算星盘；
5. 后续可扩展为 NatalNode API / SDK 的公开 reference implementation。

---

# 3. 产品目标

## 3.1 首发四大目标

### Calculate
用户无需注册即可快速生成专业本命盘。

### Understand
将 Engine 输出的结构化事实转化为清晰、可读、可引用的解释。

### Save
注册用户可保存、管理、标记和重新访问星盘。

### Trust
专业用户可查看 Engine 版本、时间政策、科学配置身份与 provenance 身份。

---

# 4. 非目标（v1 明确不做）

以下功能不进入 Launch MVP：

- 3D Astrocartography
- 占星师 Marketplace
- 多人合盘
- Firdaria
- Annual Profection
- 完整 Solar Arc 工作台
- 浏览器本地 WASM 星历计算
- 客户端分发 ephemeris artifacts
- Rewarded Ads
- Header Bidding
- 无限 AI
- 社区 / 关注 / 私信
- 直播
- 完整 B2B Developer Portal
- 复杂 WebSocket 长任务体系
- Kubernetes 作为首发基础设施
- provider-specific production UI

这些功能可以出现在长期 Roadmap，但不能由 Codex 在 v1 中提前实现。

---

# 5. 用户类型

## 5.1 Guest
能力：
- 无需注册生成本命盘
- 查看基础星盘
- 查看基础结构化解释
- 临时保留当前会话星盘
- 浏览学习中心和 SEO 工具

限制：
- 不提供跨设备恢复
- 不提供永久 Vault
- 不提供完整 AI 历史
- 不承诺云端保存

## 5.2 Registered Free User
能力：
- Guest 全部能力
- Chart Vault
- 星盘笔记
- 基础 Current Transit
- 有限 AI 配额（P1）
- 有广告

## 5.3 Pro User
能力：
- 无广告
- 更大 Vault
- 高级 Interpretation
- 高级 Transit 工具
- 高 AI 配额 / Fair Use
- PDF / 分享导出（P1）
- 后续高级技法

禁止在产品文案中承诺“Unlimited AI”。

## 5.4 Developer
Developer API 属于独立产品面：`NatalNode Developers`。

未来独立提供：
- API Keys
- Usage Dashboard
- Rate Limits
- Billing
- API Docs
- SDK Docs
- Status Page

Launch 只保留入口或 waitlist 页面。

---

# 6. 产品原则

## 6.1 Engine-first
以下事实必须全部来自 NatalNode Engine：
- Sun / Moon / planets positions
- Signs
- ASC / MC
- Houses
- House assignment
- Aspects
- Orb
- Applying / Exact / Separating
- Retrograde / Station / Direct
- Scientific warnings

前端不得重复实现这些逻辑。

## 6.2 AI does not calculate astrology
AI 输入必须是 Engine 已确认的结构化 ChartFacts。

错误架构：

```text
出生数据
→ LLM
→ LLM 自己计算/猜测星盘
```

正确架构：

```text
出生数据
→ NatalNode Engine
→ ChartFacts
→ AI
→ Interpretation
```

AI 只负责语言解释、归纳、问答和个性化表达。

## 6.3 Provider-neutral
网站只能依赖 NatalNode Engine Public API。

网站不得知道或判断当前用了哪个 ephemeris dataset/provider。

## 6.4 Truthful incompleteness
若 staging / research Engine 返回 `INCOMPLETE_RESEARCH`，网站不得伪造：
- astronomyConfigurationId
- provenanceEnvelopeId
- production validated
- commercially cleared
- highest accuracy

---

# 7. 总体系统架构

```text
┌─────────────────────────────────────────────┐
│                natalnode.com                │
│ Astro + React Islands                       │
│ Birth Input / Chart / Interpretation / Vault│
└────────────────────┬────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────┐
│         NatalNode Website API / BFF         │
│ Hono / Auth / Vault / Cache / Tier / AI     │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              NatalNode Engine API           │
│ calculateChart / TimeAuthority / Provenance │
└────────────────────┬────────────────────────┘
                     │
                     ▼
              AstronomyProvider
                     │
                     ▼
             Production Provider
```

---

# 8. 仓库与项目边界

推荐新建独立网站仓库：

```text
C:\NatalNode
    → Engine / astronomy / conformance repository

C:\NatalNode-Web
    → natalnode.com website repository
```

不建议 `C:\NatalNode\website`。

原因：
1. 防止 Codex 误改 Engine scientific files；
2. 防止 licensing-sensitive research artifacts 进入网站构建上下文；
3. 保证网站只依赖 Public API；
4. 独立部署、独立 release；
5. provider replacement 不污染网站 git history。

---

# 9. 推荐目录结构

```text
C:\NatalNode-Web
├── apps/
│   └── web/
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── features/
│       │   │   ├── chart-input/
│       │   │   ├── chart-workspace/
│       │   │   ├── chart-renderer/
│       │   │   ├── interpretation/
│       │   │   ├── vault/
│       │   │   ├── transits/
│       │   │   └── calculation-details/
│       │   ├── lib/
│       │   └── styles/
│       └── public/
├── packages/
│   ├── contracts/
│   ├── engine-client/
│   ├── ui/
│   └── test-fixtures/
├── server/
│   └── src/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── ENGINE_CLIENT_CONTRACT.md
│   ├── SECURITY.md
│   └── ADR/
└── README.md
```

---

# 10. 技术栈

Frontend：
- Astro
- React Islands
- TypeScript
- Tailwind CSS
- shadcn/ui
- SVG-first Chart Renderer

Website API / BFF：
- Node.js
- Hono
- TypeScript

Storage：
- PostgreSQL
- Managed Redis

Auth：
- Email magic link
- Google Sign-In

Observability：
- Sentry
- structured logs
- requestId
- OpenTelemetry（按需）

Deployment：
- Frontend：Vercel / Cloudflare
- BFF：Managed container/serverless
- PostgreSQL：Managed
- Redis：Managed
- NatalNode Engine：独立 service/container

Kubernetes：DEFERRED。

---

# 11. EngineClient 抽象

```ts
interface EngineClient {
  calculateChart(request: ChartRequest): Promise<ChartResult>;
}
```

开发期：`MockEngineClient`  
生产期：`HttpEngineClient`

网站所有业务逻辑必须依赖 `EngineClient` interface，而不是具体 HTTP URL。

---

# 12. MockEngineClient

等待 production provider 授权期间，网站开发使用 `WEB_UI_FIXTURE_V1`。

用途仅限：
- UI
- SVG renderer
- Interaction
- Responsive layout
- Interpretation UI
- Vault
- SEO examples
- Calculation Details

明确标记：

```text
UI DEVELOPMENT ONLY
NOT SCIENTIFIC EVIDENCE
NOT PRODUCTION ASTRONOMY
```

---

# 13. 网站路由

```text
/
├── /chart
├── /charts
├── /transits
├── /tools
│   ├── /birth-chart
│   ├── /rising-sign
│   ├── /moon-sign
│   └── /current-planets
├── /learn
│   ├── /signs
│   ├── /planets
│   ├── /houses
│   ├── /aspects
│   ├── /retrograde
│   └── /transits
├── /pricing
├── /developers
├── /about
├── /privacy
└── /terms
```

---

# 14. 首页与 Quick Chart

用户进入 natalnode.com 后，应能以最短路径生成第一张星盘。

首屏输入：
- Birth date
- Birth time
- Birth place

CTA：`Create My Chart`

不要求注册。

辅助说明：
- No account required
- Professional chart calculation
- Calculation details available
- Privacy-first

---

# 15. Birth Input 与历史时区

## 15.1 标准模型

```ts
interface BirthInputResolved {
  localDate: string;
  localTime: string | null;
  locationLabel: string;
  latitude: number;
  longitude: number;
  ianaTimeZone: string;
  resolvedUtcInstant: string | null;
  utcOffsetSeconds: number | null;
  timezoneDatabaseVersion: string;
  timezoneResolutionMethod: string;
  ambiguityStatus:
    | "EXACT"
    | "AMBIGUOUS"
    | "NONEXISTENT"
    | "UNKNOWN_TIME";
}
```

## 15.2 DST Ambiguous Local Time
若 DST 回拨使同一本地时间出现两次，UI 必须要求用户选择 earlier/later occurrence，禁止静默选择。

## 15.3 Nonexistent Local Time
若 DST 前跳使时间不存在，返回 `NONEXISTENT_LOCAL_TIME` 并要求用户确认。

## 15.4 Unknown Birth Time
用户可选择 `I don't know my exact birth time`。

此状态下禁止宣称精确：
- ASC
- MC
- Houses
- House-based interpretation

不得偷偷以 12:00 作为真实出生时间。

---

# 16. Chart Workspace

Desktop：

```text
┌───────────────────────────────────────────────┐
│ Chart Header                                  │
├─────────────────────┬─────────────────────────┤
│     Chart Wheel     │      Interpretation     │
├─────────────────────┴─────────────────────────┤
│ Calculation Details                           │
└───────────────────────────────────────────────┘
```

Mobile 使用 Tabs 或 stacked layout。

---

# 17. SVG Chart Renderer

v1 使用 SVG-first。

显示：
- Zodiac ring
- 12 signs
- 10 bodies
- ASC
- MC
- 12 house cusps
- Major aspects
- degree labels
- retrograde indicator

Engine 不返回 `canvasAngle`。Renderer 从 longitude 做坐标转换。

默认 aspects：
- conjunction
- opposition
- trine
- square
- sextile

---

# 18. House Systems

v1 UI 至少开放：
- Placidus
- Whole Sign
- Equal

Engine 支持的其他 systems 后续逐步开放。

UI 不实现 house 算法。

---

# 19. Calculation Details

默认折叠。

完整配置：

```text
Engine
NatalNode Engine

Engine Version
x.x.x

Chart Schema
1.0.0

Time Policy
NATALNODE_TIME_POLICY_V1@1.0.0

Astronomy Configuration
sha256:...

Provenance Envelope
sha256:...

House System
Placidus

Warnings
None
```

Research/staging：

```text
Calculation Status
Research configuration

Astronomy Configuration
Unavailable

Reason
Incomplete research configuration
```

不得输出假的 hash。

---

# 20. Interpretation v1

Launch 首先实现 deterministic interpretation。

结构：
- Big Three
- Planets in Signs
- Planets in Houses
- Major Aspects
- Chart emphasis / patterns（仅基于明确 Engine facts）

文案要求：
- 原创
- 现代心理占星方向
- 非宿命论
- 清晰说明依据
- 不模仿具体作者风格

---

# 21. AI Interpretation（P1）

AI 使用 `ChartFact`：

```ts
interface ChartFact {
  factId: string;
  type: string;
  bodies?: string[];
  house?: number;
  sign?: string;
  aspect?: string;
  orb?: number;
  phaseState?: string;
}
```

AI 回答支持引用：
> 依据：Saturn conjunction Sun — orb 1.21°, applying.

AI 不得创造不存在的 chart facts。

---

# 22. Chart Vault

注册用户可保存：
- Self
- Partner
- Family
- Friend
- Client

功能：
- rename
- tag
- favorite
- duplicate
- notes
- delete

Guest 只做 session/local temporary chart，不做跨设备恢复码。

---

# 23. Auth

Launch：
- Email Magic Link
- Google Sign-In

其他认证后移。

---

# 24. Current Transits（P1）

第一阶段 predictive technique 只做 Current Transits。

UI：
```text
Natal Wheel
+
Transit Outer Wheel
+
Date Selector
```

基础控制：
- Today
- +1 day
- -1 day
- +1 hour
- -1 hour

---

# 25. SEO Tools

Launch 2–4 个：
- Birth Chart Calculator
- Rising Sign Calculator
- Moon Sign Calculator
- Current Planet Positions

计算仍经 Website API → EngineClient。

---

# 26. Learning Hub

内容：
- Signs
- Planets
- Houses
- Aspects
- Retrograde
- Transits
- Glossary

技术：
- Astro
- MDX/content collections

允许嵌入互动示例与 calculators。

---

# 27. API 分层

Engine API 只负责：
- chart facts
- scientific metadata
- warnings
- configuration identity
- provenance identity

BFF 负责：
- auth
- user state
- rate limit
- vault
- subscription
- cache
- ads state
- AI orchestration

---

# 28. Website API 示例

```json
{
  "meta": {
    "requestId": "req_...",
    "cacheStatus": "hit",
    "userTier": "free",
    "showAds": true
  },
  "chart": {
    "schemaVersion": "1.0.0",
    "engineVersion": "x.x.x",
    "bodies": [],
    "angles": {},
    "houses": {},
    "aspects": [],
    "warnings": [],
    "metadata": {
      "astronomyConfigurationId": "sha256:...",
      "provenanceEnvelopeId": "sha256:..."
    }
  }
}
```

---

# 29. Error Model

采用 RFC 9457 Problem Details。

核心错误码：
- INVALID_BIRTH_DATE
- INVALID_LOCAL_TIME
- AMBIGUOUS_LOCAL_TIME
- NONEXISTENT_LOCAL_TIME
- LOCATION_NOT_FOUND
- TIMEZONE_RESOLUTION_FAILED
- UNSUPPORTED_TIME_DOMAIN
- CALCULATION_FAILED
- CALCULATION_TIMEOUT
- ENGINE_CONFIGURATION_INCOMPLETE
- ENGINE_UNAVAILABLE
- RATE_LIMIT_EXCEEDED

---

# 30. Cache

禁止 hour-level shared planet cache。

v1 只缓存完整 ChartResult。

Cache key：

```text
SHA-256(
  canonicalChartRequest
  +
  engineVersion
  +
  chartSchemaVersion
  +
  astronomyConfigurationId
)
```

provider/model/time policy 改变时 configuration ID 改变，旧缓存自然失效。

---

# 31. 数据库

PostgreSQL。

Launch tables：

```text
users
charts
chart_notes
subscriptions
ai_usage
audit_events
```

Chart 保存：
- normalized input JSON
- canonical Engine result JSON
- engineVersion
- chartSchemaVersion
- astronomyConfigurationId
- provenanceEnvelopeId（如果存在）
- createdAt
- updatedAt

避免把完整星盘拆成大量 SQL 列。

---

# 32. Privacy

出生日期、出生时间、出生地点属于敏感个人资料。

要求：
- TLS in transit
- encryption at rest
- least privilege
- delete account/data
- export user data
- retention policy
- access audit

明确禁止：
> 将用户出生资料、星盘 facts、占星解释直接发送给广告平台作为 targeting profile。

---

# 33. 日志与隐私

普通日志允许：
- requestId
- duration
- engineVersion
- chartSchemaVersion
- astronomyConfigurationId
- cacheStatus
- errorCode

普通日志禁止记录完整出生日期、出生时间、精确出生地点。

---

# 34. PWA

Launch 可支持：
- installable shell
- cached static UI
- cached Learn pages
- previously viewed UI assets

不支持：
- local ephemeris calculation
- WASM astronomy provider
- client-side scientific artifacts

直到最终 provider 的 client-side distribution rights 明确。

---

# 35. Ads

核心规则：
> Chart Wheel 和核心交互区绝对无广告覆盖。

Launch 允许：
- SEO tool bottom
- Learn article inline
- Desktop interpretation sidebar

不做：
- popup ads
- interstitial
- rewarded video
- chart overlay

Ads 属于 Website 层，不属于 Engine。

---

# 36. Pro

Free + Pro。

Pro：
- no ads
- larger Vault
- advanced interpretation
- advanced Transit
- higher AI quota / Fair Use
- PDF export

定价在商业验证后决定，不在架构 PRD 中永久冻结。

---

# 37. Accessibility

目标：
- Keyboard navigation
- Visible focus
- Semantic forms
- ARIA where required
- Contrast AA baseline
- SVG chart supporting descriptive text
- 不依赖颜色单独表达 aspect 类型

---

# 38. Performance

Launch baseline：

```text
LCP < 2.5s p75
CLS < 0.1
INP < 200ms p75
```

Chart UI typical interaction frame < 16ms。

API：
- cached p95 < 300ms
- uncached target p95 < 1000ms

最终 uncached SLA 以真实 production Engine benchmark 冻结。

---

# 39. Observability

所有 BFF 请求：
- requestId
- route
- status
- duration
- cache status

Engine requests：
- engineVersion
- astronomyConfigurationId
- provenance status
- duration
- warning count

---

# 40. Security

Launch baseline：
- CSRF protection where applicable
- secure session cookies
- SameSite policy
- rate limits
- account enumeration prevention
- input validation
- safe SQL/ORM access
- CSP
- secure headers
- dependency scanning
- secrets outside repo

Engine credentials 不允许暴露给 browser。

---

# 41. Test Strategy

Frontend：
- component tests
- renderer geometry tests
- responsive tests
- accessibility smoke
- critical E2E flows

BFF：
- contract tests
- auth tests
- cache tests
- rate-limit tests
- validation tests

Engine Client：
- MockEngineClient contract
- HttpEngineClient contract
- malformed Engine response
- incomplete research metadata
- timeout
- version mismatch

Website tests 不重复验证 astronomy mathematics。

---

# 42. Environments

至少：
- local
- staging
- production

Local：
- MockEngineClient 默认

Staging：
- Mock 或明确 research Engine
- 显示 Research configuration 标签

Production：
- 只能连接 production-approved Engine

---

# 43. Feature Flags

建议：
- AI_INTERPRETATION
- TRANSITS
- ADS
- PRO_SUBSCRIPTION
- PDF_EXPORT
- ENGINE_REAL_BACKEND
- RESEARCH_CONFIGURATION_BANNER

禁止 provider-specific feature flags 出现在网站层。

---

# 44. Website Release Gate

网站代码可提前完成并部署 staging。

Production public astrology calculation 必须满足：

1. Production astronomy provider approved
2. Commercial rights resolved
3. Selected provider clean-checkout/runtime asset gate resolved
4. final scientificConfigurationId complete
5. final provenanceEnvelopeId complete
6. production Engine deployment ready
7. final Full Chart E2E passed
8. Website ↔ Engine contract test passed
9. Privacy baseline passed
10. Security baseline passed

---

# 45. Launch P0

必须完成：
- Website repository
- Design system
- Responsive shell
- Birth input
- Historical timezone UX
- MockEngineClient
- SVG Chart Renderer
- Chart Workspace
- Calculation Details
- deterministic basic interpretation
- Guest
- Auth
- Vault
- 2–4 SEO tools
- Learn foundation
- Website BFF
- Cache abstraction
- Error model
- Privacy baseline
- Observability
- staging deployment

---

# 46. P1

- Current Transits
- AI interpretation
- Pro
- Ads
- PDF
- Interpretation expansion
- more SEO tools

# 47. P2

- Synastry
- Composite
- Davison
- Progressions
- Solar Return
- Lunar Return
- Advanced Reports
- Developer Portal

# 48. P3

- Astrocartography
- 3D map
- Astrologer Marketplace
- advanced traditional techniques
- rewarded ads
- API ecosystem integrations

---

# 49. 等待授权期间允许开发

允许：
- repo scaffold
- Astro/React
- design system
- routing
- Birth Input UX
- timezone architecture
- SVG renderer
- Chart Workspace
- Calculation Details UI
- MockEngineClient
- Vault
- Auth
- BFF
- DB schema
- SEO
- Learn
- privacy
- error handling
- cache abstraction
- observability
- staging

---

# 50. 等待授权期间禁止开发

禁止：
- VSOP87 removal
- Candidate D production binding
- Candidate E production binding
- Candidate E expansion to Mercury–Saturn
- JPL artifact redistribution
- outer artifact repository remediation
- browser WASM ephemeris
- production provider disclosure UI
- production Engine deployment
- Full Chart E2E materialization
- provider-specific website logic

---

# 51. Codex 工作规则

网站 repository 的 Codex 开发必须遵循：

1. 不访问或修改 `C:\NatalNode`，除非用户明确要求只读查看接口文档；
2. 不复制 Engine science code 到 Web repo；
3. 不实现任何 astronomy calculation；
4. 不自行添加 Swiss Ephemeris / VSOP / JPL / Astronomy Engine dependencies；
5. 默认使用 MockEngineClient；
6. 一次只做一个小 patch；
7. Large implementation 之前先定义 semantic responsibility boundaries；
8. 新增 behavioral module 不得超过约 500 LOC，除非记录明确 justification；约 350 LOC 触发 architecture review；
9. 既有 oversized file 按 grandfather rule 处理，不自动变成 refactor task；
10. 不得在没有用户明确授权的情况下进行 repository-wide decomposition / audit；
11. characterization 仅按 risk-driven 原则执行，product delivery 优先于 cosmetic cleanup；
12. 普通 patch 只做 targeted validation，并控制 validation cost；
13. meaningful commit boundary 必须提交；
14. 不自动增加 P1/P2/P3 功能；
15. docs/Git 为 source of truth。

## 51.1 Maintainability and Module-Growth Guardrails

Repository-wide Proactive Large-File Decomposition Program = **PAUSED**。
Existing large-file audit 不是 mandatory execution backlog；product delivery 优先于 repository-wide cosmetic architecture cleanup。
LOC thresholds 是 heuristic guardrails；它们不是 lint rules，不是 automatic refactor triggers，也不是修改 working code 的理由。本规则主要作为 Codex 的 planning constraint，用于节省 engineering effort 与 token consumption，而不是增加 process debt。

当前状态：

```text
Proactive Large-File Decomposition Program
= PAUSED

Completed historical decomposition work remains accepted.
Remaining large-file audit candidates are NOT the active roadmap.
```

因此，不得仅因 file size 继续推进以下工作：

- ChartRenderer decomposition
- global.css decomposition
- SavedVaultChartExperience decomposition
- local-public-edge decomposition
- migration-runner decomposition
- rate-limit module decomposition
- Feedback decomposition
- 其他 audit-ranked files

Historical audit records 仅作为 reference material 保留，不得删除。已完成的 decomposition 不得 revert 或改回，包括 Vault management client decomposition、Vault component decomposition、Contracts chart extraction 与 BirthInputForm decomposition；本政策只约束 future prioritization。

治理原则：

- 以 responsibility-first 定义模块边界；优先保持单一、cohesive behavioral responsibility，而不是按文件大小机械拆分。
- Behavioral module 的 preferred range 约为 100–300 LOC；约 350 LOC 触发 architecture review。新生成的 handwritten behavioral module 约 500 LOC 是 hard growth gate；如果预计实现会越过该门槛，必须在生成 large implementation 之前停下并先重划 semantic boundaries，而不是事后安排 cleanup。
- Existing-file grandfather rule：既有 oversized file 不因历史大小自动触发拆分或 cleanup task。只有 actively blocking a product feature、反复造成 defect/unsafe change、所需 feature change 会明显加重 responsibility overload、security/privacy/scientific correctness 需要重构，或用户明确授权时，才允许 dedicated decomposition；产品工作触及既有大文件时，应做最小安全变更并只在自然且低成本时提取新增 cohesive responsibility。
- Feature planning 必须在 meaningful feature 实现前静默检查将修改的 module、新 responsibility、归属与预期增长；不创建单独 audit task 或长报告。只有可能生成超过 500 LOC 的 behavioral module、存在真正竞争的 architecture design，或影响 public contract/security/scientific boundary 时，才向用户提出边界决策。
- 对约 350 LOC 或以上的 behavioral source file，新增约 80 行以上的 clearly independent responsibility 时，应在同一 feature patch 中优先建立 cohesive sibling boundary；如果责任不可分，cohesion 优先于算术阈值。
- Exemptions 包括 generated code、lockfiles、static data、fixtures、migration SQL、declarative schemas、configuration、vendor/third-party content，以及 test files。Stylesheet 需按 cascade/layer 特殊判断；不得仅因 line count 拆分 global.css，但有自然边界的新 feature styling 不应无关堆入 global stylesheet。
- Large test file 不是自动 technical debt；测试应按 behavioral domain、fixture boundary 或 harness responsibility 组织，而不是按 LOC 机械拆分。Test file 不受 behavioral-module hard gate 直接约束，但仍须保持清晰、可定位和风险适配。
- 对既有行为的 characterization 采用 risk-driven policy：只在 required product work 的高风险行为、真实 defect、安全/隐私/科学边界变更或明确授权 refactor 需要时补充；不因“文件很长”而创建大套件。
- Validation 采用 targeted-validation cost control，按改动风险选择最小充分验证；check/build/full behavioral matrix 应在 meaningful milestone 或受影响 boundary 确实需要时执行，不因单纯 reorganize 反复扩大验证。
- 禁止为规避阈值制造 generic abstraction debt；没有稳定重复责任、清晰契约和实际复用需求时，不做 one-function-per-file、speculative interface、unused generic hook 等 premature abstraction。

Future priority order：

1. product capability / MVP progress
2. correctness and trust
3. security/privacy
4. user-visible quality and usability
5. maintainability required by active work
6. opportunistic structural cleanup
7. standalone cosmetic architecture cleanup

Standalone large-file cleanup 位于优先级底部，除非重新获得明确授权。该政策不创建 mandatory architecture report 或 mandatory LOC report，不新增 CI gate、lint package、test framework、automatic file-size failure、repository-wide recurring audit 或每次 module extraction 的额外 ADR；不得创建 file-size checker、custom ESLint rule、pre-commit hook、CI workflow、architecture scanner 或 dependency graph scanner。未来只有在出现实际 recurring violations 后，才可另行评估自动化。

---

# 52. 首轮开发序列

```text
WEB-ARCH-001
Repository + Astro + React architecture

WEB-ARCH-002
EngineClient + MockEngineClient + WEB_UI_FIXTURE_V1

WEB-UX-001
Birth Input + timezone resolution UI contract

WEB-CHART-001
SVG Chart Renderer

WEB-CHART-002
Chart Workspace + Calculation Details

WEB-DATA-001
Auth + Vault schema

WEB-API-001
Website BFF contract

WEB-CONTENT-001
SEO + Learn architecture
```

授权邮件到达前优先推进到这里。

---

# 53. Architecture Acceptance Criteria

网站架构只有满足以下条件才算冻结成功：

- Web repo 与 Engine repo 物理隔离
- 前端无法直接访问 astronomy provider
- 所有星盘事实来自 EngineClient
- MockEngineClient 可独立支撑 UI 开发
- renderer 不包含 astronomy math
- BFF 不重新计算 chart facts
- historical timezone resolution 有明确 contract
- Calculation Details 支持 scientific/provenance identity
- incomplete research configuration 不生成 fake IDs
- provider replacement 不要求修改 UI/domain logic
- production launch gate 明确阻止 research provider 上线

---

# 54. 最终定位

NatalNode.com 应成为：

> **NatalNode Engine 的第一方专业 Web 产品：快速、现代、透明、确定性、可验证。**

长期护城河：

```text
NatalNode Engine
+
provider-neutral architecture
+
scientific determinism
+
provenance
+
excellent chart UX
+
structured interpretation
+
Developer API ecosystem
```

---

# 55. 冻结结论

```text
Numerical Astronomy Provider Track
= PAUSED / WAITING FOR RIGHTS DECISION

NatalNode.com Web Product Track
= AUTHORIZED TO PROCEED

Website Development Mode
= MOCK_ENGINE / PROVIDER_NEUTRAL

Production Astrology Launch
= BLOCKED UNTIL ENGINE PRODUCTION GATES PASS
```

后续网站开发不得因为任何未确认的 numerical provider 提前下注。
