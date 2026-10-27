'use strict';
// Arabic for v8: mythic legends, legendary fusions, new talents, achievements, difficulty, pace, Paragon, settings
Object.assign(AR_CARDS, {
  golden_scarab: ['الجعران الذهبي', 'خنفساء الشمس', 'جعران مقدس تبعثر قشرته الذهبية الأعداء حين يندفع.', 'اندفاعة الشمس'],
  myrmidon: ['سرب الميرميدون', 'فيلق البرونز', 'خمس نملات برونزية تقاتل كجدار دروع واحد.', 'صيحة الكتيبة'],
  fenrir: ['فنرير', 'ذئب راغناروك', 'الذئب العملاق في الأساطير. عضّته تجمّد وعواؤه يهز الأرض.', 'شتاء فيمبول'],
  qilin: ['الكيلين', 'جالب الحظ', 'وحش لطيف مشع. أينما مشى التأمت الجراح.', 'النور المبارك'],
  thunderbird: ['طائر الرعد', 'جالب العاصفة', 'ضربات جناحيه رعد. كل انقضاضة تصعق كل ما تحته.', 'قصفة الرعد'],
  simurgh: ['السيمرغ', 'الحكيم المعالج', 'طائر شفاء قديم. ريشه يداوي كل من يلمسه.', 'ريشة الحياة'],
  yggdrasil: ['برعم إغدراسيل', 'بذرة العالم', 'برعم من شجرة العالم. يعالج مساحة ضخمة لوقت طويل.', 'جذور العالم'],
  alraune: ['ألراونه', 'عذراء الأشواك', 'عذراء الزهور التي تقيّد أشواكها كل عدو قريب وتدميه.', 'سجن الورود'],
  golem_king: ['ملك الغولم', 'الجبل المتوَّج', 'ملك كل الغولم. يستفز ساحة القتال ويسحق الخط الأمامي.', 'المعقل الملكي'],
  basilisk: ['الباسيليسك', 'ملك الأفاعي', 'نظرته تحوّل الأعداء إلى حجر: كل طلقة تبطئهم بشدة.', 'النظرة المحجِّرة'],
  kraken: ['الكراكن', 'رعب الأعماق', 'حبّار عملاق. مجساته تبطئ وتسحق كل ما حوله.', 'الدوامة'],
  nereid: ['النيريد', 'ابنة البحر', 'حورية بحر تدور حولك فتقوّي مستدعيك وتحميهم.', 'مد النعمة'],
  kitsune: ['الكيتسوني ذو الذيول التسعة', 'محتال نار الثعلب', 'روح ثعلب بتسعة ذيول تقذف نار الثعلب التي تنفجر بلهب أزرق.', 'مطر نار الثعلب'],
  jinn: ['الجنّي', 'الدخان والعاصفة', 'روح من نار بلا دخان تستدعي البرق على كل عدو في المدى.', 'غضب الجنّي'],
  bahamut: ['باهاموت', 'ملك التنانين', 'ملك التنانين في الأساطير. نَفَسه نهر من النار.', 'التوهج الأعظم'],
  tiamat: ['تيامات', 'أم الوحوش', 'تنين الفوضى الذي نَفَسه سم وعاصفة.', 'البحر الأزلي'],
  metatron: ['ميتاترون', 'صوت السماء', 'رئيس ملائكة شاهق تخترق رماحه جيشًا كاملًا.', 'كلمة السماء'],
  garuda: ['غارودا', 'نسر الشمس', 'نسر شمس ذهبي تصعق انقضاضاته كل ما في طريقها.', 'علامة الشمس'],
  ouroboros: ['الأوروبوروس', 'الدائرة الأبدية', 'الأفعى التي تأكل ذيلها. البرق المتسلسل يقفز من لفائفها إلى الأبد.', 'العودة الأبدية'],
  chimera: ['الكيميرا', 'الغضب ثلاثي الرؤوس', 'أسد وماعز وأفعى في جسد واحد. اندفاعاتها تسحق الجيوش.', 'هجمة الكيميرا'],
  ragnarok_fenrir: ['فنرير راغناروك', 'هلاك الآلهة', 'الذئب الذي يلتهم الشمس، ملفوفًا بشتاء أبدي.', ''],
  storm_kirin: ['كيرين العاصفة', 'حظ الرعد', 'كيلين من سحب العاصفة يعالج بالبرق.', ''],
  tempest_thunderbird: ['طائر الرعد الإعصاري', 'كاسر السماء', 'كل ضربة جناح صاعقة برق.', ''],
  world_tree: ['إغدراسيل', 'شجرة العالم', 'شجرة العالم نفسها، تعالج كل ما تحت أغصانها.', ''],
  gorgon_basilisk: ['باسيليسك الغورغون', 'نظرة الحجر', 'أفعى متوّجة تحوّل نظرتها الجيوش إلى كريستال.', ''],
  abyssal_kraken: ['كراكن الهاوية', 'سيد الخندق', 'كراكن من أعمق خندق، يطقطق بالبرق.', ''],
  nine_sun_kitsune: ['كيتسوني الشموس التسع', 'الثعلب السماوي', 'روح ثعلب تحترق ذيوله التسعة كتسع شموس.', ''],
  bahamut_zero: ['باهاموت زيرو', 'نهاية كل التنانين', 'الهيئة الأخيرة لملك التنانين.', ''],
  sun_garuda: ['غارودا الشمس', 'أجنحة الفجر', 'نسر ذهبي للفجر يحمل رمحًا مقدسًا.', ''],
  eternal_ouroboros: ['الأوروبوروس الأبدي', 'البداية والنهاية', 'الدائرة التي لا تنتهي، تطقطق بالفوضى.', ''],
});
Object.assign(AR_TALENTS, {
  wrath: ['غضب المستدعي', '+2% ضرر المستدعين لكل رتبة'], ironwill: ['الإرادة الحديدية', '+2% صحة قصوى لكل رتبة'], arcfocus: ['التركيز السحري', '−1% انتظار المهارات الخاصة لكل رتبة'],
  overcharge: ['الشحن الزائد', '+3% شحن الفيض لكل رتبة'], scholar: ['العالِم', '+3% خبرة البطاقات لكل رتبة'], prospector: ['المنقّب', '+2% أحجار سحرية لكل رتبة'],
  keeneye: ['العين الحادة', '+0.5% فرصة ضربة حرجة لكل رتبة'], thickskin: ['الجلد السميك', '−1% ضرر متلقى لكل رتبة'], secondwind: ['النَفَس الثاني', '+0.4 تجدد صحة كل ثانية لكل رتبة'],
  soulleech: ['امتصاص الأرواح', 'القتلات تعالج ألين 0.5 صحة لكل رتبة'], broodlord: ['سيد الحضانة', 'مستدعو الحشرات يسببون ضررًا أكبر بـ3% لكل رتبة'], alphacall: ['نداء الألفا', 'مستدعو الوحوش يسببون ضررًا أكبر بـ3% لكل رتبة'],
  skylord: ['سيد السماء', 'مستدعو الطيور يسببون ضررًا أكبر بـ3% لكل رتبة'], greenheart: ['القلب الأخضر', 'مستدعو النبات يعالجون أكثر بـ3% لكل رتبة'], mountain: ['قلب الجبل', 'مستدعو الحجر يحصلون على +3% صحة لكل رتبة'],
  tidecall: ['مستدعي المد', 'دروع الأسماك أقوى بـ3% لكل رتبة'], spiritbind: ['رابط الأرواح', 'مستدعو الأرواح يسببون ضررًا أكبر بـ3% لكل رتبة'], dragonrider: ['فارس التنانين', 'مستدعو التنانين يسببون ضررًا أكبر بـ3% لكل رتبة'],
  divinefavor: ['الحظوة الإلهية', 'المستدعون السماويون والبدائيون يسببون ضررًا أكبر بـ3% لكل رتبة'], lastingpact: ['العهد الدائم', 'المستدعون محدودو المدة يدومون أطول بـ3% لكل رتبة'],
});
Object.assign(AR_ACH, {
  lv100: ['المئوي', 'صل إلى المستوى 100.'], awk10: ['مستيقظ بالكامل', 'أيقظ بطاقة 10 مرات.'], star20: ['عشرون نجمة', 'عزّز بطاقة إلى 20 نجمة.'],
  hellclear: ['سائر الجحيم', 'أنهِ مرحلة على صعوبة الجحيم.'], tier20: ['قاع الجحيم', 'افتح طبقة الجحيم 20.'],
  legends: ['أسطورة حية', 'افتح الأساطير العشرين كلها.'], legfuse: ['صانع الأساطير', 'اكتشف الاندماجات الأسطورية العشرة كلها.'],
});
const AR_TL_EXTRA = {
  '+2% max HP': '+2% صحة قصوى', '+4 max mana': '+4 مانا قصوى', '+2% mana regeneration': '+2% تجدد المانا', '+1 capacity every 5 ranks': '+1 سعة كل 5 رتب', '+4% stone damage': '+4% ضرر الحجر',
  '+1% move speed': '+1% سرعة حركة', '+2% summon HP and damage': '+2% صحة وضرر المستدعين', '−1% summon cooldowns': '−1% انتظار الاستدعاء', '+3% soul gauge gain': '+3% امتلاء مقياس الروح', '+5% pickup range': '+5% مدى الالتقاط',
};
const AR_PARAGON = { might: 'القوة', fort: 'الصمود', flow: 'التدفق', fortune: 'الحظ', wisdom: 'الحكمة', haste: 'العجلة' };
const AR_PARAGON_DESC = { might: 'ضرر المستدعين', fort: 'صحة قصوى', flow: 'تجدد المانا', fortune: 'أحجار سحرية', wisdom: 'خبرة البطاقات', haste: 'انتظار الاستدعاء' };
const AR_DIFFS = ['عادي', 'صعب', 'كابوس', 'جحيم'];
const AR_PACES = ['عادي', 'سريع', 'خاطف'];
Object.assign(AR_UI, {
  'Difficulty': 'الصعوبة', 'Pace': 'الإيقاع', 'Skip to the boss': 'انتقل إلى الزعيم مباشرة', 'Paragon': 'الباراغون', 'Gameplay': 'اللعب', 'Summon capacity': 'سعة الاستدعاء',
  'Keep playing in a background tab': 'واصل اللعب في تبويب بالخلفية', 'Game speed (G)': 'سرعة اللعب (G)', 'Game speed': 'سرعة اللعب', 'Auto summon': 'استدعاء تلقائي', 'Slots 1–6': 'الخانات 1–6', 'Slots 1–10': 'الخانات 1–10',
  'Keep': 'احتفظ', 'Auto skill': 'مهارة تلقائية', 'Empty slot': 'خانة فارغة', 'Magic stones': 'الأحجار السحرية', 'Rift shards': 'شظايا الصدع', 'Arena tickets': 'تذاكر الحلبة', 'Free Altar draws': 'سحبات المذبح المجانية',
  'Paragon points to spend': 'نقاط باراغون للإنفاق', 'Fully awakened': 'مستيقظ بالكامل',
  'With this on, the battle keeps going when you switch tabs or windows (turn on auto summon and auto skills in Automation so your army keeps fighting). Browsers slow background tabs down, so the game catches up when it gets time.': 'مع تفعيله، تستمر المعركة حين تنتقل إلى تبويب أو نافذة أخرى (فعّل الاستدعاء التلقائي والمهارات التلقائية من الأتمتة ليواصل جيشك القتال). المتصفحات تبطئ التبويبات الخلفية، فتلحق اللعبة بما فاتها حين تتاح لها الفرصة.',
  'Keeps the number of each card you choose below on the field, whenever you have the mana and capacity.': 'يحافظ على العدد الذي تختاره أدناه من كل بطاقة في الساحة، كلما توفرت المانا والسعة.',
  'Casts every time it is ready while you have summons out and enemies nearby.': 'يُفعَّل كلما كان جاهزًا ولديك مستدعون في الساحة وأعداء قريبون.',
  'Fires every time the gauge refills, as soon as enemies are nearby.': 'ينطلق في كل مرة يمتلئ فيها المقياس، فور اقتراب الأعداء.',
  '"Keep" = how many of that card auto summon keeps on the field (0 = never). "Auto skill" casts the slot\'s special skill every time it is ready. During battle you can also right-click a slot (or tap its small A).': '«احتفظ» = عدد ما يُبقيه الاستدعاء التلقائي من تلك البطاقة في الساحة (0 = أبدًا). «مهارة تلقائية» تُفعّل المهارة الخاصة للخانة كلما كانت جاهزة. أثناء المعركة يمكنك أيضًا النقر بالزر الأيمن على الخانة (أو لمس حرف A الصغير).',
  'Auto-pick upgrades, auto Enhance and Overdrive, auto summon and auto special skills for slots 1–10.': 'اختيار الترقيات تلقائيًا، والتعزيز والفيض التلقائي، والاستدعاء التلقائي، والمهارات الخاصة التلقائية للخانات 1–10.',
});
AR_PATTERNS.push(
  [/^enemies \+(\d+)% · rewards ×([\d.]+) · stage time (\d+)%$/, 'الأعداء +$1% · المكافآت ×$2 · وقت المرحلة $3%'], [/^normal difficulty$/, 'صعوبة عادية'],
  [/^Hell Tier: enemies \+25% HP and damage per tier, rewards ×10 at tier 10 and ×20 at tier 20, and stages get shorter\. Tiers 1–10 open at level 40; clear Throne of the Fallen on your highest tier to unlock 11–20\.$/, 'طبقة الجحيم: الأعداء +25% صحة وضرر لكل طبقة، والمكافآت ×10 في الطبقة 10 و×20 في الطبقة 20، والمراحل تقصر. الطبقات 1–10 تُفتح في المستوى 40؛ أنهِ عرش الساقط على أعلى طبقة لديك لتفتح 11–20.'],
  [/^Catch (\d+) Treasure Goblins$/, 'أمسك $1 عفاريت كنز'], [/^Summon (\d+) creatures$/, 'استدعِ $1 مخلوقًا'],
  [/^Awaken ([IVX]+) ◆([\d,]+) ✧(\d+)$/, 'أيقظ $1 ◆$2 ✧$3'], [/^✦ Awakened ([IVX]+) \(max\)$/, '✦ مستيقظ $1 (الأقصى)'], [/^Awakening (\d+)\/(\d+): every level adds \+15% HP and damage$/, 'الإيقاظ $1/$2: كل مستوى يضيف +15% صحة وضرر'],
  [/^Slot (\d+): auto special skill (on|off)$/, (m, n, s) => `الخانة ${n}: المهارة الخاصة التلقائية ${s === 'on' ? 'مفعّلة' : 'متوقفة'}`], [/^Game speed ([\d.]+)×$/, 'سرعة اللعب $1×'],
  [/^Auto summon keeps (\d+) on the field$/, 'الاستدعاء التلقائي يبقي $1 في الساحة'], [/^Cleared on (.+)$/, (m, d) => `أُنهيت على ${AR_DIFFS[DIFFS.findIndex(x => x.name === d)] || d}`],
  [/^· best clear: (.+)$/, (m, d) => `· أفضل إنهاء: ${AR_DIFFS[DIFFS.findIndex(x => x.name === d)] || d}`], [/^×([\d.]+) rewards$/, '×$1 مكافآت'], [/^(\d+)% time$/, '$1% وقت'],
  [/^Past rank (\d+): (.+)$/, (m, n, x) => `بعد الرتبة ${n}: ${AR_TL_EXTRA[x] || x}`], [/^· (\d+) points? to spend$/, '· $1 نقاط للإنفاق'], [/^· earn 1 point for every level past (\d+)$/, '· اكسب نقطة عن كل مستوى بعد $1'],
  [/^([+−])([\d.]+)% (summon damage|max HP|mana regeneration|magic stones|card EXP|summon cooldowns)$/, (m, s, v, k) => `${s}${v}% ${{ 'summon damage': 'ضرر المستدعين', 'max HP': 'صحة قصوى', 'mana regeneration': 'تجدد المانا', 'magic stones': 'أحجار سحرية', 'card EXP': 'خبرة البطاقات', 'summon cooldowns': 'انتظار الاستدعاء' }[k]}`],
  [/^(Normal|Hard|Nightmare|Hell)$/, (m, d) => AR_DIFFS[DIFFS.findIndex(x => x.name === d)]], [/^(Fast|Blitz)$/, (m, d) => AR_PACES[PACES.findIndex(x => x.name === d)]],
);
// ----- v9: auto-finish, tower checkpoint, Overdrive charges -----
Object.assign(AR_ACH, { sweep100: ['خبير الكفاءة', 'أنهِ 100 جولة تلقائيًا.'] });
Object.assign(AR_UI, {
  'Auto-finish': 'إنهاء تلقائي', 'Auto-climb': 'صعود تلقائي', 'Auto-rush': 'سباق تلقائي', 'Collect': 'استلم', 'Start floor': 'طابق البداية', 'Floor 1': 'الطابق 1',
  'Team power': 'قوة الفريق', '· needed': '· المطلوب', 'EXP': 'الخبرة', 'Materials': 'المواد', 'Enemies defeated': 'الأعداء المهزومون',
  'Clear this stage once first': 'أنهِ هذه المرحلة مرة أولًا', 'Your team is too weak for this difficulty': 'فريقك أضعف من هذه الصعوبة', 'Your team is too weak for that yet': 'فريقك أضعف من ذلك حاليًا',
  'Starting higher pays everything the floors below would have given, and gives you their run upgrades and soul boosts.': 'البدء من طابق أعلى يدفع لك كل ما كانت ستعطيه الطوابق السفلى، ويمنحك ترقيات الجولة ومعززات الروح الخاصة بها.',
  'Rewards are the average of what these runs pay when played. Change your hotbar in the Grimoire to raise your team power.': 'المكافآت هي متوسط ما تدفعه هذه الجولات عند لعبها. غيّر شريطك في الغريموار لترفع قوة فريقك.',
  'OVERDRIVE ACTIVE': 'الفيض نشط',
});
AR_PATTERNS.push(
  [/^Your best: floor (\d+)$/, 'أفضل طابق لك: $1'], [/^Defeat ([\d,]+) bosses$/, 'اهزم $1 زعيمًا'], [/^Defeat ([\d,]+) enemies$/, 'اهزم $1 عدو'], [/^Your team would reach about floor (\d+)\.$/, 'سيصل فريقك تقريبًا إلى الطابق $1.'],
  [/^Each clear: about ◆ ([\d,]+) · (.+) EXP(?: · ✧ (\d+))?$/, (m, s, e, x) => `كل إنهاء: تقريبًا ◆ ${s} · ${e} خبرة${x ? ` · ✧ ${x}` : ''}`],
  [/^(.+) cleared (\d+)× on (Normal|Hard|Nightmare|Hell)( · Hell Tier (\d+))?\.$/, (m, s, n, d, x, t) => `تم إنهاء ${s} ${n}× على ${AR_DIFFS[DIFFS.findIndex(q => q.name === d)]}${t ? ` · طبقة الجحيم ${t}` : ''}.`],
  [/^Abyss Tower climbed (\d+)× to floor (\d+)\.$/, 'تم صعود برج الهاوية $1× حتى الطابق $2.'], [/^Boss Rush run (\d+)×: (\d+) of (\d+) bosses defeated each time\.$/, 'سباق الزعماء $1×: هُزم $2 من $3 زعيمًا في كل مرة.'],
  [/^(.+) \(\+(\d+) levels?\)$/, '$1 (+$2 مستوى)'], [/^OVERDRIVE ×(\d+) · (.+)$/, 'الفيض ×$1 · $2'],
  [/^Started at floor (\d+): (.+)$/, (m, f, r) => `بدأت من الطابق ${f}: ${r.replace('run upgrades', 'ترقيات جولة').replace('levels', 'مستويات')}`],
  [/^"Keep" = how many of that card auto summon keeps on the field \(0 = never\), multiplied by your Summon capacity setting \(×([\d.]+) now\)\. "Auto skill" casts the slot's special skill every time it is ready\. During battle you can also right-click a slot \(or tap its small A\)\.$/, '«احتفظ» = عدد ما يُبقيه الاستدعاء التلقائي من تلك البطاقة في الساحة (0 = أبدًا)، مضروبًا في إعداد سعة الاستدعاء (×$1 الآن). «مهارة تلقائية» تُفعّل المهارة الخاصة للخانة كلما كانت جاهزة. أثناء المعركة يمكنك أيضًا النقر بالزر الأيمن على الخانة (أو لمس حرف A الصغير).'],
);
// data swaps that need the v8 objects (run from i18n's applyArabicData)
AR_WHATSNEW.splice(0, AR_WHATSNEW.length,
  ['بلا حد للمستوى', 'أنت وبطاقاتك ترتفعون في المستوى إلى ما لا نهاية. كل مستوى بعد 70 يمنح نقطة باراغون (الغريموار ← المواهب). البطاقات تصل إلى 20 نجمة ويمكن إيقاظها 10 مرات.'],
  ['30 موهبة حتى الرتبة 20', '20 موهبة جديدة، وكل موهبة تصل الآن إلى الرتبة 20.'],
  ['أصعب مقابل مكافآت أكبر', 'اختر صعب أو كابوس أو جحيم في أي مرحلة لمكافآت حتى ×4. طبقات الجحيم تصل الآن إلى 20 وتدفع حتى ×10 وتجعل المراحل أقصر.'],
  ['جولات أسرع', 'اختر إيقاعًا سريعًا أو خاطفًا، والعب بسرعة 1.5× أو 2× (G)، أو انتقل مباشرة إلى الزعيم في المراحل ذات النجوم الثلاث.'],
  ['الأتمتة', 'الاستدعاء التلقائي يبقي العدد الذي تختاره من كل بطاقة في الساحة. المهارات التلقائية تتبع الخانات 1–6 وتنطلق كلما كانت جاهزة. تجدها في الإيقاف المؤقت ← الأتمتة.'],
  ['20 أسطورة', 'فنرير والكراكن والكيتسوني وباهاموت وميتاترون والكيميرا وغيرها، مع 10 اندماجات أسطورية. وكل المخلوقات صارت أكثر روعة.'],
);
function applyArabicV8() {
  for (const t of TALENTS) if (t.extra && AR_TL_EXTRA[t.extra]) t.extra = AR_TL_EXTRA[t.extra];
  for (const p of PARAGON) { if (AR_PARAGON[p.id]) p.name = AR_PARAGON[p.id]; const k = AR_PARAGON_DESC[p.id], sign = p.id === 'haste' ? '−' : '+'; if (k) p.desc = v => `${sign}${(v * 100).toFixed(1)}% ${k}`; }
  DIFFS.forEach((d, i) => { d.label = AR_DIFFS[i]; });
}
