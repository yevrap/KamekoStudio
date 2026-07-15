// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS — static data + pure helpers, DOM-free, no imports
// ═══════════════════════════════════════════════════════════════════════════

export const MONTHS_S = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
};
export const MONTHS_F = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};
export const DAYS_IN_MONTH = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// The cast: the 12 signs themselves are the guests. Each arrives incognito
// with a personality-flavored line (the traits are part of the teaching).
export const SIGNS = [
    { id: 0,  sym: '♈', emoji: '🐏', el: 'fire',  mod: 'cardinal', planet: 'mars',    from: [3, 21],  to: [4, 19],
      name: { en: 'Aries', ru: 'Овен' }, epi: { en: 'the Ram', ru: '' },
      intro: { en: '“First! I’m always first. Now hurry, tell me about me!”',
               ru: '«Я первый! Я всегда первый. Ну же, скорее расскажите обо мне!»' } },
    { id: 1,  sym: '♉', emoji: '🐂', el: 'earth', mod: 'fixed',    planet: 'venus',   from: [4, 20],  to: [5, 20],
      name: { en: 'Taurus', ru: 'Телец' }, epi: { en: 'the Bull', ru: '' },
      intro: { en: '“I’m not leaving this armchair, it’s far too comfortable. Take your time.”',
               ru: '«Я из этого кресла не встану — уж очень удобное. Можете не торопиться.»' } },
    { id: 2,  sym: '♊', emoji: '👯', el: 'air',   mod: 'mutable',  planet: 'mercury', from: [5, 21],  to: [6, 20],
      name: { en: 'Gemini', ru: 'Близнецы' }, epi: { en: 'the Twins', ru: '' },
      intro: { en: '“Hi! I have two questions. No — three. Wait, let me start over.”',
               ru: '«Привет! У меня два вопроса. Нет, три. Так, давайте сначала.»' } },
    { id: 3,  sym: '♋', emoji: '🦀', el: 'water', mod: 'cardinal', planet: 'moon',    from: [6, 21],  to: [7, 22],
      name: { en: 'Cancer', ru: 'Рак' }, epi: { en: 'the Crab', ru: '' },
      intro: { en: '“I brought photos of my whole family. And a pie, in case you’re hungry.”',
               ru: '«Я тут фото всей семьи принёс. И пирог — вдруг вы голодны.»' } },
    { id: 4,  sym: '♌', emoji: '🦁', el: 'fire',  mod: 'fixed',    planet: 'sun',     from: [7, 23],  to: [8, 22],
      name: { en: 'Leo', ru: 'Лев' }, epi: { en: 'the Lion', ru: '' },
      intro: { en: '“You may admire me. Most people do.”',
               ru: '«Можете мной восхищаться. Обычно все так и делают.»' } },
    { id: 5,  sym: '♍', emoji: '🌾', el: 'earth', mod: 'mutable',  planet: 'mercury', from: [8, 23],  to: [9, 22],
      name: { en: 'Virgo', ru: 'Дева' }, epi: { en: 'the Maiden', ru: '' },
      intro: { en: '“Your bookshelf was out of order. I fixed it. You’re welcome.”',
               ru: '«У вас книги стояли не по порядку. Я всё исправила. Не благодарите.»' } },
    { id: 6,  sym: '♎', emoji: '⚖️', el: 'air',   mod: 'cardinal', planet: 'venus',   from: [9, 23],  to: [10, 22],
      name: { en: 'Libra', ru: 'Весы' }, epi: { en: 'the Scales', ru: '' },
      intro: { en: '“I couldn’t pick what to wear, so here are both options. What do you think?”',
               ru: '«Никак не выберу, что надеть. Вот оба варианта — что скажете?»' } },
    { id: 7,  sym: '♏', emoji: '🦂', el: 'water', mod: 'fixed',    planet: 'pluto',   from: [10, 23], to: [11, 21],
      name: { en: 'Scorpio', ru: 'Скорпион' }, epi: { en: 'the Scorpion', ru: '' },
      intro: { en: '“I already know your secrets. Now tell me mine.”',
               ru: '«Ваши секреты я уже знаю. Теперь расскажите мои.»' } },
    { id: 8,  sym: '♐', emoji: '🏹', el: 'fire',  mod: 'mutable',  planet: 'jupiter', from: [11, 22], to: [12, 21],
      name: { en: 'Sagittarius', ru: 'Стрелец' }, epi: { en: 'the Archer', ru: '' },
      intro: { en: '“Tomorrow I’m off to the mountains. Or the sea. Somewhere! Make it quick.”',
               ru: '«Завтра уезжаю в горы. Или на море. Куда-нибудь! Давайте побыстрее.»' } },
    { id: 9,  sym: '♑', emoji: '🐐', el: 'earth', mod: 'cardinal', planet: 'saturn',  from: [12, 22], to: [1, 19],
      name: { en: 'Capricorn', ru: 'Козерог' }, epi: { en: 'the Goat', ru: '' },
      intro: { en: '“I have a five-year plan. I just need the stars to sign off on it.”',
               ru: '«У меня есть план на пять лет. Осталось согласовать его со звёздами.»' } },
    { id: 10, sym: '♒', emoji: '🏺', el: 'air',   mod: 'fixed',    planet: 'uranus',  from: [1, 20],  to: [2, 18],
      name: { en: 'Aquarius', ru: 'Водолей' }, epi: { en: 'the Water-Bearer', ru: '' },
      intro: { en: '“Everyone reads horoscopes wrong. I invented my own system. But let’s check yours too.”',
               ru: '«Все читают гороскопы неправильно. Я изобрёл свою систему. Но вашу тоже проверим.»' } },
    { id: 11, sym: '♓', emoji: '🐟', el: 'water', mod: 'mutable',  planet: 'neptune', from: [2, 19],  to: [3, 20],
      name: { en: 'Pisces', ru: 'Рыбы' }, epi: { en: 'the Fish', ru: '' },
      intro: { en: '“Sorry I’m late… I keep daydreaming and drifting right past your door.”',
               ru: '«Простите за опоздание… Я витаю в облаках и всё время проплываю мимо вашей двери.»' } },
];

// opposite = 6 signs away around the wheel
export const oppOf = s => SIGNS[(s.id + 6) % 12];

export const ELEMENTS = {
    fire:  { label: { en: 'Fire',  ru: 'Огонь' },  gen: 'Огня',    cls: 'el-fire',  pair: 'air',   signs: '♈ ♌ ♐' },
    earth: { label: { en: 'Earth', ru: 'Земля' },  gen: 'Земли',   cls: 'el-earth', pair: 'water', signs: '♉ ♍ ♑' },
    air:   { label: { en: 'Air',   ru: 'Воздух' }, gen: 'Воздуха', cls: 'el-air',   pair: 'fire',  signs: '♊ ♎ ♒' },
    water: { label: { en: 'Water', ru: 'Вода' },   gen: 'Воды',    cls: 'el-water', pair: 'earth', signs: '♋ ♏ ♓' },
};
export const ELEMENT_COLOR = { fire: '#ff7a5c', earth: '#4ade80', air: '#60a5fa', water: '#b18aff' };

export const MODS = {
    cardinal: { label: { en: 'Cardinal', ru: 'Кардинальный' }, pl: { en: 'Cardinal', ru: 'Кардинальные' },
                hint: { en: 'the starter', ru: 'тот, кто начинает' }, desc: { en: 'starts the season', ru: 'начинает сезон' }, signs: '♈ ♋ ♎ ♑' },
    fixed:    { label: { en: 'Fixed', ru: 'Фиксированный' }, pl: { en: 'Fixed', ru: 'Фиксированные' },
                hint: { en: 'the keeper', ru: 'тот, кто держит' }, desc: { en: 'holds mid-season', ru: 'держит середину сезона' }, signs: '♉ ♌ ♏ ♒' },
    mutable:  { label: { en: 'Mutable', ru: 'Мутабельный' }, pl: { en: 'Mutable', ru: 'Мутабельные' },
                hint: { en: 'the adapter', ru: 'тот, кто отпускает' }, desc: { en: 'closes the season', ru: 'провожает сезон' }, signs: '♊ ♍ ♐ ♓' },
};

export const PLANETS = {
    mars:    { en: 'Mars',      ru: 'Марс' },
    venus:   { en: 'Venus',     ru: 'Венера' },
    mercury: { en: 'Mercury',   ru: 'Меркурий' },
    moon:    { en: 'the Moon',  ru: 'Луна' },
    sun:     { en: 'the Sun',   ru: 'Солнце' },
    pluto:   { en: 'Pluto',     ru: 'Плутон' },
    jupiter: { en: 'Jupiter',   ru: 'Юпитер' },
    saturn:  { en: 'Saturn',    ru: 'Сатурн' },
    uranus:  { en: 'Uranus',    ru: 'Уран' },
    neptune: { en: 'Neptune',   ru: 'Нептун' },
};

export const SEASON_HINTS = {
    en: ['the very start of spring', 'solid mid-spring', 'late spring turning to summer',
         'just past the summer solstice', 'the heart of summer', 'late summer, harvest time',
         'the start of autumn', 'deep autumn', 'late autumn turning to winter',
         'the winter solstice season', 'the heart of winter', 'late winter, thaw coming'],
    ru: ['самое начало весны', 'середина весны', 'конец весны, почти лето',
         'сразу после летнего солнцестояния', 'разгар лета', 'конец лета, время урожая',
         'начало осени', 'глубокая осень', 'конец осени, скоро зима',
         'время зимнего солнцестояния', 'середина зимы', 'конец зимы, скоро оттепель'],
};

// corner season markers: [emoji, angle in degrees]
export const SEASONS = [
    { key: 'spring', emoji: '🌸', deg: -45 },
    { key: 'summer', emoji: '☀️', deg: 45 },
    { key: 'autumn', emoji: '🍂', deg: 135 },
    { key: 'winter', emoji: '❄️', deg: 225 },
];

export const FORTUNES = {
    en: ['Tomorrow, a small cup of something warm changes everything.',
         'Mercury is not in retrograde. Whatever happens next is on you.',
         'A stranger will compliment your judgment. Believe them.',
         'The stars suggest a nap. The stars are wise.',
         'An old song will find you tomorrow and stay all day.',
         'Something you lost is about to turn up in an obvious place.'],
    ru: ['Завтра маленькая чашка чего-то тёплого всё изменит.',
         'Меркурий не в ретрограде. Что бы ни случилось дальше — это уже вы сами.',
         'Незнакомец похвалит ваше чутьё. Поверьте ему.',
         'Звёзды советуют вздремнуть. Звёзды мудры.',
         'Старая песня найдёт вас завтра и останется на весь день.',
         'Потерянная вещь вот-вот найдётся на самом видном месте.'],
};

export const HAPPY = {
    en: ['“Exactly!”', '“I knew it!”', '“That explains everything.”', '“The stars agree.”'],
    ru: ['«Именно!»', '«Я так и знал!»', '«Это всё объясняет.»', '«Ну конечно!»'],
};

// ── Chart Reading room ──────────────────────────────────────────────────────
// Whole-sign houses: the rising sign occupies the 1st house and each next
// sign (zodiac order = clockwise on our wheel) takes the next house. The
// rising sign itself uses the simplified sunrise rule: at sunrise the sun
// sign is rising, and the ascendant advances one sign every ~2 hours.
// Known simplifications (recorded in the vault design note): latitude,
// season, and exact dawn time are ignored — the arithmetic is the lesson.

export const CHART_GUESTS = 4;
export const HOUSES_PER_GUEST = 3;

// birth times are quantized to even hours so "÷ 2" is always whole
export const BIRTH_HOURS = Array.from({ length: 12 }, (_, i) => i * 2);

export const risingFor = (sunId, hoursAfterSunrise) => (sunId + Math.floor(hoursAfterSunrise / 2)) % 12;
export const houseSignId = (risingId, houseN) => (risingId + houseN - 1) % 12;

export const HOUSES = [
    { n: 1,  label: { en: 'self & first impressions', ru: 'сам человек и первое впечатление' },
      q: { en: '“People say I seem different lately. Which sign colors the face I show the world?”',
           ru: '«Говорят, я в последнее время изменился. Какой знак красит лицо, что я показываю миру?»' } },
    { n: 2,  label: { en: 'money & what you own', ru: 'деньги и имущество' },
      q: { en: '“Money has been on my mind. Which sign keeps my purse?”',
           ru: '«Всё думаю о деньгах. Какой знак стережёт мой кошелёк?»' } },
    { n: 3,  label: { en: 'everyday talk & errands', ru: 'разговоры и повседневные дела' },
      q: { en: '“My days are all notes and errands. Which sign runs my daily chatter?”',
           ru: '«Мои дни — сплошные записки и поручения. Какой знак ведёт мою переписку?»' } },
    { n: 4,  label: { en: 'home & family roots', ru: 'дом и семейные корни' },
      q: { en: '“I want my home to feel like home again. Which sign tends my hearth?”',
           ru: '«Хочу, чтобы дом снова был домом. Какой знак хранит мой очаг?»' } },
    { n: 5,  label: { en: 'play, romance & creation', ru: 'игра, романтика и творчество' },
      q: { en: '“Where did my spark go? Which sign guards my play and my art?”',
           ru: '«Куда делась моя искра? Какой знак отвечает за игру и творчество?»' } },
    { n: 6,  label: { en: 'work & daily health', ru: 'работа и повседневное здоровье' },
      q: { en: '“My routines are a mess. Which sign keeps my working days in order?”',
           ru: '«Мой распорядок развалился. Какой знак наводит порядок в буднях?»' } },
    { n: 7,  label: { en: 'partnership', ru: 'партнёрство' },
      q: { en: '“Tell me about the one who sits across from me. Which sign holds my partnerships?”',
           ru: '«Расскажите о том, кто сидит напротив. Какой знак ведает моими союзами?»' } },
    { n: 8,  label: { en: 'shared depths & change', ru: 'общие глубины и перемены' },
      q: { en: '“Something in me is quietly changing. Which sign minds my depths?”',
           ru: '«Что-то во мне тихо меняется. Какой знак смотрит за моими глубинами?»' } },
    { n: 9,  label: { en: 'travel & big ideas', ru: 'дальние дороги и большие идеи' },
      q: { en: '“I dream of far places and long books. Which sign points my compass?”',
           ru: '«Мне снятся дальние края и толстые книги. Какой знак держит мой компас?»' } },
    { n: 10, label: { en: 'career & reputation', ru: 'карьера и репутация' },
      q: { en: '“What do they say about my work? Which sign sits at the top of my chart?”',
           ru: '«Что говорят о моих делах? Какой знак стоит на вершине моей карты?»' } },
    { n: 11, label: { en: 'friends & community', ru: 'друзья и круг общения' },
      q: { en: '“Who are my people this season? Which sign gathers my friends?”',
           ru: '«Кто мои люди в этом сезоне? Какой знак собирает моих друзей?»' } },
    { n: 12, label: { en: 'rest, dreams & secrets', ru: 'отдых, сны и тайны' },
      q: { en: '“My dreams have been loud lately. Which sign keeps what they hide?”',
           ru: '«Сны в последнее время громкие. Какой знак хранит то, что они прячут?»' } },
];

// The year of horoscopes: one named arc colors every daily read. The whole
// year is effectively prewritten — reads are composed deterministically from
// (date, sign, YEAR_THEME.version), so bumping the version at an update
// refreshes all 365 × 12 reads at once without shipping literal entries.
export const YEAR_THEME = {
    version: 1,
    year: 2026,
    title: { en: 'The Year of Quiet Momentum', ru: 'Год тихого разгона' },
    line: {
        en: 'Whatever you tend quietly this year keeps gathering speed.',
        ru: 'Всё, что вы тихо растите в этом году, понемногу набирает ход.',
    },
};

// daily horoscope phrase tables — composed deterministically from the date + sign
export const HOROSCOPE = {
    en: {
        themes: ['The day rewards a slow start.',
                 'Something small clicks into place before noon.',
                 'Your patience gets tested today — and noticed.',
                 'A conversation goes further than you planned.',
                 'An old routine feels tight; loosen one thread of it.',
                 'Energy comes in waves — ride the second one.',
                 'A detail everyone missed is yours to find.',
                 'The evening turns out better than the afternoon promises.',
                 'Someone quotes you back to yourself. Listen.',
                 'Luck hides in the errand you keep postponing.',
                 'A door you thought was closed turns out to be merely stuck.',
                 'Today runs on borrowed confidence — borrow generously.',
                 'The plan survives contact with the morning. Barely.',
                 'Someone is quietly grateful for you. They may even say so.',
                 'A small extravagance pays for itself in mood.',
                 'What you rehearse in the shower lands perfectly by evening.',
                 'The thing you almost cancel turns out to be the highlight.',
                 'Your timing is off by ten minutes all day — in your favor.',
                 'A borrowed idea works better in your hands.',
                 'The stars recommend finishing over starting today.',
                 'An answer arrives disguised as an interruption.',
                 'You are the calmest person in at least one room today.',
                 'A tiny repair — a button, a squeak, a typo — settles something bigger.',
                 'News from far away puts the day in proportion.',
                 'Your first instinct is right; your second guess is merely louder.',
                 'The day asks less of you than you packed for.',
                 'Something ordinary — bread, rain, a bus on time — feels briefly perfect.',
                 'A younger person teaches you something without noticing.',
                 'What goes sideways at noon rights itself by dinner.',
                 'You find the exact word on the first try. Spend it wisely.'],
        advice: ['say the kind thing out loud.',
                 'finish the smallest task first.',
                 'drink water before deciding anything.',
                 'let someone else pick the music.',
                 'write the idea down before it evaporates.',
                 'take the longer way home.',
                 'ask the question you think is too simple.',
                 'leave ten minutes earlier than feels necessary.',
                 'call instead of texting, just once.',
                 'tidy one surface, not the whole room.',
                 'say no early instead of maybe twice.',
                 'wear the good one — that is what it is for.',
                 'read one page before bed, not one feed.',
                 'thank someone for a thing they did long ago.',
                 'cook the simple dish you actually crave.',
                 'step outside between tasks, even for a minute.',
                 'let the phone charge in another room tonight.',
                 'trust the list you made yesterday.',
                 'fix the small annoying thing first.',
                 'give the compliment out loud, not in your head.',
                 'walk around the block before deciding.',
                 'save the difficult email as a draft until tomorrow.',
                 'share the last piece without being asked.',
                 'go to bed before the second wind.'],
    },
    ru: {
        themes: ['День вознаграждает неспешное начало.',
                 'Что-то маленькое встанет на место ещё до полудня.',
                 'Ваше терпение сегодня проверят — и заметят.',
                 'Разговор зайдёт дальше, чем вы планировали.',
                 'Старая привычка жмёт — ослабьте одну ниточку.',
                 'Силы приходят волнами — ловите вторую.',
                 'Деталь, которую все упустили, ждёт именно вас.',
                 'Вечер окажется лучше, чем обещает день.',
                 'Кто-то процитирует вам ваши же слова. Прислушайтесь.',
                 'Удача прячется в деле, которое вы всё откладываете.',
                 'Дверь, что казалась запертой, на самом деле просто заедает.',
                 'Сегодня день взятой взаймы уверенности — берите щедро.',
                 'План переживёт встречу с утром. Еле-еле.',
                 'Кто-то тихо вам благодарен. Может, даже скажет об этом.',
                 'Маленькая роскошь окупится настроением.',
                 'Отрепетированное в душе к вечеру прозвучит идеально.',
                 'То, что вы чуть не отменили, станет лучшей частью дня.',
                 'Весь день вы промахиваетесь минут на десять — в свою пользу.',
                 'Чужая идея в ваших руках заработает лучше.',
                 'Звёзды советуют сегодня заканчивать, а не начинать.',
                 'Ответ придёт под видом того, что вас отвлекло.',
                 'Сегодня вы — самый спокойный человек как минимум в одной комнате.',
                 'Мелкая починка — пуговица, скрип, опечатка — уладит что-то большее.',
                 'Новости издалека расставят день по местам.',
                 'Первое чутьё верно; вторая догадка просто громче.',
                 'День потребует меньше, чем вы для него собрали.',
                 'Что-то обычное — хлеб, дождь, автобус вовремя — на миг покажется идеальным.',
                 'Кто-то младше научит вас чему-то, сам того не заметив.',
                 'То, что пойдёт наперекосяк в полдень, к ужину выправится.',
                 'Точное слово найдётся с первой попытки. Потратьте его с умом.'],
        advice: ['скажите доброе вслух.',
                 'начните с самого маленького дела.',
                 'выпейте воды, прежде чем что-то решать.',
                 'пусть музыку выберет кто-то другой.',
                 'запишите идею, пока не испарилась.',
                 'вернитесь домой длинной дорогой.',
                 'задайте вопрос, который кажется слишком простым.',
                 'выйдите на десять минут раньше, чем кажется нужным.',
                 'позвоните вместо сообщения — хотя бы раз.',
                 'приберите одну поверхность, а не всю комнату.',
                 'скажите «нет» сразу вместо двух «может быть».',
                 'наденьте то самое, хорошее — оно для этого и лежит.',
                 'перед сном — одна страница, а не одна лента.',
                 'поблагодарите за давнее доброе дело.',
                 'приготовьте то простое, чего действительно хочется.',
                 'выходите на воздух между делами, хоть на минуту.',
                 'пусть телефон сегодня ночует в другой комнате.',
                 'доверьтесь вчерашнему списку.',
                 'сначала почините мелкое и раздражающее.',
                 'скажите комплимент вслух, а не про себя.',
                 'пройдитесь вокруг дома, прежде чем решать.',
                 'трудное письмо пусть полежит в черновиках до завтра.',
                 'поделитесь последним куском, не дожидаясь просьбы.',
                 'ложитесь до второго дыхания.'],
    },
};

/* ---------------- pure helpers ---------------- */

export const rnd = n => Math.floor(Math.random() * n);
export const pick = arr => arr[rnd(arr.length)];

export function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = rnd(i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function compatible(a, b) {
    return a.el === b.el || ELEMENTS[a.el].pair === b.el;
}

// every calendar day inside a sign's range, inclusive of both cusps
export function daysInRange(sign) {
    const days = [];
    let [m, d] = sign.from;
    for (;;) {
        days.push([m, d]);
        if (m === sign.to[0] && d === sign.to[1]) break;
        d++;
        if (d > DAYS_IN_MONTH[m]) { d = 1; m = m === 12 ? 1 : m + 1; }
    }
    return days;
}

// random birthday inside a sign's range, padded 1 day off each cusp —
// the game never deals a boundary date.
export function birthdayFor(sign) {
    return pick(daysInRange(sign).slice(1, -1));
}

// deterministic per (day, sign): same read all day, changes at midnight
export function mulberry32(a) {
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// seeds a sign-agnostic read for players who haven't picked a sign yet
export const GENERIC_SIGN = 12;

// today as a yyyymmdd integer, the seed's date component
export function todayYMD() {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

// One deterministic index bundle per (day, sign, year-theme version). The
// daily panel and the end-screen fortune both draw from it, so the two
// surfaces always agree; en/ru pools are length-matched, so the indices are
// language-independent.
export function dailyReadIndices(ymd, signId) {
    const rng = mulberry32(ymd * 31 + signId * 7 + YEAR_THEME.version * 1009);
    return {
        themeIdx: Math.floor(rng() * HOROSCOPE.en.themes.length),
        adviceIdx: Math.floor(rng() * HOROSCOPE.en.advice.length),
        sodId: Math.floor(rng() * 12),
        fortuneIdx: Math.floor(rng() * FORTUNES.en.length),
    };
}

/* ---------------- lang-aware formatting ---------------- */

// "Mar 21" / "21 мар"
export const fmtShort = (lang, m, d) => lang === 'ru' ? `${d} ${MONTHS_S.ru[m - 1]}` : `${MONTHS_S.en[m - 1]} ${d}`;
// "March 21" / "21 марта"
export const fmtFull = (lang, m, d) => lang === 'ru' ? `${d} ${MONTHS_F.ru[m - 1]}` : `${MONTHS_F.en[m - 1]} ${d}`;
export const rangeShort = (lang, s) => `${fmtShort(lang, s.from[0], s.from[1])} – ${fmtShort(lang, s.to[0], s.to[1])}`;

export const nameOf = (s, lang) => s.name[lang];
export const elLabel = (el, lang) => ELEMENTS[el].label[lang];
export const elSpan = (el, lang) => `<span class="${ELEMENTS[el].cls}">${elLabel(el, lang)}</span>`;
