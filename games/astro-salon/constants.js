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
                 'Luck hides in the errand you keep postponing.'],
        advice: ['say the kind thing out loud.',
                 'finish the smallest task first.',
                 'drink water before deciding anything.',
                 'let someone else pick the music.',
                 'write the idea down before it evaporates.',
                 'take the longer way home.',
                 'ask the question you think is too simple.',
                 'leave ten minutes earlier than feels necessary.'],
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
                 'Удача прячется в деле, которое вы всё откладываете.'],
        advice: ['скажите доброе вслух.',
                 'начните с самого маленького дела.',
                 'выпейте воды, прежде чем что-то решать.',
                 'пусть музыку выберет кто-то другой.',
                 'запишите идею, пока не испарилась.',
                 'вернитесь домой длинной дорогой.',
                 'задайте вопрос, который кажется слишком простым.',
                 'выйдите на десять минут раньше, чем кажется нужным.'],
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

/* ---------------- lang-aware formatting ---------------- */

// "Mar 21" / "21 мар"
export const fmtShort = (lang, m, d) => lang === 'ru' ? `${d} ${MONTHS_S.ru[m - 1]}` : `${MONTHS_S.en[m - 1]} ${d}`;
// "March 21" / "21 марта"
export const fmtFull = (lang, m, d) => lang === 'ru' ? `${d} ${MONTHS_F.ru[m - 1]}` : `${MONTHS_F.en[m - 1]} ${d}`;
export const rangeShort = (lang, s) => `${fmtShort(lang, s.from[0], s.from[1])} – ${fmtShort(lang, s.to[0], s.to[1])}`;

export const nameOf = (s, lang) => s.name[lang];
export const elLabel = (el, lang) => ELEMENTS[el].label[lang];
export const elSpan = (el, lang) => `<span class="${ELEMENTS[el].cls}">${elLabel(el, lang)}</span>`;
