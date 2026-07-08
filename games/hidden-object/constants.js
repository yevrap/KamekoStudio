export const ROUND_DURATION = 20000;
export const BASE_SPEED_MULTIPLIER = 0.0001;
export const SPEED_INCREMENT_PER_ROUND = 0.00005;
export const INITIAL_SPEED_FACTOR = 1.5;
export const MIN_SPEED_AFTER_COLLISION = 0.00005;
export const BLINK_INTERVAL_VISIBLE_BASE = 1500; // ms
export const BLINK_INTERVAL_INVISIBLE_BASE = 700; // ms (Rounds 10-14)
export const BLINK_INTERVAL_INVISIBLE_LONG = 1500; // ms (Rounds 15+)

export const allPossibleItems = [
    { name: "Key", emoji: "🔑" }, { name: "Star", emoji: "⭐" }, { name: "Apple", emoji: "🍎" },
    { name: "Balloon", emoji: "🎈" }, { name: "Diamond", emoji: "💎" }, { name: "Books", emoji: "📚" },
    { name: "Clock", emoji: "⏰" }, { name: "Mushroom", emoji: "🍄" }, { name: "Rainbow", emoji: "🌈" },
    { name: "Lightbulb", emoji: "💡" }, { name: "Soccer Ball", emoji: "⚽" }, { name: "Gift Box", emoji: "🎁" },
    { name: "Pizza", emoji: "🍕" }, { name: "Rocket", emoji: "🚀" }, { name: "Glasses", emoji: "👓" },
    { name: "Camera", emoji: "📷" }, { name: "Trophy", emoji: "🏆" }, { name: "Paint Palette", emoji: "🎨" },
    { name: "Microscope", emoji: "🔬" }, { name: "Anchor", emoji: "⚓" }, { name: "Alien", emoji: "👽" },
    { name: "Robot", emoji: "🤖" }, { name: "Ghost", emoji: "👻" }, { name: "Cactus", emoji: "🌵" },
    { name: "Pineapple", emoji: "🍍" }, { name: "Unicorn", emoji: "🦄" }, { name: "Bicycle", emoji: "🚲" },
    { name: "Tent", emoji: "⛺" }, { name: "Maple Leaf", emoji: "🍁" }, { name: "Fire", emoji: "🔥" },
    { name: "Water Wave", emoji: "🌊" },
    { name: "Snail", emoji: "🐌" }, { name: "Butterfly", emoji: "🦋" }, { name: "Ladybug", emoji: "🐞" },
];
export const numItemsToDisplay = 25;
// Adjusted for better mobile visibility
export const minRelativeSize = 0.045;
export const maxRelativeSize = 0.11;
