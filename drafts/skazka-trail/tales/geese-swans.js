/*
 * Skazka Trail — content pack: The Geese-Swans.
 *
 * Pure data + small pure functions — no engine logic lives here (Q10).
 * Third tale, picked fresh per Q9=C once the first two shipped. Vasilisa
 * proved task-trial branching plus a threshold that *unlocks a new option*
 * (curiosity gating the forbidden question); Morozko proved a single
 * accumulated flag driving a near-binary ending split. Neither exercised a
 * flag set early silently changing the *outcome* of an identical-looking
 * choice much later — which is the entire shape of this tale: refuse the
 * stove/tree/river on the way out, and the same three offers return on the
 * way back, this time as the difference between getting hidden from the
 * geese-swans or not.
 *
 * Three independent booleans (kindStove/kindTree/kindRiver) are set on the
 * outbound leg. The return leg doesn't re-branch the story graph — each
 * return node's *text* varies on its matching flag (the same pattern as
 * Vasilisa's dollHelp flavor-text), so the consequence is felt at each
 * beat, not just retold after the fact. The real structural fork is at
 * `resolution`, which sums the three flags and routes to one of three
 * endings via mutually exclusive `when` guards — the same mechanism
 * Morozko's `resolution` already uses, just on a summed total instead of
 * a single incrementing counter. No engine change needed either way.
 *
 * "A Near Thing" (ending_near, 1–2/3) is a game-original middle path, same
 * rationale as Morozko's "Mercy" — the collected tale is a clean binary
 * (help everyone and make it home, or help no one and lose your brother).
 * "Lost to the Geese" (ending_lost, 0/3) plays the tale's own warning
 * straight and unsoftened, kept real per Q6.
 */
(function (global) {
  'use strict';

  function kindnessTotal(flags) {
    return (flags.kindStove ? 1 : 0) + (flags.kindTree ? 1 : 0) + (flags.kindRiver ? 1 : 0);
  }

  var nodes = {
    intro: {
      log: 'Left in charge, and the whole day still ahead',
      text:
        'Her mother and father were going into the village for the day — market, a debt to settle, a cousin to see — and before the cart had even finished loading, her mother took her by both shoulders and said the only thing that mattered: “Watch your brother. Don’t let him out of your sight, not for a moment, not for anything.”\n\n' +
        'She promised, the way you promise things you fully intend to keep and then don’t — not out of malice, just out of being young on a warm morning with the whole day still ahead of her and nothing in it yet.\n\n' +
        'The cart creaked off down the road, and for a while she really did watch him — sat him in the yard with his wooden toys, checked on him every few minutes, did everything right.',
      choices: [{ label: 'Continue', next: 'distracted' }]
    },

    distracted: {
      log: 'Friends at the fence, and the yard goes quiet',
      text:
        'Then some friends came by the fence with news of a wedding two houses down, and the news was good, and there was a great deal of it, and she turned to listen properly — just for a minute, just to hear how it ended.\n\n' +
        'It was more than a minute. When she turned back, the yard had gone quiet in a way yards are not supposed to go quiet, and her brother’s toys sat scattered in the dirt with no brother sitting among them.\n\n' +
        'She found the answer soon enough, looking up: two grey shapes wheeling higher and higher over the treeline, and between them, small and already too far to call to, a third shape that was unmistakably him. The geese-swans of the old stories — she had never quite believed the old stories — carried him off toward the dark line of the forest at the edge of the world, and were gone.',
      choices: [{ label: 'Continue', next: 'setOut' }]
    },

    setOut: {
      log: 'After them, with nothing but her own two feet',
      text:
        'She did not stop to think, which was probably a mistake, and did not go back for help, which was certainly one, and simply ran — out the gate, past the fence, past the last house at the edge of the village, into country she had never before had reason to walk.\n\n' +
        'The geese-swans belonged to Baba Yaga, everyone knew that much even from stories they did not quite believe; and everyone knew, too, that her hut stood somewhere past the birches, on legs that let it get up and walk when it pleased her. She had no plan beyond finding it. She ran anyway.',
      choices: [{ label: 'Continue', next: 'outStove' }]
    },

    outStove: {
      log: 'A stove in a clearing, offering rye pies',
      text:
        'Not far past the treeline stood a stove, entirely alone in a clearing with no house around it, its fire lit and its little door standing open on a rack of fresh rye pies, the smell of them thick enough to taste from three trees away. “Girl,” it said, in the low, banked voice stoves apparently have when they choose to use it, “eat one of my pies, and I will tell you which way they went.”\n\n' +
        'She had, by every measure that mattered to her just then, no time at all to lose.',
      choices: [
        { label: 'Stop, eat the pie, and thank the stove properly', next: 'outTree', delta: { kindStove: true }, log: 'Stopped, ate the stove’s pie, and thanked it' },
        { label: '“No time for pies” — wave it off and keep running', next: 'outTree', log: 'Waved off the stove and ran on' }
      ]
    },

    outTree: {
      log: 'An apple tree, heavy with fruit, asks the same of her',
      text:
        'A little farther on, an old apple tree stood bent nearly double under its own fruit, more apples on it than the branches looked able to hold. “Girl,” it said, “shake loose one of my apples and eat it, and I will tell you which way they went.”\n\n' +
        'The geese were long out of sight by now. Stopping felt like losing ground she could not afford to lose.',
      choices: [
        { label: 'Stop, eat an apple, and thank the tree properly', next: 'outRiver', delta: { kindTree: true }, log: 'Stopped, ate the tree’s apple, and thanked it' },
        { label: 'Shake her head and keep running', next: 'outRiver', log: 'Shook her head at the tree and ran on' }
      ]
    },

    outRiver: {
      log: 'A river offers kissel and cream, the last of the three',
      text:
        'At last she came to a river, running slow and milk-pale between banks lined with kissel and cream instead of mud, which she understood, by now, was simply how this stretch of forest worked. “Girl,” said the river, in a voice like water over stones, “drink from me, and I will tell you which way they went.”\n\n' +
        'She was out of breath, and further from home than she had ever been, and no closer to her brother than when she started.',
      choices: [
        { label: 'Kneel, drink, and thank the river properly', next: 'hutScene', delta: { kindRiver: true }, log: 'Knelt, drank from the river, and thanked it' },
        { label: 'Press on without stopping', next: 'hutScene', log: 'Pressed past the river without stopping' }
      ]
    },

    hutScene: {
      log: 'Baba Yaga’s hut, and a brother among golden apples',
      text:
        'She found the hut exactly where the stories said it would be — turning slowly on its two chicken legs in a yard fenced with something she chose very deliberately not to look at closely — and inside, through a gap in the fence, her brother sat entirely unharmed, playing with a set of golden apples someone had given him to keep him occupied and quiet.\n\n' +
        'A little mouse paused at her foot, whiskers working. “She has only stepped out,” it said, in the businesslike tone of a creature that has seen this exact situation before. “She eats children who take too long. You should not take too long.”\n\n' +
        'She did not take too long. She was over the fence, her brother scooped up mid-giggle, and moving before the mouse had quite finished the sentence.',
      choices: [{ label: 'Continue', next: 'chaseBegins' }]
    },

    chaseBegins: {
      log: 'Baba Yaga returns, and sends the geese after them',
      text:
        'They were most of the way back through the birches when a shriek went up behind them — thin, furious, entirely unlike anything a person ought to be able to produce — as Baba Yaga discovered an empty yard and drew exactly the right conclusion.\n\n' +
        'The geese-swans went up off the roof of the hut in a single grey sheet and came after them low over the treetops, faster by a great deal than two children running on foot ever could be. She took her brother’s hand and ran anyway, back the way she had come, because it was the only way she knew.',
      choices: [{ label: 'Continue', next: 'backRiver' }]
    },

    backRiver: {
      log: 'The river, again — this time she needs it',
      text: function (flags) {
        var base = 'The river came into view first, the geese close enough now that she could hear the particular sound their wings made, which was worse than any sound she had imagined on the way out. She dropped to her knees at the bank, her brother beside her, and begged: “Hide us. Please, hide us.”\n\n';
        if (flags.kindRiver) {
          return base + 'The river did not hesitate. It rose up in a long pale curtain between them and the sky, mist and spray and slow water all at once, and the geese wheeled twice overhead and found nothing beneath them but a river being a river, same as always.';
        }
        return base + 'The river was slow to answer — not unkind, exactly, just in no particular hurry to trouble itself on behalf of a girl who had not troubled herself for it — and by the time it stirred at all, the geese had already had one long, clear look at both of them before losing the thread and wheeling off to search the wrong bend.';
      },
      choices: [{ label: 'Continue', next: 'backTree' }]
    },

    backTree: {
      log: 'The apple tree, again — a place to hide, if it will have her',
      text: function (flags) {
        var base = 'The apple tree was next, still bent low with fruit, and she pressed herself and her brother in against its trunk, low among the heaviest branches, and asked it, with what breath she had left, to hide them a while.\n\n';
        if (flags.kindTree) {
          return base + 'The tree dropped its branches around them like a curtain of its own, apples and leaves both, thick enough that daylight barely came through, and the geese passed directly overhead twice without so much as slowing.';
        }
        return base + 'The tree only rustled, the way trees do in any ordinary wind, offering neither branch nor apple in her defense, and she and her brother had to duck and scramble and hope on their own account — which worked, this time, but only barely.';
      },
      choices: [{ label: 'Continue', next: 'backStove' }]
    },

    backStove: {
      log: 'The stove, last of the three, and closest to home',
      text: function (flags) {
        var base = 'The stove stood where she had left it, fire still lit, and this time she did not hesitate to ask it outright: “Hide us, please — they are right behind us.”\n\n';
        if (flags.kindStove) {
          return base + 'The stove opened its door wide and warm and let them both climb inside, pulling it shut behind them with a soft clang, and the geese-swans circled the clearing twice, found a stove and nothing else, and gave up the chase at last, turning back toward the dark line of the forest.';
        }
        return base + 'The stove’s door stayed exactly as it was, neither open nor especially interested, and she and her brother had to duck behind it instead and hold entirely still and hope, which cost them a very long, very frightening minute before the geese finally lost interest and turned back.';
      },
      choices: [{ label: 'Continue', next: 'resolution' }]
    },

    resolution: {
      log: 'Home in sight, and the account finally settled',
      text:
        'The village came into view at last, ordinary and unchanged, as if none of it had happened at all — which, for the two of them, was very much the point.',
      choices: [
        { label: 'Continue', next: 'ending_debts', when: function (flags) { return kindnessTotal(flags) === 3; } },
        { label: 'Continue', next: 'ending_near', when: function (flags) { return kindnessTotal(flags) >= 1 && kindnessTotal(flags) <= 2; } },
        { label: 'Continue', next: 'ending_lost', when: function (flags) { return kindnessTotal(flags) === 0; } }
      ]
    },

    ending_debts: {
      ending: true,
      title: 'The Debts Repaid',
      moral: 'The kindness you spend on strangers is never really spent — only put by, waiting for the day you need it back.',
      text:
        'They walked the last stretch home hand in hand, entirely unremarkable to look at — a girl and her small brother, a little travel-worn, nothing more — and no one they passed had the faintest idea what the two of them had just come through, or how close it had run.\n\n' +
        'Her parents were home before them after all, the cart back from the village, the debt settled, the cousin visited, and there was a great deal of explaining to do that she did not do especially well, but her brother was whole and warm and, within the hour, back to being exactly as much trouble as he had always been.\n\n' +
        'She never told the stove, the tree, or the river what it had cost her to eat and drink and stop when she had no time to spare. She had a feeling, somehow, that they already knew.',
      choices: []
    },

    ending_near: {
      ending: true,
      title: 'A Near Thing',
      moral: 'Half a debt paid is half a debt collected — you get home, but you feel every step of it.',
      text:
        'They made it back — that much held — but it was closer than it should have been, closer than she would ever quite admit to her parents, who noticed only that both children came home pale, breathless, and unwilling to discuss their afternoon in any detail whatsoever.\n\n' +
        'She thought about the stove and the tree and the river more than once in the weeks after, and about which of them had helped without hesitation and which had made her wait, and she noticed, without being able to prove it to anyone, that it lined up rather exactly with which of them she had troubled herself for on the way out.\n\n' +
        'Her brother, for his part, remembered almost none of it, and grew up entirely convinced that the whole afternoon had simply been a very long, very strange game.',
      choices: []
    },

    ending_lost: {
      ending: true,
      title: 'Lost to the Geese',
      moral: 'Pride pays no one back, and the story has never once pretended otherwise.',
      text:
        'None of the three would help her — not the stove, not the tree, not the river, each of them perfectly polite about it, each of them in absolutely no hurry — and the geese-swans, given three clear chances to find them, took the third.\n\n' +
        'They caught her brother up out of her very arms at the river’s edge and were gone with him back over the birches before she had finished reaching after him, and Baba Yaga’s hut, when she finally reached it again, stood shut and silent and in no mood to open for a girl who came empty-handed, with nothing to offer anyone, least of all now.\n\n' +
        'She walked home alone in the end, and told her parents everything, and none of it brought him back. The village still tells this one as a story about geese. She has always known better about what it was really about.',
      choices: []
    }
  };

  global.SKAZKA_TALES = global.SKAZKA_TALES || {};
  global.SKAZKA_TALES['geese-swans'] = {
    id: 'geese-swans',
    title: 'The Geese-Swans',
    subtitle: 'a tale of the geese-swans',
    start: 'intro',
    flags: { kindStove: false, kindTree: false, kindRiver: false },
    nodes: nodes
  };
})(window);
