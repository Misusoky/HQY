# 项目约定

## 代码结构

- 交付物是单文件 `index.html`：CSS/JS 内联，无构建步骤、无外部依赖（字体、图片与音频放 `assets/`）。不要拆分为外部 CSS/JS。
- PWA 离线缓存：`sw.js` 预缓存 `index.html`、子集字体与常驻图；导航请求走网络优先（push 后能拿到新版），字体与图片走缓存优先。页面在 `load` 后注册并 `postMessage({type:'precache'})`。**改了 `assets/` 里的字体或图片，必须把 `sw.js` 的 `VERSION` 加一**，否则老客户端会一直吃旧缓存。
- 字体是子集：前端只引 `assets/fonts/zhuque-fangsong-subset.woff2`（GB2312 一级汉字＋本作文案用字，约 1.46MB）。完整字库 `zhuque-fangsong.woff2`（4.47MB）只作底本，不要在前端引用；新增界面文案若有个别字回落系统字体，跑 `python3 tools/subset-font.py` 重新生成（需 fonttools＋brotli）。
- 内联文案（世界书、叙事文风、提示词、默认档）的源头是 `宫斗模拟器原料/`；改源文件后同步 `index.html` 中的常量。
- 样式与脚本按 `index.html` 顶部的目录注释分区，新增代码放进对应分区，不要到处散落。
- 面板分工：`状态`只放主控自身（属性、言行档位、月俸、才艺、住处陈设、孕事与皇嗣）；帝的侍寝记档与近旬承宠录放 `局面`（点顶栏时间，`chamberLedgerHtml`），与剧情账、待续事项同页，别在状态页重复列。剧情账与待续事项只在 `局面` 里列一次，按紧急度排序，将到期／已逾期／搁置发酵标在行内（`plotRow(p,adj)`），别再另立「剧情到期」一节，也别在两处重复列账。帝前只在人物详情里看，局面不列排名。
- 对主控出手的行动由前端「暗流账」（`state.schemes`）排期与结账：布子、发难、胜负、扣减都在前端定；模型只负责演，不得自行决定是否触发、是否得手。
- 玩家的选择不掷骰：选项不带 `check`，成败与后果由模型按玩家选择、当下局势与 NPC 性情推断，并写进 `changes`／`statePatch`；暗流收尾由模型给 `schemeOutcome`（win/draw/lose/defuse），前端只落账、不代改数值。失败仍须留下可结算的实际损失。
- 旧版设计稿、Kimi Project 文档只作参考，不参与网页运行。
- 剧情账（`state.plots`）的每一行都可点开 `剧情详情` 页（`UI.plotRow` / `UI.sheetPlotDetail`）：字段 `goal` 是任务说明、`note` 是当前进展，新条目须写 `goal`，经 `sanitizePlot` / `mergePlots` 落账；详情页还显示期限倒计时、起于/限期与相关大事记，进行中的条目可用 `UI.dropPlot` 由玩家作废（模型硬编的线索不必留着）。
- 剧情账的旬号只由前端算：`dueRangeFromText` 把 `dueText`（「九月内」「冬月上旬」「三旬内」）换算成 `earliest`/`latest`，新建条目的「起于」固定为建档旬，`repairPlotTimes` 每旬纠偏；模型写进 `statePatch.plots` 的 `earliest`/`latest` 数字一律不认，`compactState` 也不把它们送去模型（否则模型会照抄出错位的数字，出现「起于九月下旬、限期冬月上旬」这种自相矛盾）。
- 主线写死为「三途·命途」（`MAIN_LINES` / `state.mainLine`）：开局入梦五问定线（`DREAM_QUESTIONS`），三条路各五阶，门槛与关目由前端判定（`mlStageCheck`、`mainLineAfterSettle`），模型只演并用 `statePatch.mainBeat` 报关目；剧情账 `p-destiny` 条目前端维护，模型回写不认；到期由 `mainLineXunCheck` 造一场「命途考」发难（复用暗流账），胜负经 `mainLineOnScheme` 结账。改道只有一次（`mainLineSwitch`）。
- 性情要落到言行：`PERSONA_ACT`（20 个词条各写「怎么说话／惯用手段／雷区」）与 `PERSONA_ACT_MODULE`；`buildSceneSystem` 的 `npc.act`、`sceneRound` 的 `npcActCue`、`buildStaticSystem` 里的 `personaActTable()` 三处注入。旧档缺 tags 时 `npcTraitsOf` 从 `hidden.真实性情` 反推。
- 旁人要主动影响主控：`npcMoveBrief()` 每旬点名 1—2 人，给出其目标与性情化的行动，并要求这一动作落到主控身上、以 `statePatch.plots` 立条（line=支线/敌对，3—6 旬期限），由既有到期/发酵机制催办。
- 亲疏档位：`relTier`（结怨/有隙/初识/相熟/亲厚/知己）由关系值定，并由「会面账」封顶——`state.npcMeets`（`ensureNpcMeets` 在 `normalizeState` 里按旧档好感折回次数，`Game.openScene` 每次开场面 +1）：见过 1 次最多初识、3 次最多相熟、5 次最多亲厚，模型随手给的高好感不能让生人变熟客。`relCue` 写进每轮对话与场景信息，`relOpeningNote` 写进拜访/偶遇的开场请求。初识档（`REL_TIERS.new`）的禁项是「任何请托」——缠线、捎话、递物、代笔、跑腿、借银借物、作保、说情、托办、评理，哪怕举手之劳；她的难处只露在动作神色里，搭不搭手由玩家自己提。改档位文案时，`REL_TIERS`、`relCue`、`relOpeningNote`、`PERSONA_ACT_MODULE` 第 8 条、世界书「交往有亲疏」五处要一起改。帝用另一套：`empTier`（宠爱＋知心两档，含冷淡档）。
- 帝与六宫各有一笔账：`npcs.<称谓>.favor`（帝宠）、`emperorStory`（与帝的旧事）、`arc`（她眼下的事）；`emperorAttitudeOf` 由宠爱＋帝的性情＋旧事＋子嗣推出。回写走 `statePatch.emperorFavor` / `emperorStory` / `npcArc`。人物详情「帝前」可查（局面页不再列帝前排序，谁得宠从人物谱点进去看）。顶栏「人物」页签已改名「宫谱」（`renderSheet` 保留 `人物` 别名兜底）。
- 主线不是配额：进行中的主线清零后可以一直空着，裁决块只以【发布·新主线（可选）】提示，没有自然线头就不发；标题必须与 `goal` 说同一件事，`dueText` 没有真实期限就不写。别把这条改回「必须开立新主线」，那会逼模型硬编名字与期限。
- 剧情对话的说话人由前端兜底（`isServantWho`、`sceneHandoffTarget`、`applySceneHandoff`）：引见/通传的太监、宫女占着 `scene.who` 时，一旦正主已到场（御案、御笔、御前等实景词，或当面称「陛下，」）或台词里出现「朕/寡人」，前端当场把对话人交回正主，未标 who 的台词归正主、其余动作仍归原说话人，并锁住标题不被旁人收尾动作抢回去。提示词里也得同步要求「宫人不得代主人发话」，两处缺一不可；但提示词里那条「交人」指令只在出现御前实景或「陛下／朕／皇上」时才写——宫女、女官口中的「主子／娘娘」是在称呼主控，不算正主到场，否则问话场会被误判成引见场，逼着宫女草草交人。
- 剧情对话的内容节奏由前端「本场账」兜住：模型每轮输出 `scene.ledger`（本场已确认、已有结论的事），`Game.mergeLedger` 去重累积、`Game.sceneContextBlock` 下一轮回灌，`sceneRound` 再按 `sceneCtx.round` 注入【节奏】段（第三轮落定、第五轮后不再另起问句），压住同一件事反复盘问。改对话提示词时这几段要一起保留；一场对话只在一日一处发生，不跨日。
- 对话渲染不能吞台词：`Game.sceneParts` 认 `text/content/line/dialogue…` 多种键名，并在「parts 里没有 say/quote」时用 `scene.line` 补一段 say；`requestScene` / `_giftResolve` 在 parts 无台词时把 `narrative` 按引号拆成台词补渲染。提示词里「每轮至少一段 say」与这两处兜底要一起留着，少一处就会出现「张了口却没话」的空气泡。刻意没有「空回合再补问一次」的重试：那会让一轮对话多发一次请求，得不偿失。
- 主控写的是现场言行，不是转述：选项一律写成「（动作/神情）当场说出口的原话」，`Game.playerSegs` 把括号与【】渲染成动作段；`sceneRound` 会把「括号=动作、括号外=台词、没标括号的老式叙述不算说出口」交代给模型，并禁止选项写「回殿后连夜…」这类之后才做的事。提示词里【选项写法】【玩家】两条与这段解析说明要一起留着，否则主角的叙述（连同她之后要做的事）会被当成台词说给对方听。
- 剧情只能指向真实入口：`PLAY_UI_MODULE` 把玩家点得到的界面写成清单（吩咐／手作／才艺修习／传膳／出门·宫城图七处／顶栏），并要求正文与 pending 不得出现「账房」「内务府值房」这类点不到的地方，改写成差人去办或并入既有去处。吩咐面板另有 `#focusText` + `Game.customFocus` 承接查账、领料、家书、抄经这类没有专门入口的事——别把它删了，删了模型给的指示就又落不了地。自拟行动按玩家指令走两种结算：纯办事 / 派人去办走普通结果弹窗（`hasEvent=false`），要当面交涉、问话、请托、赏罚的走 `scene` 对话细演（`hasEvent=true`，收场再结算）；精力由前端照扣，两种都必须落账（`log` + 至少一项实质结果）。指名到的人物与地点用 `customActionWho` / `customActionCtx` 接上引线与待续的呼应。
- 来客与相邀：`_xunStartPop` 处理旬首来客（帝按 `emperorVisitChance`，恩宠越高越常来；妃嫔走 `pickConsortVisitor`），`Game.maybeIncomingVisit` 在精力降到本旬阈值（`VISIT_MID_THRESHOLDS`，`meta.midVisitThreshold`）时补一场旬中来客；`meta.visitThisTurn` 是旬号，保证一旬至多一回。不熟的人不能凭空登门：`consortVisitReason` 只放行相熟以上，或剧情账／待续里同在一件事（共同 stake）、目标卡里与主控同怨一人（敌人的敌人）的人。相邀在宫务·行事（`UI.inviteHtml` → `Game.inviteNpc`），成算 `inviteChance` 由好感（帝看恩宠）× `INVITE_RATE` 直接算，先掷骰：应了才调模型进 `scene`，不应则用 `inviteRefusalText` 弹写好的回绝；能耗 `INVITE_ENERGY` 成与不成照扣，一旬一帖（`state.inviteTurn`）。中宫与太后不列来访／相邀名单。
- 新得物品当场提示：`addToInventory` 入账即用 350ms 防抖调 `flushAcquired`，`finalize` 也调一次兜底。不要改回「攒到下一次模型结算时统一弹」——那会让上一旬画的画拖到下一旬某场剧情时才蹦出来。
- 才艺修习的本地结算在 `focusEnergyCost` / `skillGainAt` / `skillGainAtBook`：每修一次耗 15 精力。修习面板先选技艺，再选练法（`Game.practiceSkill` / `localPractice`）：独自苦练未满 100 得 1—2 点；临帖读谱须手头有同艺谱册（`libHeldBook`），得 3—4 点；请教陪练须 `practiceTeacherFor` 找到相熟（好感≥30）、此艺高于主控且听说过的对象，按交情掷是否应允，应了得 3—4 点并用 `addPending` 记一份人情，婉拒则只按独练结算。过 100 后一律按递减规则，谱册与陪练只上调得点概率，不直接给 3—4。
- 节宴献艺是本地即时结算（`UI.festPerfHtml` → `UI.sheetFestPerf` → `Game.festPerform`）：只在有固定节宴、非初入宫缓冲、且本旬未献过（`state.lastFestPerfSerial`）时出现；耗 15 精力，按才艺值＋临场浮动＋大宴加成－精力不足惩罚分四档，影响威望／宠爱／银两／积分，失手记一条待续议论；不调模型。
- 才艺功课：每门技艺在 `state.skillWorks` 记一件进行中的作品（`advanceSkillWork`），同一门修习三次成件；临帖读谱加 2、陪练应允加 3 的「用心」参与品质判定。成件时按技艺封顶生成 粗陋—绝品、1-2 个特质与描述：书、画、女红、琴、莳花、香道的成品写入行囊（`src:'功课'`、`crafted:true`、`usable:false`、`pawnable:true`），可赠、可献、可在行囊详情 `Game.toggleDisplay` 陈设；**歌、舞、棋、医术**的成品不入行囊，写入 `state.repertoire`（`PIECE_SKILLS`／`PIECE_LABELS`），在 `UI.pieceListHtml` 里按曲目／舞段／棋谱／医案列出，可 `Game.practicePiece` 温习（只精熟这一件，不再起新功课，涨熟练与少量才艺），也可在对话中「互动」菜单施用：献艺走 `Game.scenePerform`、对弈走 `Game.sceneChess`、问诊走 `Game.sceneConsult`，统一经 `requestScene(..., perf)` → `_perfResolve` 结算（`perf.kind` 为 perform／chess／consult；精力前端照扣；对弈胜负由 `chessRoll` 按 `npcSkillValue`、`chessPieceBonus` 与临场乘区本地掷定，模型只演过程与反应，不得改写胜负）；歌、舞另可在节宴走 `Game.festPerform(k,pieceId)` 本地结算（品质与熟练加成）。`skillWorks`、`pieceSeq`、`lastFestPerfSerial` 都是前端内部字段，`compactState` 要删；旧档里 `src:'功课'` 且 `inspiration` 为歌艺／舞艺／棋艺／医术的成品由 `migratePieceItems` 在 `normalizeState` 迁入 `repertoire`。
- 剧情对话的「互动」入口在 `UI.renderSceneOpts`：一只 `互动` 按钮展开 `#chatInter` 菜单（献艺／对弈／问诊／赠礼，`Game.toggleInter` → `Game.interAct`），四项各自 `UI.openSheet` 一个子面板；赠礼仍走 `Game.openGift`。侍寝夜话不显示该菜单。子面板：`sheetInterPerform`（歌、舞曲目与即席）、`sheetInterChess`（棋谱与空手，显示胜算估算）、`sheetInterConsult`（医案与空手搭脉）。
- 剧情对话窗底部保留一条 `#chatTabbar`（状态／行囊／宫谱／宫务），对话中也能随时翻面板；`#sheet` 的 z-index 高于 `chatview`，面板会浮在对话之上。状态页「才艺」一栏另有入口进才艺修习面板；对话中该面板只可查看与献艺，修习按钮禁用。

## 开局页

- `#screen-start` 是全屏封面：背景 `assets/cover.jpg`（《红墙引》海报，书法标题与印章已烧录在图里），底部叠暗角渐变，主菜单按钮（继续/开新档/设置）浮于下方，**绢签式**样式（`#screen-start .btn` 作用域，弹窗与其他界面的 `.btn` 不要跟着改）。
- 封面**不再叠加** HTML 标题/副标题/装饰（`title-cal/title-sub/ornament` 已移除，海报即标题视觉），也**禁止**添加任何说明性小字，包括版本号、build 号、字体、素材来源、署名等。用户已明确要求永久移除，不要恢复。

## 提交与推送

- 用户已授权：每次改完代码直接 `git commit` 并 `git push origin main`，不必再询问。
- 推送前先做一次本地验证，避免把坏掉的页面推上线。
