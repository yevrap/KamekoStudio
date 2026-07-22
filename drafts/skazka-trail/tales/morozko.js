/*
 * Skazka Trail — content pack: Morozko (Father Frost).
 *
 * Pure data + small pure functions — no engine logic lives here (Q10).
 * The source tale is an almost-binary branch (patient stepdaughter rewarded,
 * rudeness punished); this pack tracks a single accumulated `patience` flag
 * (0–3) across three rising-cold trials and routes to one of three endings
 * on the total, not the last click.
 *
 * "Mercy" (ending_mercy, 1–2/3) is a game-original middle path — the
 * collected tale is a clean binary (warm and patient throughout, or not) —
 * added for a mixed run's sake per Q5, the same way Vasilisa's
 * "The Price of Prying" flagged its own non-canonical addition.
 * "The Silence" (ending_silence, 0/3) is the tale's own canonical dark
 * ending, kept real per Q6 — she freezes.
 *
 * The three-way branch at `resolution` is done with mutually exclusive
 * `when` guards on otherwise-identical "Continue" choices — no engine
 * change needed; the engine already supports conditional choice visibility
 * (see Vasilisa's qanda_riders forbidden-question gate).
 */
(function (global) {
  'use strict';

  var nodes = {
    intro: {
      log: 'A stepmother’s house, and no love in it',
      text:
        'In a cottage at the edge of a great pine forest lived an old man, his second wife, and two daughters — his own, by his first wife, gentle and quick to work without being asked, and his wife’s, by her own first marriage, spoiled and quick to complain about everything asked of her.\n\n' +
        'The stepmother could not look at her husband’s daughter without envy, for the girl was kind where her own daughter was not, and the comparison did neither of them any favors in that house. So the stepmother set herself, day by day, to making the girl’s life as cold and as hard as she could arrange it.\n\n' +
        'That winter, she decided cold and hard weren’t nearly enough.',
      choices: [{ label: 'Continue', next: 'sentToForest' }]
    },

    sentToForest: {
      log: 'Left beneath the fir, in the snow',
      text:
        '“Take your daughter out to the forest,” the stepmother told the old man one white morning, “and leave her there.” He wept and argued, but he had never once in the marriage won an argument with his wife, and this one went the same way as all the others.\n\n' +
        'He drove the girl out past where the road stopped being a road, sat her down in the snow at the foot of a great fir tree, kissed her forehead, and turned the sledge around before he could change his mind. She listened to the runners creak away into the trees, and then there was only the wind, and the fir above her, and the cold settling in to stay.',
      choices: [{ label: 'Wait, alone in the snow', next: 'trial1' }]
    },

    trial1: {
      log: 'Morozko, at a distance, asks if she is warm',
      text:
        'Somewhere off in the white, something began to crackle — sharp little snaps, like green wood in a fire, moving closer tree by tree. The girl looked up and found him: an old man no taller than the drifts, hopping from branch to branch, his beard a rope of ice, his coat the blue-white of a frozen lake.\n\n' +
        'He settled into the nearest fir and looked down at her.\n\n' +
        '“Are you warm, maiden?”',
      choices: [
        { label: '“Warm, dear Frost — quite warm,” she said.', next: 'trial2', delta: { patience: 1 } },
        { label: '“I’m freezing. I can hardly feel my hands,” she admitted.', next: 'trial2' },
        { label: 'She said nothing at all, and only bowed her head.', next: 'trial2' }
      ]
    },

    trial2: {
      log: 'Morozko draws nearer, the cold sharper now',
      text:
        'The crackling came again, closer, sharper — Morozko dropped from his tree into the next one over, near enough now that the girl could see frost building on her own eyelashes when she blinked. The cold had a weight to it, pressing rather than biting.\n\n' +
        '“Are you warm, maiden?” he asked again.',
      choices: [
        { label: '“Warm, Grandfather Frost — truly warm,” she said, though her voice had begun to shake.', next: 'trial3', delta: { patience: 1 } },
        { label: '“It’s colder now. I don’t know how much more of this I can bear,” she said.', next: 'trial3' },
        { label: 'She bowed again, silent, her teeth starting to chatter.', next: 'trial3' }
      ]
    },

    trial3: {
      log: 'Morozko beside her — the third and coldest asking',
      text:
        'He came down into the branches directly above her this time, close enough that the crackling was almost a voice of its own, and the cold with him had stopped being a feeling and become simply a fact. The girl’s hands had gone from aching to strangely calm, which she understood, distantly, was not a good sign.\n\n' +
        '“Are you warm, maiden?” Morozko asked a third time, and waited.',
      choices: [
        { label: '“Warm, dear Frost,” she said, so quietly it was almost only breath. “You are kind to keep asking.”', next: 'resolution', delta: { patience: 1 } },
        { label: '“I’m so cold. Please — no more,” she said.', next: 'resolution' },
        { label: 'She only bowed once more and said nothing, though her lips had gone the color of the snow.', next: 'resolution' }
      ]
    },

    resolution: {
      log: 'Morozko falls silent, weighing the answers',
      text:
        'Morozko went still on his branch, the crackling stopped, and for a long moment there was no sound at all — not the wind, not the girl’s own breathing, which she could no longer quite feel. Somewhere above her, ice groaned once in the fir and settled.',
      choices: [
        { label: 'Continue', next: 'ending_gift', when: function (flags) { return (flags.patience || 0) === 3; } },
        { label: 'Continue', next: 'ending_mercy', when: function (flags) { return (flags.patience || 0) >= 1 && (flags.patience || 0) <= 2; } },
        { label: 'Continue', next: 'ending_silence', when: function (flags) { return (flags.patience || 0) === 0; } }
      ]
    },

    ending_gift: {
      ending: true,
      title: 'The Gift',
      moral: 'Patience that asks for nothing is the only kind the old stories ever really reward.',
      text:
        'Morozko laughed — a sound like ice cracking apart in springtime, not unkind at all — and dropped from the tree beside her. “Three times warm,” he said, “three times patient, and not one complaint in it. That’s rare enough, these days, that I mean to pay for it properly.”\n\n' +
        'He shrugged off his own coat of frost-blue fur and settled it around her shoulders, and it was warm, impossibly, immediately warm, the way nothing in that forest had any right to be. Then he snapped his fingers, and a sledge appeared piled with chests — silver plate, strings of pearls, cloth finer than anything the house had ever owned — and drove her home himself, the runners silent on the snow.\n\n' +
        'Her father wept a second time that day, this time from relief. Her stepmother, watching chest after chest carried in through the door, said nothing at all — for once in her life, with nothing to say.',
      choices: []
    },

    ending_mercy: {
      ending: true,
      title: 'Mercy',
      moral: 'Not every kindness earns a fortune — some earn only the chance to go home, which, in that forest, was never nothing.',
      text:
        'Morozko was quiet a while, turning her answers over the way a jeweler turns a stone. “Patient enough,” he said at last, “but not patient all the way through — a slip here, a complaint there. I’ve frozen girls for less. I’ve also gifted girls for less. You’re neither, quite.”\n\n' +
        'He didn’t offer his coat, and no sledge of treasure appeared. But he did lift her out of the drift with hands that, for once, weren’t cold at all, set her on the road home, and pointed the way. “Go on, then,” he said. “Warm yourself by your own fire this time — you’ve earned that much, at least.”\n\n' +
        'She walked home alone, cold and empty-handed and entirely, gratefully alive, and let herself in before the stepmother had even noticed she was gone.',
      choices: []
    },

    ending_silence: {
      ending: true,
      title: 'The Silence',
      moral: 'The forest asks the same question three times not to be polite, but because it means to be answered.',
      text:
        'Morozko waited a moment longer, as if giving her one more chance to say something different, but the moment passed the way all moments in that forest eventually did — into more cold, and then into no cold at all, which is a far worse sign than any amount of cold.\n\n' +
        'By the time her father worked up the courage to drive back out for her — three days later, and only because the guilt finally outweighed his wife’s temper — he found her sitting exactly where he had left her, back against the fir, quite still, entirely at peace at last with a question she had never once answered the way the forest wanted to hear.\n\n' +
        'He carried her home himself, and said nothing to his wife that needed saying — the empty seat beside him on the sledge said all of it.',
      choices: []
    }
  };

  global.SKAZKA_TALES = global.SKAZKA_TALES || {};
  global.SKAZKA_TALES.morozko = {
    id: 'morozko',
    title: 'Morozko',
    subtitle: 'a tale of Father Frost',
    start: 'intro',
    flags: { patience: 0 },
    nodes: nodes
  };
})(window);
