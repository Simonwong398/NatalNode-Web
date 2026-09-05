import type {
  InterpretationContentStyle,
  InterpretationFactReference,
  InterpretationRulesVersion,
  InterpretationSignal,
  InterpretationSignalDirection,
  InterpretationSignalIntensity,
  InterpretationConfidence
} from './interpretation-signal-contracts.js';
import {
  INTERPRETATION_RULES_VERSION
} from './interpretation-signal-engine.js';
import { rankInterpretationSignals } from './interpretation-signal-ranking.js';
import {
  groupWeeklySignalsByTheme,
  selectWeeklyHeroThemeGroup,
  type WeeklyPocScenario,
  type WeeklySignalThemeGroup
} from './weekly-interpretation-poc.js';

export const WEEKLY_EDITORIAL_VERSION = Object.freeze({
  id: 'NATALNODE_WEEKLY_EDITORIAL_V1',
  version: '1.0.0'
});

export const WEEKLY_EDITORIAL_LOCALES = Object.freeze(['en', 'zh-Hant'] as const);

export type WeeklyEditorialLocale = (typeof WEEKLY_EDITORIAL_LOCALES)[number];
export type WeeklyEditorialStyle = InterpretationContentStyle;

export type WeeklyEditorialBlockRole =
  | 'hero'
  | 'core-theme'
  | 'timeline'
  | 'relationship'
  | 'work-creation'
  | 'inner-state'
  | 'action-decision'
  | 'watch-out'
  | 'best-window'
  | 'astrologer-view'
  | 'share-hook'
  | 'share-insight'
  | 'share-cta'
  | 'signature-line';

export interface WeeklyEditorialContentBlock {
  readonly contentBlockId: string;
  readonly role: WeeklyEditorialBlockRole;
  readonly theme: string;
  readonly text: string;
  readonly sourceSignalIds: readonly string[];
  readonly sourceFactRefs: readonly InterpretationFactReference[];
  readonly contentStyle: WeeklyEditorialStyle;
  readonly templateVersion: string;
  readonly rulesVersion: InterpretationRulesVersion;
  readonly fixtureAuthority: 'DEVELOPMENT_ONLY';
}

export interface WeeklyEditorialThemeProjection {
  readonly theme: string;
  readonly direction: InterpretationSignalDirection;
  readonly intensity: InterpretationSignalIntensity;
  readonly confidence: InterpretationConfidence;
  readonly sourceSignalIds: readonly string[];
  readonly sourceFactRefs: readonly InterpretationFactReference[];
  readonly content: WeeklyEditorialContentBlock;
}

export interface WeeklyEditorialTimelineEntry {
  readonly segmentKey: string;
  readonly label: string;
  readonly sourceSignalIds: readonly string[];
  readonly sourceFactRefs: readonly InterpretationFactReference[];
  readonly content: WeeklyEditorialContentBlock;
}

export interface WeeklyEditorialShareProjection {
  readonly hook: WeeklyEditorialContentBlock;
  readonly insight: WeeklyEditorialContentBlock;
  readonly cta: WeeklyEditorialContentBlock;
}

/**
 * Research/editorial proof output only. This is deliberately not a product
 * route model, persistence model, or final UI contract.
 */
export interface WeeklyInterpretationDraft {
  readonly scenarioId: string;
  readonly locale: WeeklyEditorialLocale;
  readonly style: WeeklyEditorialStyle;
  readonly authority: 'DEVELOPMENT_ONLY';
  readonly birthTimeAuthority: WeeklyPocScenario['birthTimeAuthority'];
  readonly editorialVersion: typeof WEEKLY_EDITORIAL_VERSION;
  readonly rulesVersion: InterpretationRulesVersion;
  readonly period: WeeklyPocScenario['signalSet']['period'];
  readonly signals: readonly InterpretationSignal[];
  readonly hero: WeeklyEditorialContentBlock;
  readonly coreThemes: readonly WeeklyEditorialThemeProjection[];
  readonly timeline: readonly WeeklyEditorialTimelineEntry[];
  readonly relationship: WeeklyEditorialContentBlock | null;
  readonly workCreation: WeeklyEditorialContentBlock | null;
  readonly innerState: WeeklyEditorialContentBlock | null;
  readonly actionDecision: WeeklyEditorialContentBlock | null;
  readonly watchOut: WeeklyEditorialContentBlock | null;
  readonly bestWindow: WeeklyEditorialContentBlock | null;
  readonly astrologerView: WeeklyEditorialContentBlock | null;
  readonly signatureLine: WeeklyEditorialContentBlock;
  readonly shareProjection: WeeklyEditorialShareProjection;
  readonly traceability: readonly WeeklyEditorialContentBlock[];
}

interface ThemeVoice {
  readonly hero: string;
  readonly core: string;
  readonly bestWindow: string;
  readonly watchOut: string | null;
  readonly astrologer: (technicalAnchor: string) => string;
  readonly shareHook: string;
  readonly shareInsight: string;
  readonly signature: string;
}

interface ThemeVoiceSet {
  readonly CLEAR: ThemeVoice;
  readonly CASUAL: ThemeVoice;
  readonly ASTROLOGER: ThemeVoice;
  readonly SHARE: ThemeVoice;
}

interface BaseVoice {
  readonly hero: string;
  readonly core: string;
  readonly bestWindow: string;
  readonly watchOut: string | null;
  readonly astrologer: (technicalAnchor: string) => string;
}

function createThemeVoiceSet(
  clear: BaseVoice,
  casual: BaseVoice,
  astrologer: BaseVoice,
  shareHook: string,
  shareInsight: string,
  signature: string
): ThemeVoiceSet {
  const addShareFields = (voice: BaseVoice): ThemeVoice => ({
    ...voice,
    shareHook,
    shareInsight,
    signature
  });

  return {
    CLEAR: addShareFields(clear),
    CASUAL: addShareFields(casual),
    ASTROLOGER: addShareFields(astrologer),
    SHARE: {
      hero: shareHook,
      core: shareInsight,
      bestWindow: shareInsight,
      watchOut: clear.watchOut === null ? null : shareInsight,
      astrologer: astrologer.astrologer,
      shareHook,
      shareInsight,
      signature
    }
  };
}

const ENGLISH_THEME_VOICES: Readonly<Record<string, ThemeVoiceSet>> = Object.freeze({
  'clear-communication': createThemeVoiceSet(
    {
      hero: 'A clear center of gravity helps conversations move forward: name the point, then leave room for the response.',
      core: 'The useful opening is directness with room for another person to answer.',
      bestWindow: 'The communication window is easier to use when the point is named before the explanation expands.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} anchors a communication signal; the reading concerns clarity of exchange, not a guaranteed response.`
    },
    {
      hero: 'You may notice the difference between a real conversation and a beautifully formatted dodge.',
      core: 'Say the useful thing first; the rest gets easier to sort.',
      bestWindow: 'Use the communication window to make the point before the story grows extra branches.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} gives the conversation a technical anchor; this is an observation about exchange, not a promised reply.`
    },
    {
      hero: 'The communication signal is best read as an invitation to make the point legible before expanding the explanation.',
      core: 'The technical anchor stays with exchange clarity; the semantic output does not predict another person’s response.',
      bestWindow: 'The supplied timing window supports making the central point legible before adding interpretation.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} is the approved technical anchor for this communication signal; no outcome is inferred from it.`
    },
    'Say the useful thing.',
    'Clarity gives the conversation somewhere to go.',
    'Make the point, then make room.'
  ),
  'deliberate-next-step': createThemeVoiceSet(
    {
      hero: 'Once the conversation is clear, a smaller next step can carry more weight than another round of options.',
      core: 'The week favors one defined move with a reason you can still recognize tomorrow.',
      bestWindow: 'The late-week action window favors choosing one next step and leaving the rest unclaimed.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} is the technical anchor for a supportive action signal; it describes a usable pattern, not a promised result.`
    },
    {
      hero: 'A tiny plan beats a heroic list of maybe.',
      core: 'Move one useful piece; the rest can stay in the draft folder.',
      bestWindow: 'The late-week opening is good for one concrete move, not a grand rewrite of the whole plan.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} supports a practical action reading; it is not a guarantee that the plan will work out.`
    },
    {
      hero: 'The action signal favors a defined move with enough judgment to remain reversible.',
      core: 'Its explanatory value is in choosing a next step, not in multiplying possible outcomes.',
      bestWindow: 'The supplied timing evidence marks a late-week action window for a bounded decision.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} is the approved technical basis for this action signal; no deterministic outcome is asserted.`
    },
    'Choose the next step.',
    'Momentum does not need a grand entrance.',
    'A clear choice can stay small.'
  ),
  'relationship-pace': createThemeVoiceSet(
    {
      hero: 'Closeness has room to grow, but different pacing or expectations may be harder to ignore.',
      core: 'The useful move is to hold warmth and friction in the same frame instead of forcing a verdict.',
      bestWindow: 'The relationship window is useful for naming expectations before they become assumptions.',
      watchOut: 'Pause before treating a difference in pace as proof of a difference in care.',
      astrologer: (anchor) => `The supplied ${anchor} forms a mixed relationship signal: connection and constraint are both active in the same reading.`
    },
    {
      hero: 'Warmth is there—but so is the moment when “we’re fine” stops being a useful strategy.',
      core: 'Notice who is making room for a conversation, not just winning the edit.',
      bestWindow: 'The relationship opening is a good place to name the expectation before it turns into a silent test.',
      watchOut: 'Do not turn one awkward pause into a full relationship verdict.',
      astrologer: (anchor) => `The supplied ${anchor} keeps support and friction in the same frame; it is not a forecast about who stays or leaves.`
    },
    {
      hero: 'This mixed relationship signal keeps connection and constraint in view together.',
      core: 'Read the tension as a question of pacing and expectation, not as a fixed verdict.',
      bestWindow: 'The supplied timing evidence supports an explicit conversation about expectation and pace.',
      watchOut: 'The mixed evidence supports checking pace and expectation before assigning a permanent meaning.',
      astrologer: (anchor) => `The supplied ${anchor} is the approved technical evidence for the mixed relationship composition; neither side is promoted to a certain outcome.`
    },
    'Closeness needs room.',
    'Warmth can coexist with a boundary that still needs naming.',
    'Closeness needs room for honesty.'
  ),
  'forward-action': createThemeVoiceSet(
    {
      hero: 'Action has support, especially when it is chosen before emotion takes the steering wheel.',
      core: 'The week favors a defined move with a reason you can still recognize tomorrow.',
      bestWindow: 'The early-to-midweek action window favors a defined move before the emotional signal gets louder.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} anchors a supportive action signal; it is a technical pattern for interpretation, not a forecast.`
    },
    {
      hero: 'The green light is real; so is the urge to floor it.',
      core: 'Move, but leave your future self a little braking distance.',
      bestWindow: 'Use the early opening for the move you already meant to make, not for an adrenaline-powered plot twist.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} gives the action signal its technical basis; it does not promise that speed is always wise.`
    },
    {
      hero: 'The supportive action signal favors a defined move with enough judgment to remain reversible.',
      core: 'The interpretation stays with agency and pacing rather than turning a supplied pattern into a prediction.',
      bestWindow: 'The supplied timing evidence supports acting before the contrasting emotional signal becomes dominant.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} is the approved technical anchor for the action reading; no event or result is inferred.`
    },
    'Move with a reason.',
    'Momentum works better when it leaves room for judgment.',
    'Momentum is more useful when it remains yours.'
  ),
  'reactive-emotion': createThemeVoiceSet(
    {
      hero: 'Emotional reactivity can rise faster than the situation warrants; pacing protects the decision.',
      core: 'Leave a little space between feeling the pressure and naming the answer.',
      bestWindow: 'The later emotional window is worth meeting with a pause before turning pressure into a conclusion.',
      watchOut: 'Pause before treating temporary frustration as a final answer.',
      astrologer: (anchor) => `The supplied ${anchor} anchors the emotional signal; no house or angle interpretation is added.`
    },
    {
      hero: 'Your feelings may hit send before the rest of you has read the message.',
      core: 'Give the big reaction a chair, not the whole meeting.',
      bestWindow: 'When the emotional volume rises later in the week, give the reaction a minute before it gets a job title.',
      watchOut: 'Do not let a five-minute feeling write a five-year policy.',
      astrologer: (anchor) => `The supplied ${anchor} supports an emotional pacing signal; it does not prove that the situation is wrong.`
    },
    {
      hero: 'The challenging emotional signal is best read as a pacing requirement, not as a permanent identity claim.',
      core: 'Its explanatory value is the gap between pressure and response.',
      bestWindow: 'The supplied timing evidence marks a later emotional window where pacing is especially useful.',
      watchOut: 'The challenging evidence supports pacing and review; it does not establish a fixed personal pattern.',
      astrologer: (anchor) => `The supplied ${anchor} is the approved technical source for the emotional signal; no house, angle, or deterministic conclusion is inferred.`
    },
    'Pause before the answer.',
    'A strong feeling deserves attention, not automatic control.',
    'Pacing keeps the decision yours.'
  ),
  'steady-progress': createThemeVoiceSet(
    {
      hero: 'The larger theme is steady progress: fewer pivots, more follow-through.',
      core: 'Work and creative effort benefit from a pace you can repeat, not a sprint you have to explain.',
      bestWindow: 'The week-long background supports returning to the work that benefits from patient follow-through.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} anchors a background work/creation signal; it is not a transit forecast or a statement of permanent identity.`
    },
    {
      hero: 'The week rewards boringly effective things like finishing what you already started.',
      core: 'Your most glamorous move may be closing the open tabs.',
      bestWindow: 'The long window favors the work that gets better because you stayed with it.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} supports a background theme of follow-through; it does not predict a promotion, breakthrough, or other event.`
    },
    {
      hero: 'The background signal favors repeatable effort over dramatic acceleration.',
      core: 'The technical reading stays with sustained work/creation attention and does not redefine the person.',
      bestWindow: 'The supplied broad timing window supports a repeatable practice rather than a single lucky day.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} is the approved technical source for the background work/creation theme; no transit claim is added.`
    },
    'Keep the thread.',
    'Steady progress compounds quietly.',
    'Consistency is a form of clarity.'
  ),
  'decision-window': createThemeVoiceSet(
    {
      hero: 'A shorter window favors a decision after the larger pattern has had time to settle.',
      core: 'Use the opening for one concrete choice, not a wholesale rewrite.',
      bestWindow: 'The short, explicit window is best used for one concrete choice supported by the larger pattern.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} marks a short decision window; it does not establish a guaranteed event.`
    },
    {
      hero: 'A brief “do it now” window can help—as long as the plan existed before the adrenaline.',
      core: 'Make the move; skip the dramatic trailer.',
      bestWindow: 'The short opening can help a settled plan leave the group chat and become one actual step.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} marks timing for a bounded decision; it is not a promise that the decision will pay off.`
    },
    {
      hero: 'The momentary signal is a timing aid, not a new personality trait or a guaranteed event.',
      core: 'Its value is the contrast between a broad background and a short, explicitly supplied window.',
      bestWindow: 'The supplied timing fact supports using the short window for a decision that was already considered.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} is the approved technical evidence for a short decision window; no event certainty is inferred.`
    },
    'Use the opening.',
    'A short window can serve a settled plan.',
    'Let the pattern settle, then choose.'
  ),
  'self-observation': createThemeVoiceSet(
    {
      hero: 'A useful review can stay grounded in what is available: notice the pattern before reaching for a bigger story.',
      core: 'The stable placement-level signal is enough to begin observing what you actually do with the theme.',
      bestWindow: 'No time window is asserted; the useful opening is the act of observation itself.',
      watchOut: null,
      astrologer: (anchor) => `The approved ${anchor} supports a placement-level read; without birth time, this POC omits houses and angles.`
    },
    {
      hero: 'You do not need a full cosmic spreadsheet to notice what keeps asking for your attention.',
      core: 'Start with what is on the table; no decoder ring required.',
      bestWindow: 'There is no invented lucky day here—the useful move is simply to notice the pattern as it appears.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} supports a bounded placement-level observation; it does not license a house or angle claim.`
    },
    {
      hero: 'The placement-level signal remains useful when time-dependent chart authority is unavailable.',
      core: 'The technical boundary is part of the reading: available body facts are used, while houses and angles stay omitted.',
      bestWindow: 'No timing window is supplied, so the technical reading does not manufacture one.',
      watchOut: null,
      astrologer: (anchor) => `The approved ${anchor} is sufficient for the placement-level signal; unknown birth time blocks house and angle interpretation.`
    },
    'Start with what is known.',
    'A clear boundary around the facts makes reflection more useful.',
    'Good reading begins with honest limits.'
  ),
  'simple-language': createThemeVoiceSet(
    {
      hero: 'Simple language makes the useful part easier to carry into the week.',
      core: 'The point does not need extra mystique to become worth noticing.',
      bestWindow: 'No timing window is asserted; clarity is the available through-line.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} supports the communication theme only; no time-dependent house or angle claim is added.`
    },
    {
      hero: 'If the point needs a decoder ring, it may not be the point yet.',
      core: 'Keep the insight; lose the fog.',
      bestWindow: 'There is no fake lucky day—just a useful reason to say the thing plainly.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} supports a communication observation; the technical boundary stays visible instead of becoming jargon.`
    },
    {
      hero: 'The communication signal is strongest when the interpretation keeps its own language clear.',
      core: 'The technical substance is the supplied body fact, not an invitation to add unsupported chart machinery.',
      bestWindow: 'No timing evidence is supplied, so the technical view stays with clear expression rather than day-level claims.',
      watchOut: null,
      astrologer: (anchor) => `The supplied ${anchor} supports the communication signal; no unsupported timing, house, or angle fact is introduced.`
    },
    'Make the useful part clear.',
    'The right words make a pattern easier to work with.',
    'Clarity is a form of care.'
  )
});

const ZH_HANT_THEME_VOICES: Readonly<Record<string, ThemeVoiceSet>> = Object.freeze({
  'clear-communication': createThemeVoiceSet(
    {
      hero: '清楚的重點，能讓對話更容易往前走：先說明要處理的事，也為對方留下回應的空間。',
      core: '有用的起點是直接，但不替另一個人預先寫好答案。',
      bestWindow: '先說明重點，再展開解釋，會更容易善用這段溝通窗口。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}是溝通訊號的技術錨點；這段詮釋談的是交流的清晰度，不是保證對方會如何回應。`
    },
    {
      hero: '你可能很快就會分辨出，眼前是真正的對話，還是一個排版得很漂亮的閃躲。',
      core: '先說真正有用的那句；其餘的就比較容易整理。',
      bestWindow: '趁溝通窗口先說明重點，別讓故事分出太多枝節。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}為這段對話提供技術錨點；這是對交流的觀察，不是承諾中的回覆。`
    },
    {
      hero: '這項溝通訊號適合被理解為：先讓重點清楚，再擴大說明。',
      core: '技術依據維持在交流清晰度；語意輸出不預測另一個人的回應。',
      bestWindow: '提供的時間窗口支持先說清楚核心，再加入詮釋。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}是這項溝通訊號核准的技術依據；沒有從中推導任何結果。`
    },
    '把真正有用的話說出來。',
    '清晰，會讓對話找到前進的方向。',
    '先說重點，也為回應留空間。'
  ),
  'deliberate-next-step': createThemeVoiceSet(
    {
      hero: '對話變清楚之後，一個較小的下一步，可能比再增加一輪選項更有力量。',
      core: '本週適合選定一個明確行動，而且明天仍能認出它的理由。',
      bestWindow: '週末前後的行動窗口，適合選定一個下一步，暫時不替其餘選項下結論。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}是支持性行動訊號的技術依據；它描述的是可運用的模式，不是承諾中的結果。`
    },
    {
      hero: '一個小計畫，通常比一張壯闊的「也許」清單更有效。',
      core: '先推動一個有用的部分；其餘可以留在草稿裡。',
      bestWindow: '週末前後的窗口適合一個具體行動，不必重寫整份計畫。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}支持實際行動的閱讀；它不是保證計畫一定會成功。`
    },
    {
      hero: '這項行動訊號支持一個明確、而且保留判斷空間的下一步。',
      core: '它的解釋價值在於選擇下一步，而不是增加可能結果。',
      bestWindow: '提供的時間證據標示出週末前後一段有界的行動窗口。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}是這項行動訊號核准的技術依據；沒有主張任何確定結果。`
    },
    '選定下一步。',
    '行動不需要盛大的登場。',
    '清楚的選擇可以保持小而實際。'
  ),
  'relationship-pace': createThemeVoiceSet(
    {
      hero: '親近仍有發展空間，但不同的步調或期待，可能更難被忽略。',
      core: '有用的做法，是把溫度與摩擦放在同一個畫面裡，而不是急著下結論。',
      bestWindow: '這段關係窗口適合在期待變成假設之前，把它說清楚。',
      watchOut: '先停一下，不要把步調不同當成在乎程度不同的證明。',
      astrologer: (anchor) => `提供的${anchor}形成混合的關係訊號：連結與限制同時存在於這次閱讀中。`
    },
    {
      hero: '溫度是存在的——但「我們沒事」也可能在某個時刻不再是有用的策略。',
      core: '留意誰正在為對話留出空間，而不只是贏得話語權。',
      bestWindow: '關係窗口適合先說出期待，別讓它變成無聲的測驗。',
      watchOut: '不要把一次尷尬的停頓，變成整段關係的判決。',
      astrologer: (anchor) => `提供的${anchor}讓支持與摩擦同時留在畫面中；它不是誰會留下或離開的預測。`
    },
    {
      hero: '這項混合的關係訊號，把連結與限制一起保留在視野裡。',
      core: '把張力理解為步調與期待的問題，而不是固定不變的判決。',
      bestWindow: '提供的時間證據支持一場直接談論期待與步調的對話。',
      watchOut: '混合證據支持先檢查步調與期待，再賦予它永久意義。',
      astrologer: (anchor) => `提供的${anchor}是混合關係組合核准的技術證據；沒有任何一方被提升為確定結果。`
    },
    '親近需要空間。',
    '溫度可以與仍需說清楚的界線同時存在。',
    '親近需要誠實的空間。'
  ),
  'forward-action': createThemeVoiceSet(
    {
      hero: '行動得到支持，尤其是在情緒接手方向盤之前做出選擇。',
      core: '本週適合一個明確行動，而且明天仍能認出它的理由。',
      bestWindow: '週初至週中的行動窗口，適合在情緒訊號變大聲前做出明確行動。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}支撐支持性行動訊號；它是可供詮釋的技術模式，不是預測。`
    },
    {
      hero: '綠燈確實亮著——想直接踩到底的衝動也確實存在。',
      core: '可以前進，但替未來的自己保留一點煞車距離。',
      bestWindow: '週初的窗口適合推動原本就想做的事，不適合用腎上腺素製造新劇情。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}給予行動訊號技術依據；它不保證速度永遠是好選擇。`
    },
    {
      hero: '支持性的行動訊號，適合被理解為一個明確、而且保留判斷空間的行動。',
      core: '詮釋維持在自主與步調，不把提供的模式變成預測。',
      bestWindow: '提供的時間證據支持在相反的情緒訊號變強前採取行動。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}是行動閱讀核准的技術錨點；沒有從中推導事件或結果。`
    },
    '帶著理由前進。',
    '保留判斷空間，動能才更有用。',
    '動能更有用，因為它仍然屬於你。'
  ),
  'reactive-emotion': createThemeVoiceSet(
    {
      hero: '情緒反應可能比情境本身更快升高；放慢一點，能保護這個決定。',
      core: '在感到壓力與說出答案之間，留下一點空間。',
      bestWindow: '後段的情緒窗口值得用一個停頓來面對，再把壓力變成結論。',
      watchOut: '先停一下，不要把短暫的挫折當成最後答案。',
      astrologer: (anchor) => `提供的${anchor}是情緒訊號的技術錨點；沒有加入宮位或角度詮釋。`
    },
    {
      hero: '你的情緒可能先按下送出，其他部分還沒讀完訊息。',
      core: '讓強烈反應有一張椅子，但不要讓它主持整場會議。',
      bestWindow: '本週後段情緒音量升高時，先讓反應停一下，不要急著替它命名。',
      watchOut: '不要讓五分鐘的感受，替五年的政策寫完全文。',
      astrologer: (anchor) => `提供的${anchor}支持情緒步調訊號；它不能證明眼前情況一定不對。`
    },
    {
      hero: '這項具挑戰性的情緒訊號，適合被理解為步調要求，而不是永久的身分描述。',
      core: '它的解釋價值，在於壓力與回應之間的空隙。',
      bestWindow: '提供的時間證據標示出後段一個特別適合放慢的情緒窗口。',
      watchOut: '挑戰性證據支持放慢並重新檢視；它不建立固定的個人模式。',
      astrologer: (anchor) => `提供的${anchor}是情緒訊號核准的技術來源；沒有推導宮位、角度或確定結論。`
    },
    '先停一下，再回答。',
    '強烈感受值得被注意，但不必自動掌舵。',
    '放慢，決定才仍然屬於你。'
  ),
  'steady-progress': createThemeVoiceSet(
    {
      hero: '較大的主題是穩定前進：少一點轉向，多一點持續完成。',
      core: '工作與創作適合採用能重複的步調，而不是需要反覆解釋的衝刺。',
      bestWindow: '整週的背景訊號支持回到需要耐心持續的工作。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}支撐背景性的工作／創作訊號；它不是行星運行預測，也不是永久身分描述。`
    },
    {
      hero: '本週獎勵的是那些無聊但有效的事，例如把已經開始的工作做完。',
      core: '你最有魅力的行動，可能只是把分頁關掉。',
      bestWindow: '較長的窗口支持那些因為你願意持續而逐漸變好的工作。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}支持持續完成的背景主題；它不預測升遷、突破或其他事件。`
    },
    {
      hero: '背景訊號支持可重複的投入，而不是戲劇性的加速。',
      core: '技術閱讀維持在持續的工作／創作注意力，不重新定義這個人。',
      bestWindow: '提供的寬廣時間窗口支持可重複的練習，而不是某個幸運日。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}是背景性工作／創作主題核准的技術來源；沒有加入行星運行主張。`
    },
    '持續這條線。',
    '穩定前進會安靜地累積。',
    '一致，也是一種清晰。'
  ),
  'decision-window': createThemeVoiceSet(
    {
      hero: '較短的窗口，適合在較大的模式沉澱後做出決定。',
      core: '利用這個開口做一個具體選擇，不必整份重寫。',
      bestWindow: '這段明確而短的窗口，適合用來做一個由較大模式支持的具體選擇。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}標示出短暫的決策窗口；它不建立任何保證中的事件。`
    },
    {
      hero: '短暫的「現在就做」窗口可能很有用——前提是計畫早在腎上腺素之前就存在。',
      core: '做出行動；跳過戲劇性的預告片。',
      bestWindow: '短暫的開口，可以讓已經想過的計畫離開群組聊天，成為一個實際步驟。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}標示有界的決策時機；它不是保證這個決定會帶來回報。`
    },
    {
      hero: '這項短暫訊號是時間輔助，不是新的性格特質，也不是保證中的事件。',
      core: '它的價值在於對照寬廣背景與一段明確提供的短窗口。',
      bestWindow: '提供的時間事實支持在短窗口中使用一個已經思考過的決定。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}是短暫決策窗口核准的技術證據；沒有推導事件確定性。`
    },
    '善用這個開口。',
    '短暫的窗口，可以服務已經沉澱的計畫。',
    '讓模式沉澱，再做選擇。'
  ),
  'self-observation': createThemeVoiceSet(
    {
      hero: '有用的回顧，可以從現有資料出發：先注意模式，再急著尋找更大的故事。',
      core: '穩定的配置層級訊號，已足以開始觀察你實際如何與這個主題互動。',
      bestWindow: '這裡沒有主張時間窗口；有用的開口就是觀察本身。',
      watchOut: null,
      astrologer: (anchor) => `核准的${anchor}支持配置層級的閱讀；因為出生時間未知，本次 POC 不加入宮位與角度。`
    },
    {
      hero: '你不需要一份完整的宇宙試算表，才能注意到某個主題一直在請你回頭看。',
      core: '先從桌面上已有的資料開始；不需要解碼戒指。',
      bestWindow: '這裡沒有虛構的幸運日——有用的行動只是注意模式如何出現。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}支持有界的配置觀察；它不允許加入宮位或角度主張。`
    },
    {
      hero: '即使時間相關的星盤權威不可用，配置層級訊號仍然有用。',
      core: '技術邊界也是閱讀的一部分：使用現有的星體事實，同時省略宮位與角度。',
      bestWindow: '沒有提供時間窗口，因此技術閱讀不會製造一個窗口。',
      watchOut: null,
      astrologer: (anchor) => `核准的${anchor}足以支持配置層級訊號；出生時間未知會阻止宮位與角度詮釋。`
    },
    '從已知開始。',
    '為事實劃清界線，能讓反思更有用。',
    '誠實的限制，是良好閱讀的起點。'
  ),
  'simple-language': createThemeVoiceSet(
    {
      hero: '簡單的語言，讓有用的部分更容易帶進這一週。',
      core: '重點不需要額外的神秘感，才值得被注意。',
      bestWindow: '這裡沒有主張時間窗口；清晰本身就是可用的主線。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}只支持溝通主題；沒有加入時間相關的宮位或角度主張。`
    },
    {
      hero: '如果重點需要解碼戒指，它可能還不是重點。',
      core: '留下洞見，拿掉霧氣。',
      bestWindow: '這裡沒有虛構的幸運日——只是有一個把話說清楚的好理由。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}支持溝通觀察；技術界線保持可見，而不是變成術語。`
    },
    {
      hero: '溝通訊號最有力的時候，是詮釋本身也保持清楚。',
      core: '技術實質是提供的星體事實，不是加入未被支持的星盤機制。',
      bestWindow: '沒有提供時間證據，因此技術視角維持在清楚表達，不提出日級主張。',
      watchOut: null,
      astrologer: (anchor) => `提供的${anchor}支持溝通訊號；沒有引入未被支持的時間、宮位或角度事實。`
    },
    '讓有用的部分變清楚。',
    '適當的文字，能讓模式更容易被運用。',
    '清晰，是一種照顧。'
  )
});

function sourceFactKey(reference: InterpretationFactReference): string {
  return `${reference.factKind}|${reference.canonicalPath}`;
}

function technicalAnchor(
  scenario: WeeklyPocScenario,
  group: WeeklySignalThemeGroup,
  locale: WeeklyEditorialLocale
): string {
  const labels = scenario.technicalFacts
    .filter((fact) => group.composition.sourceFactRefs.some(
      (reference) => reference.canonicalPath === fact.canonicalPath
    ))
    .map((fact) => fact.label);

  if (labels.length === 0) {
    return locale === 'zh-Hant' ? '提供的事實' : 'supplied facts';
  }

  return labels.join(locale === 'zh-Hant' ? '與' : ' and ');
}

function getThemeVoice(
  theme: string,
  locale: WeeklyEditorialLocale,
  style: WeeklyEditorialStyle
): ThemeVoice {
  const voiceSet = (locale === 'zh-Hant' ? ZH_HANT_THEME_VOICES : ENGLISH_THEME_VOICES)[theme];

  if (!voiceSet) {
    throw new Error(`No versioned Weekly editorial voice exists for theme ${theme}.`);
  }

  return voiceSet[style];
}

function textForGroup(
  scenario: WeeklyPocScenario,
  group: WeeklySignalThemeGroup,
  locale: WeeklyEditorialLocale,
  style: WeeklyEditorialStyle,
  role: WeeklyEditorialBlockRole
): string {
  const voice = getThemeVoice(group.theme, locale, style);

  if (role === 'hero') {
    return style === 'SHARE' ? voice.shareHook : voice.hero;
  }

  if (role === 'action-decision') {
    if (style === 'SHARE') {
      return voice.shareInsight;
    }

    return locale === 'zh-Hant'
      ? `行動面上，${voice.core}`
      : `For the action decision, ${voice.core}`;
  }

  if (role === 'relationship' || role === 'work-creation' || role === 'inner-state') {
    if (style === 'SHARE') {
      return voice.shareInsight;
    }

    const domainLabel = role === 'relationship'
      ? (locale === 'zh-Hant' ? '在關係互動上' : 'For relationship dynamics')
      : role === 'work-creation'
        ? (locale === 'zh-Hant' ? '在工作與創作上' : 'For work and creation')
        : (locale === 'zh-Hant' ? '在內在狀態上' : 'For inner state');

    return locale === 'zh-Hant'
      ? `${domainLabel}，${voice.core}`
      : `${domainLabel}, ${voice.core}`;
  }

  if (role === 'core-theme') {
    return style === 'SHARE' ? voice.shareInsight : voice.core;
  }

  if (role === 'timeline') {
    return locale === 'zh-Hant'
      ? `時間軸標示這段明確窗口：${voice.bestWindow}`
      : `The timeline marks this explicit window: ${voice.bestWindow}`;
  }

  if (role === 'best-window') {
    return voice.bestWindow;
  }

  if (role === 'watch-out') {
    if (voice.watchOut === null) {
      throw new Error(`Theme ${group.theme} cannot provide a Watch Out without challenging evidence.`);
    }

    return voice.watchOut;
  }

  if (role === 'astrologer-view') {
    return voice.astrologer(technicalAnchor(scenario, group, locale));
  }

  if (role === 'share-hook') {
    return voice.shareHook;
  }

  if (role === 'share-insight') {
    return voice.shareInsight;
  }

  if (role === 'signature-line') {
    return voice.signature;
  }

  return locale === 'zh-Hant' ? 'natalnode.com' : 'natalnode.com';
}

function roleId(role: WeeklyEditorialBlockRole): string {
  return role.replaceAll('-', '_');
}

function createBlock(
  scenario: WeeklyPocScenario,
  group: WeeklySignalThemeGroup,
  locale: WeeklyEditorialLocale,
  style: WeeklyEditorialStyle,
  role: WeeklyEditorialBlockRole,
  text: string = textForGroup(scenario, group, locale, style, role)
): WeeklyEditorialContentBlock {
  const contentBlockId = `${scenario.scenarioId.toLowerCase()}.${style.toLowerCase()}.${roleId(role)}.${group.theme}`;

  return Object.freeze({
    contentBlockId,
    role,
    theme: group.theme,
    text,
    sourceSignalIds: group.composition.sourceSignalIds,
    sourceFactRefs: group.composition.sourceFactRefs,
    contentStyle: style,
    templateVersion: `${WEEKLY_EDITORIAL_VERSION.id}@${WEEKLY_EDITORIAL_VERSION.version}`,
    rulesVersion: INTERPRETATION_RULES_VERSION,
    fixtureAuthority: 'DEVELOPMENT_ONLY'
  });
}

function strongestGroupForDomains(
  groups: readonly WeeklySignalThemeGroup[],
  domains: readonly InterpretationSignal['domain'][]
): WeeklySignalThemeGroup | null {
  return groups.find((group) => group.signals.some((signal) => domains.includes(signal.domain))) ?? null;
}

function challengedGroup(
  groups: readonly WeeklySignalThemeGroup[]
): WeeklySignalThemeGroup | null {
  return groups.find((group) =>
    group.composition.direction === 'MIXED' ||
    group.signals.some((signal) => signal.direction === 'CHALLENGING')
  ) ?? null;
}

function weekdayLabel(
  date: Date,
  locale: WeeklyEditorialLocale,
  canonicalTimezone: string
): string {
  const english = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const traditional = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: canonicalTimezone,
    weekday: 'short'
  }).format(date);
  const weekdayIndex = english.indexOf(weekday);

  if (weekdayIndex === -1) {
    throw new Error(`Unable to resolve weekday in canonical timezone ${canonicalTimezone}.`);
  }

  return (locale === 'zh-Hant' ? traditional : english)[weekdayIndex];
}

function temporalLabel(
  startsAt: string,
  endsAt: string,
  locale: WeeklyEditorialLocale,
  canonicalTimezone: string
): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    throw new Error('Weekly POC temporal evidence must contain a valid non-empty window.');
  }

  const inclusiveEnd = new Date(end.getTime() - 1);
  const startLabel = weekdayLabel(start, locale, canonicalTimezone);
  const endLabel = weekdayLabel(inclusiveEnd, locale, canonicalTimezone);

  return startLabel === endLabel ? startLabel : `${startLabel}–${endLabel}`;
}

function timelineEntries(
  scenario: WeeklyPocScenario,
  groups: readonly WeeklySignalThemeGroup[],
  locale: WeeklyEditorialLocale,
  style: WeeklyEditorialStyle
): readonly WeeklyEditorialTimelineEntry[] {
  const entries = groups.flatMap((group) => {
    const windows = group.signals
      .map((signal) => signal.temporalWindow)
      .filter((window): window is NonNullable<InterpretationSignal['temporalWindow']> =>
        window !== undefined
      );

    if (windows.length === 0) {
      return [];
    }

    const canonicalTimezone = windows[0]?.canonicalTimezone;
    if (canonicalTimezone === undefined) {
      throw new Error(`Weekly POC timeline ${group.theme} has no canonical timezone.`);
    }

    const labels = [...new Set(windows.map((window) =>
      temporalLabel(window.startsAt, window.endsAt, locale, canonicalTimezone)
    ))];
    const label = labels.join(locale === 'zh-Hant' ? '、' : ' / ');
    const content = createBlock(scenario, group, locale, style, 'timeline');

    return [Object.freeze({
      segmentKey: `timeline.${group.theme}`,
      label,
      sourceSignalIds: group.composition.sourceSignalIds,
      sourceFactRefs: group.composition.sourceFactRefs,
      content
    })];
  });

  return Object.freeze(entries);
}

function bestWindowGroup(
  groups: readonly WeeklySignalThemeGroup[]
): WeeklySignalThemeGroup | null {
  const candidates = groups
    .filter((group) => group.signals.some((signal) => signal.temporalWindow !== undefined))
    .map((group) => {
      const momentary = group.signals.filter((signal) =>
        signal.temporalWindow !== undefined && signal.priority === 'MOMENTARY'
      );
      const eligible = momentary.length > 0
        ? momentary
        : group.signals.filter((signal) => signal.temporalWindow !== undefined);

      return {
        group,
        primary: rankInterpretationSignals(eligible)[0]
      };
    })
    .sort((left, right) => {
      if (right.primary.rankingScore !== left.primary.rankingScore) {
        return right.primary.rankingScore - left.primary.rankingScore;
      }

      return left.group.theme.localeCompare(right.group.theme);
    });

  return candidates[0]?.group ?? null;
}

function collectTraceability(
  blocks: readonly (WeeklyEditorialContentBlock | null | undefined)[]
): readonly WeeklyEditorialContentBlock[] {
  const result: WeeklyEditorialContentBlock[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    if (block !== null && block !== undefined && !seen.has(block.contentBlockId)) {
      seen.add(block.contentBlockId);
      result.push(block);
    }
  }

  return Object.freeze(result);
}

function assertDevelopmentOnly(scenario: WeeklyPocScenario): void {
  if (scenario.sourceAuthority !== 'DEVELOPMENT_FIXTURE' ||
      scenario.signalSet.signals.some((signal) => signal.authority !== 'DEVELOPMENT_ONLY')) {
    throw new Error(`Weekly POC scenario ${scenario.scenarioId} is not development-only.`);
  }
}

export function createWeeklyInterpretationDraft(
  scenario: WeeklyPocScenario,
  style: WeeklyEditorialStyle,
  locale: WeeklyEditorialLocale = 'en'
): WeeklyInterpretationDraft {
  assertDevelopmentOnly(scenario);

  const groups = groupWeeklySignalsByTheme(scenario.signalSet.signals);
  const heroGroup = selectWeeklyHeroThemeGroup(scenario.signalSet);

  if (heroGroup === null) {
    throw new Error(`Weekly POC scenario ${scenario.scenarioId} has no meaningful hero theme.`);
  }

  const coreThemes = Object.freeze(
    groups.slice(0, 3).map((group) => {
      const primary = group.primary.signal;
      const content = createBlock(scenario, group, locale, style, 'core-theme');

      return Object.freeze({
        theme: group.theme,
        direction: group.composition.direction,
        intensity: primary.intensity,
        confidence: primary.confidence,
        sourceSignalIds: group.composition.sourceSignalIds,
        sourceFactRefs: group.composition.sourceFactRefs,
        content
      });
    })
  );
  const hero = createBlock(scenario, heroGroup, locale, style, 'hero');
  const isShareStyle = style === 'SHARE';
  const timeline = isShareStyle
    ? Object.freeze([])
    : timelineEntries(scenario, groups, locale, style);
  const relationshipGroup = isShareStyle ? null : strongestGroupForDomains(groups, ['RELATIONSHIP']);
  const workCreationGroup = isShareStyle ? null : strongestGroupForDomains(groups, ['WORK_CREATION']);
  const innerStateGroup = isShareStyle ? null : strongestGroupForDomains(groups, ['SELF', 'EMOTIONAL']);
  const actionDecisionGroup = isShareStyle ? null : strongestGroupForDomains(groups, ['ACTION_DECISION']);
  const challenged = isShareStyle ? null : challengedGroup(groups);
  const windowGroup = isShareStyle ? null : bestWindowGroup(groups);
  const relationship = relationshipGroup
    ? createBlock(scenario, relationshipGroup, locale, style, 'relationship')
    : null;
  const workCreation = workCreationGroup
    ? createBlock(scenario, workCreationGroup, locale, style, 'work-creation')
    : null;
  const innerState = innerStateGroup
    ? createBlock(scenario, innerStateGroup, locale, style, 'inner-state')
    : null;
  const actionDecision = actionDecisionGroup
    ? createBlock(scenario, actionDecisionGroup, locale, style, 'action-decision')
    : null;
  const watchOut = challenged
    ? createBlock(scenario, challenged, locale, style, 'watch-out')
    : null;
  const bestWindow = windowGroup
    ? createBlock(scenario, windowGroup, locale, style, 'best-window')
    : null;
  const astrologerView = style === 'ASTROLOGER'
    ? createBlock(scenario, heroGroup, locale, style, 'astrologer-view')
    : null;
  const shareHook = style === 'SHARE'
    ? hero
    : createBlock(scenario, heroGroup, locale, style, 'share-hook');
  const shareInsight = style === 'SHARE'
    ? coreThemes[0]?.content ?? hero
    : createBlock(scenario, heroGroup, locale, style, 'share-insight');
  const shareCta = createBlock(
    scenario,
    heroGroup,
    locale,
    style,
    'share-cta',
    'natalnode.com'
  );
  const signatureLine = style === 'SHARE'
    ? shareInsight
    : createBlock(scenario, heroGroup, locale, style, 'signature-line');
  const shareProjection = Object.freeze({
    hook: shareHook,
    insight: shareInsight,
    cta: shareCta
  });
  const traceability = collectTraceability([
    hero,
    ...coreThemes.map((theme) => theme.content),
    ...timeline.map((entry) => entry.content),
    relationship,
    workCreation,
    innerState,
    actionDecision,
    watchOut,
    bestWindow,
    astrologerView,
    signatureLine,
    shareHook,
    shareInsight,
    shareCta
  ]);

  return Object.freeze({
    scenarioId: scenario.scenarioId,
    locale,
    style,
    authority: 'DEVELOPMENT_ONLY',
    birthTimeAuthority: scenario.birthTimeAuthority,
    editorialVersion: WEEKLY_EDITORIAL_VERSION,
    rulesVersion: INTERPRETATION_RULES_VERSION,
    period: scenario.signalSet.period,
    signals: scenario.signalSet.signals,
    hero,
    coreThemes,
    timeline,
    relationship,
    workCreation,
    innerState,
    actionDecision,
    watchOut,
    bestWindow,
    astrologerView,
    signatureLine,
    shareProjection,
    traceability
  });
}

export function renderWeeklyPocScenario(
  scenario: WeeklyPocScenario,
  locale: WeeklyEditorialLocale = 'en'
): readonly WeeklyInterpretationDraft[] {
  return Object.freeze((['CLEAR', 'CASUAL', 'ASTROLOGER', 'SHARE'] as const).map((style) =>
    createWeeklyInterpretationDraft(scenario, style, locale)
  ));
}

export function sourceFactReferencesForBlock(
  block: WeeklyEditorialContentBlock
): readonly string[] {
  return Object.freeze([...new Set(block.sourceFactRefs.map(sourceFactKey))]);
}
