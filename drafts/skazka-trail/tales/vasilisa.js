/*
 * Skazka Trail — content pack: Vasilisa the Beautiful (Baba Yaga).
 *
 * Pure data + small pure functions — no engine logic lives here (Q10).
 * Faithful to the Afanasyev-collected tale; kept real per Q6, including the
 * dark branch. "The Price of Prying" (ending_prying) is a game-original
 * extrapolation — Vasilisa never actually asks the forbidden question in the
 * standard collected text — but it plays straight a warning Baba Yaga speaks
 * in the source itself ("those who ask too much don't get to leave"), the
 * same way the concept doc's Morozko sketch flagged its own added "Mercy"
 * middle path as consistent-but-not-canonical.
 */
(function (global) {
  'use strict';

  var nodes = {
    intro: {
      log: 'Her mother’s death, and the doll',
      text:
        'Once, in a house at the edge of a birch wood, a merchant’s wife lay dying. She called her small daughter to her bed and pressed a little doll into her hands.\n\n' +
        '“Keep her in your pocket,” she whispered, “and tell no one you have her. When you are in trouble, give her a little to eat, a little to drink, and ask her advice — she will tell you what to do.”\n\n' +
        'Then she died, and the merchant grieved a long while before he married again.',
      choices: [{ label: 'Continue', next: 'sentForFire' }]
    },

    sentForFire: {
      log: 'Sent into the forest for fire',
      text:
        'The new wife had two daughters of her own, and all three despised Vasilisa for being lovelier than any of them. They gave her the hardest work, the coldest corner, the last of the bread — hoping the sun and the wind would spoil her looks. Each night, in secret, Vasilisa fed her doll a crust and a sip, and by morning the impossible chores were somehow already done.\n\n' +
        'Then the merchant went off on business, and the stepmother moved the household to a cottage at the very edge of the forest — closer, she said, than any decent woman ought to live, to the hut of Baba Yaga.\n\n' +
        'One evening, as if by design, every flame in the house went out at once. “No light, no fire,” the stepmother said, smiling into the dark. “Vasilisa, go to Baba Yaga’s and beg an ember. Don’t come back without one.” She meant, everyone understood, that Vasilisa shouldn’t come back at all.',
      choices: [{ label: 'Take the doll, and go', next: 'rider_white' }]
    },

    rider_white: {
      log: 'The White Rider, at dawn',
      text:
        'Vasilisa walked into the darkening wood, the doll a small warm weight in her pocket. Near dawn on the second day, a rider passed her on the path — white from helm to horse to cloak, and where he rode, the black night thinned into gray.\n\n' +
        'Something in her, without being told, knew him: the White Rider. Bright Day.',
      choices: [
        { label: 'Stop and watch him pass', next: 'rider_red', delta: { curiosity: 1 } },
        { label: 'Hurry on, eyes on the path', next: 'rider_red' }
      ]
    },

    rider_red: {
      log: 'The Red Rider, at sunrise',
      text:
        'By midmorning a second rider overtook her — red as a coal, red horse, red cloak — and the gray sky kindled into full daylight where he passed.\n\n' +
        'The Red Rider. The Sun.',
      choices: [
        { label: 'Stop and watch him pass', next: 'rider_black', delta: { curiosity: 1 } },
        { label: 'Hurry on, eyes on the path', next: 'rider_black' }
      ]
    },

    rider_black: {
      log: 'The Black Rider, at the gate',
      text:
        'She reached the fence at dusk — bones for posts, skulls for lanterns, their eye-sockets already beginning to glow. A third rider caught her there at the gate: black horse, black rider, black cloak, and full night closed over the yard behind him like a door swinging shut.\n\n' +
        'The hut inside stood on chicken legs, turning slowly. Waiting.',
      choices: [
        { label: 'Stop and watch him pass', next: 'arrival', delta: { curiosity: 1 } },
        { label: 'Hurry to the gate, eyes down', next: 'arrival' }
      ]
    },

    arrival: {
      log: 'Baba Yaga names her price',
      text:
        'Baba Yaga was home — iron teeth, a nose that nearly brushed the low ceiling, and eyes that took Vasilisa apart and put her back together in a single glance.\n\n' +
        '“Sent for fire, were you? Fire isn’t free, girl. Serve me a day and a night — sort my grain, cook my supper, sweep my yard — and we’ll see if you’ve earned an ember. Fail, and I’ll finish my supper with you in it.”',
      choices: [{ label: 'Agree — there is no other way home', next: 'chore_grain' }]
    },

    chore_grain: {
      log: 'The first chore: sorting the grain',
      text:
        'She left Vasilisa a mountain on the floor — good grain and rotten, wheat and black weed-seed, all poured together — to be sorted clean before her return. It would take a grown woman a week.',
      choices: [
        { label: 'Kneel down and start sorting, grain by grain, alone', next: 'chore_cook' },
        { label: 'Slip into the corner, feed the doll a crumb, and whisper for help', next: 'chore_cook', delta: { dollHelp: 1 } }
      ]
    },

    chore_cook: {
      log: 'The second chore: cooking the supper',
      text:
        'Next: Baba Yaga’s supper to cook and the table to lay before she returned hungry — and hungry, everyone in that forest knew, meant something particular when Baba Yaga said it.',
      choices: [
        { label: 'Light the stove and cook it yourself, alone', next: 'chore_clean' },
        { label: 'Feed the doll again, and ask her help', next: 'chore_clean', delta: { dollHelp: 1 } }
      ]
    },

    chore_clean: {
      log: 'The third chore: the sweeping',
      text:
        'Last: the hut swept, the yard scrubbed, the woodpile stacked to the eaves — a night’s work stretched thin over what remained of the night.',
      choices: [
        { label: 'Take the broom yourself and finish it alone', next: 'qanda_riders' },
        { label: 'Ask the doll, one last time, for help', next: 'qanda_riders', delta: { dollHelp: 1 } }
      ]
    },

    qanda_riders: {
      log: 'Baba Yaga permits one question',
      text:
        'By morning every grain was sorted, the table was laid, the yard swept bare. Baba Yaga circled it all twice, found nothing to complain of, and looked at Vasilisa sideways.\n\n' +
        '“You’ve a tongue, I suppose. Ask, if you’re going to — I don’t care for a guest who only stares.”',
      choices: [
        { label: 'Ask about the three riders on the road', next: 'qanda_riders_answer' },
        { label: 'Say nothing. Thank her, and wait.', next: 'qanda_silent' },
        {
          label: 'Ask about the pairs of hands that move about your yard on their own',
          next: 'qanda_forbidden',
          delta: { askedForbidden: true },
          when: function (flags) { return (flags.curiosity || 0) >= 2; }
        }
      ]
    },

    qanda_riders_answer: {
      log: 'Asked about the Riders — answered plainly',
      text:
        'Baba Yaga sniffed, unimpressed by the question but willing enough to answer it. “The white one is my bright Day. The red one, my red Sun. The black one, my dark Night. All three serve me, and none of them will ever harm you — you’ve seen only what I allow to be seen.”',
      choices: [{ label: 'Continue', next: 'qanda_final' }]
    },

    qanda_silent: {
      log: 'Asked nothing — stayed silent',
      text:
        'Vasilisa bowed her head and said nothing at all. Baba Yaga’s mouth twitched — not quite a smile. “Sensible,” she said, “for a change.”',
      choices: [{ label: 'Continue', next: 'qanda_final' }]
    },

    qanda_forbidden: {
      log: 'Asked about the disembodied hands — a forbidden question',
      text:
        'Vasilisa asked. The yard went very quiet. Baba Yaga’s smile did not move, but something behind her eyes did.\n\n' +
        '“I do not answer for what happens inside my own fence,” she said, each word set down like a stone. “Those who ask after things that aren’t theirs to know have a way of growing old before their time — or not growing old at all. Best you’d learned that at the gate.”',
      choices: [{ label: 'Continue', next: 'ending_prying' }]
    },

    qanda_final: {
      log: 'Baba Yaga demands to know how the chores were finished',
      text: function (flags) {
        if ((flags.dollHelp || 0) >= 1) {
          return 'Baba Yaga’s eyes narrowed. “No living hands finish my work that fast without help,” she said. “Something in this yard helped you. Tell me what.”';
        }
        return 'Baba Yaga looked at her a long moment. “Grain by grain, with your own two hands, in one night,” she said, half to herself. “I didn’t think that was possible for anyone breathing. How did you manage it?”';
      },
      choices: [
        { label: 'Answer honestly: “My mother’s blessing helps me.”', next: 'ending_blessing', delta: { answeredHonestly: true } },
        { label: 'Answer evasively: “Only my own two hands.”', next: 'ending_bargain', delta: { answeredHonestly: false } }
      ]
    },

    ending_blessing: {
      ending: true,
      title: 'Blessing’s Fire',
      moral: 'Quiet competence and an honest tongue outlast a house built on cruelty — even when the honesty is what finally drives you out the door.',
      text:
        'The word landed on Baba Yaga like a slap. “Blessed,” she spat, backing away a step, her iron teeth suddenly bared at nothing. “Blessed things don’t sit easy under my roof. Take your fire and go, and don’t come back with it burned out.”\n\n' +
        'She thrust a skull on a stick into Vasilisa’s hands, its eye-sockets already kindling, and shut the door before the last word was even out.\n\n' +
        'Vasilisa carried it home through the whole dark wood without once looking back at the glow. In the cottage at the forest’s edge, the stepmother and her daughters had sat up three nights waiting, dreading, hoping — and when the skull’s eyes finally found them across the room, they could not look away, and by morning there was nothing left of them to bury.\n\n' +
        'Vasilisa buried the skull at a crossroads instead, and went hungry, or unloved, never again.',
      choices: []
    },

    ending_bargain: {
      ending: true,
      title: 'The Bargain Kept',
      moral: 'A bargain kept is still kept, even on a lie — but something that only answers to the truth doesn’t stay for less.',
      text:
        'Baba Yaga heard the lie for exactly what it was and didn’t trouble herself to argue with it. “Your own two hands,” she repeated, flat as a stone. “Have it your way. A bargain’s a bargain, and you’ve kept your side of it, whatever you’re not telling me.”\n\n' +
        'She handed over the fire without ceremony — a skull on a stick, its eyes already lit, no blessing, no warmth in the giving of it.\n\n' +
        'It still did what fire like that does. The stepmother and her daughters sat up three nights waiting for Vasilisa never to return, and when she did, and the skull’s eyes found them, morning came the same as it would have anyway.\n\n' +
        'But that last night, when Vasilisa reached into her pocket for the doll — to thank her, to feed her one last crumb out of habit — the doll lay still, and stayed still every night after. Whatever had listened before wasn’t listening anymore.',
      choices: []
    },

    ending_prying: {
      ending: true,
      title: 'The Price of Prying',
      moral: 'Even a guest who has earned her keep can still ask her way into a debt no chore repays. Know which door not to open.',
      text:
        'Baba Yaga did not raise her voice, and she did not need to. There are debts a night’s chores cannot pay once a guest has asked the one question a house like hers was built to punish.\n\n' +
        'No ember went back to the cottage at the forest’s edge that night, and no Vasilisa went with it. The fence gained one more skull before winter, its eye-sockets, like all the others, beginning — after a while — to glow.',
      choices: []
    }
  };

  global.SKAZKA_TALES = global.SKAZKA_TALES || {};
  global.SKAZKA_TALES.vasilisa = {
    id: 'vasilisa',
    title: 'Vasilisa the Beautiful',
    subtitle: 'a tale of Baba Yaga',
    start: 'intro',
    flags: { dollHelp: 0, curiosity: 0, askedForbidden: false, answeredHonestly: false },
    nodes: nodes
  };
})(window);
