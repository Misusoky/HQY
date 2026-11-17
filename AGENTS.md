# 项目约定

## 代码结构

- 交付物是单文件 `index.html`：CSS/JS 内联，无构建步骤、无外部依赖（字体、图片与音频放 `assets/`）。不要拆分为外部 CSS/JS。
- 内联文案（世界书、叙事文风、提示词、默认档）的源头是 `宫斗模拟器原料/`；改源文件后同步 `index.html` 中的常量。
- 样式与脚本按 `index.html` 顶部的目录注释分区，新增代码放进对应分区，不要到处散落。
- 对主控出手的行动由前端「暗流账」（`state.schemes`）排期与结账：布子、发难、胜负、扣减都在前端定；模型只负责演，不得自行决定是否触发、是否得手。
- 玩家的选择不掷骰：选项不带 `check`，成败与后果由模型按玩家选择、当下局势与 NPC 性情推断，并写进 `changes`／`statePatch`；暗流收尾由模型给 `schemeOutcome`（win/draw/lose/defuse），前端只落账、不代改数值。失败仍须留下可结算的实际损失。
- 旧版设计稿、Kimi Project 文档只作参考，不参与网页运行。
- 剧情账（`state.plots`）的每一行都可点开 `剧情详情` 页（`UI.plotRow` / `UI.sheetPlotDetail`）：字段 `goal` 是任务说明、`note` 是当前进展，新条目须写 `goal`，经 `sanitizePlot` / `mergePlots` 落账；详情页还显示期限倒计时、起于/限期与相关大事记，进行中的条目可用 `UI.dropPlot` 由玩家作废（模型硬编的线索不必留着）。
- 剧情账的旬号只由前端算：`dueRangeFromText` 把 `dueText`（「九月内」「冬月上旬」「三旬内」）换算成 `earliest`/`latest`，新建条目的「起于」固定为建档旬，`repairPlotTimes` 每旬纠偏；模型写进 `statePatch.plots` 的 `earliest`/`latest` 数字一律不认，`compactState` 也不把它们送去模型（否则模型会照抄出错位的数字，出现「起于九月下旬、限期冬月上旬」这种自相矛盾）。
- 主线写死为「三途·命途」（`MAIN_LINES` / `state.mainLine`）：开局入梦五问定线（`DREAM_QUESTIONS`），三条路各五阶，门槛与关目由前端判定（`mlStageCheck`、`mainLineAfterSettle`），模型只演并用 `statePatch.mainBeat` 报关目；剧情账 `p-destiny` 条目前端维护，模型回写不认；到期由 `mainLineXunCheck` 造一场「命途考」发难（复用暗流账），胜负经 `mainLineOnScheme` 结账。改道只有一次（`mainLineSwitch`）。
- 性情要落到言行：`PERSONA_ACT`（20 个词条各写「怎么说话／惯用手段／雷区」）与 `PERSONA_ACT_MODULE`；`buildSceneSystem` 的 `npc.act`、`sceneRound` 的 `npcActCue`、`buildStaticSystem` 里的 `personaActTable()` 三处注入。旧档缺 tags 时 `npcTraitsOf` 从 `hidden.真实性情` 反推。
- 旁人要主动影响主控：`npcMoveBrief()` 每旬点名 1—2 人，给出其目标与性情化的行动，并要求这一动作落到主控身上、以 `statePatch.plots` 立条（line=支线/敌对，3—6 旬期限），由既有到期/发酵机制催办。
- 主线不是配额：进行中的主线清零后可以一直空着，裁决块只以【发布·新主线（可选）】提示，没有自然线头就不发；标题必须与 `goal` 说同一件事，`dueText` 没有真实期限就不写。别把这条改回「必须开立新主线」，那会逼模型硬编名字与期限。
- 剧情对话的说话人由前端兜底（`isServantWho`、`sceneHandoffTarget`、`applySceneHandoff`）：引见/通传的太监、宫女占着 `scene.who` 时，一旦正主已到场（御案、御笔、御前等实景词，或当面称「陛下，」）或台词里出现「朕/寡人」，前端当场把对话人交回正主，未标 who 的台词归正主、其余动作仍归原说话人，并锁住标题不被旁人收尾动作抢回去。提示词里也得同步要求「宫人不得代主人发话」，两处缺一不可；但提示词里那条「交人」指令只在出现御前实景或「陛下／朕／皇上」时才写——宫女、女官口中的「主子／娘娘」是在称呼主控，不算正主到场，否则问话场会被误判成引见场，逼着宫女草草交人。
- 剧情对话的内容节奏由前端「本场账」兜住：模型每轮输出 `scene.ledger`（本场已确认、已有结论的事），`Game.mergeLedger` 去重累积、`Game.sceneContextBlock` 下一轮回灌，`sceneRound` 再按 `sceneCtx.round` 注入【节奏】段（第三轮落定、第五轮后不再另起问句），压住同一件事反复盘问。改对话提示词时这几段要一起保留；一场对话只在一日一处发生，不跨日。
- 对话渲染不能吞台词：`Game.sceneParts` 认 `text/content/line/dialogue…` 多种键名，并在「parts 里没有 say/quote」时用 `scene.line` 补一段 say；`requestScene` / `_giftResolve` 在 parts 无台词时把 `narrative` 按引号拆成台词补渲染，若仍只剩动作，就带【纠正】补问一次（`sceneCtx.noSayRetried`）。提示词里「每轮至少一段 say」与这三处兜底要一起留着，少一处就会出现「张了口却没话」的空气泡。
- 主控写的是现场言行，不是转述：选项一律写成「（动作/神情）当场说出口的原话」，`Game.playerSegs` 把括号与【】渲染成动作段；`sceneRound` 会把「括号=动作、括号外=台词、没标括号的老式叙述不算说出口」交代给模型，并禁止选项写「回殿后连夜…」这类之后才做的事。提示词里【选项写法】【玩家】两条与这段解析说明要一起留着，否则主角的叙述（连同她之后要做的事）会被当成台词说给对方听。

## 开局页

- `#screen-start` 是全屏封面：背景 `assets/cover.jpg`（《红墙引》海报，书法标题与印章已烧录在图里），底部叠暗角渐变，主菜单按钮（继续/开新档/设置）浮于下方，**绢签式**样式（`#screen-start .btn` 作用域，弹窗与其他界面的 `.btn` 不要跟着改）。
- 封面**不再叠加** HTML 标题/副标题/装饰（`title-cal/title-sub/ornament` 已移除，海报即标题视觉），也**禁止**添加任何说明性小字，包括版本号、build 号、字体、素材来源、署名等。用户已明确要求永久移除，不要恢复。

## 提交与推送

- 用户已授权：每次改完代码直接 `git commit` 并 `git push origin main`，不必再询问。
- 推送前先做一次本地验证，避免把坏掉的页面推上线。
