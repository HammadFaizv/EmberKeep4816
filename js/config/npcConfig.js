/**
 * NPC definitions. Map nodes of type 'npc' reference these by id.
 * `onVisit` rewards are granted once, through progression/RewardSystem.js.
 */
export const NPCS = Object.freeze({
    animal_caretaker: {
        id: 'animal_caretaker',
        name: 'Animal Caretaker',
        dialogue: [
            'Another doll? Hah. The witch never stops.',
            'The beasts out here are frightened of the corruption. Some would follow a soul like yours.',
            'Take care of them, and they will lend you their strength.',
        ],
        onVisit: [{ type: 'unlockFeature', id: 'pets' }],
        opens: 'PETS', // GameState opened after the dialogue
    },
});
