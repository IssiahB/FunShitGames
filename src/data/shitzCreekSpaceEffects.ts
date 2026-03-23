export type SpaceType = 
  | 'start' | 'finish' | 'blue' | 'yellow' | 'green' | 'red'
  | 'sewer' | 'shitfaced' | 'crossing' | 'paddle_shop' | 'dog_poo' 
  | 'shit_pile' | 'safe';

export interface SpaceEffect {
  type:
    | 'none'
    | 'paddle_gain'
    | 'paddle_lose'
    | 'paddle_gift_right'
    | 'move_forward'
    | 'move_back'
    | 'move_with_player_behind'
    | 'move_to_previous_shit_pile'
    | 'go_to_start'
    | 'go_to_space'
    | 'take_lead'
    | 'skip_turn'
    | 'extra_roll'
    | 'paddle_lose_and_extra_roll'
    | 'draw_card'
    | 'swap_random';
  value?: number;
  text: string;
  emoji: string;
  spaceType?: SpaceType;
  spaceName?: string;
  targetSpace?: SpaceType;
}

// 26 spaces to match BOARD_SPACES coordinates in ShitzCreekBoard.tsx
// Start is the left-middle tile (index 0), then move clockwise.
export const SPACE_EFFECTS: SpaceEffect[] = [
  // 0
  { type: 'none', text: 'Start! Begin your journey up Shitz Creek!', emoji: '🚀', spaceType: 'start', spaceName: 'START' },
  // 1
  { type: 'move_forward', value: 2, text: 'Keep moving forward 2 spaces.', emoji: '⏩', spaceType: 'red', spaceName: 'FORWARD 2' },
  // 2
  { type: 'draw_card', text: 'Pile of poo! Draw a Shit Pile card.', emoji: '💩', spaceType: 'shit_pile', spaceName: 'SHIT PILE' },
  // 3
  { type: 'move_back', value: 1, text: 'You got shit-faced. Go back 1 space.', emoji: '🥴', spaceType: 'shitfaced', spaceName: 'SHITFACED' },
  // 4
  { type: 'go_to_start', text: 'Return to the start.', emoji: '↩️', spaceType: 'yellow', spaceName: 'RETURN TO START' },
  // 5
  { type: 'draw_card', text: 'Pile of poo! Draw a Shit Pile card.', emoji: '💩', spaceType: 'shit_pile', spaceName: 'SHIT PILE' },
  // 6
  { type: 'move_back', value: 1, text: 'Shitz Creek Crossing bridge. Fall back 1 space.', emoji: '🌉', spaceType: 'crossing', spaceName: 'SHIT CREEK CROSSING' },
  // 7
  { type: 'move_forward', value: 2, text: 'Move ahead 2 spaces.', emoji: '⏩', spaceType: 'green', spaceName: 'AHEAD 2' },
  // 8
  { type: 'move_back', value: 2, text: 'You stink. Move back 2 spaces.', emoji: '⬅️', spaceType: 'blue', spaceName: 'BACK 2' },
  // 9
  { type: 'paddle_lose_and_extra_roll', value: 1, text: 'Give up 1 paddle and roll again.', emoji: '🛶', spaceType: 'paddle_shop', spaceName: 'PADDLE SHOP' },
  // 10
  { type: 'draw_card', text: 'Pile of poo! Draw a Shit Pile card.', emoji: '💩', spaceType: 'shit_pile', spaceName: 'SHIT PILE' },
  // 11
  { type: 'take_lead', text: 'Move 1 space in front of the leader.', emoji: '👑', spaceType: 'green', spaceName: 'IN FRONT OF LEADER' },
  // 12
  { type: 'move_back', value: 2, text: 'Move back 2 spaces.', emoji: '⬅️', spaceType: 'red', spaceName: 'BACK 2' },
  // 13
  { type: 'go_to_start', text: 'Shitty day. Return to start.', emoji: '↩️', spaceType: 'yellow', spaceName: 'RETURN TO START' },
  // 14
  { type: 'move_forward', value: 2, text: 'Move forward 2 spaces.', emoji: '⏩', spaceType: 'blue', spaceName: 'FORWARD 2' },
  // 15
  { type: 'move_with_player_behind', value: 1, text: 'Move back with the player behind you.', emoji: '👥', spaceType: 'green', spaceName: 'MOVE BACK WITH PLAYER' },
  // 16
  { type: 'draw_card', text: 'Pile of poo! Draw a Shit Pile card.', emoji: '💩', spaceType: 'shit_pile', spaceName: 'SHIT PILE' },
  // 17
  { type: 'go_to_space', text: 'Return to the paddle shop.', emoji: '🏪', spaceType: 'yellow', spaceName: 'RETURN TO PADDLE SHOP', targetSpace: 'paddle_shop' },
  // 18
  { type: 'move_back', value: 2, text: 'Sewer is backed up. Move back 2 spaces.', emoji: '🕳️', spaceType: 'sewer', spaceName: 'BACKED UP SEWER' },
  // 19
  { type: 'move_forward', value: 2, text: 'Move ahead 2 spaces.', emoji: '⏩', spaceType: 'red', spaceName: 'AHEAD 2' },
  // 20
  { type: 'draw_card', text: 'Pile of poo! Draw a Shit Pile card.', emoji: '💩', spaceType: 'shit_pile', spaceName: 'SHIT PILE' },
  // 21
  { type: 'paddle_gift_right', value: 1, text: 'Lose 1 paddle to your right.', emoji: '🎁', spaceType: 'green', spaceName: 'LOSE PADDLE RIGHT' },
  // 22
  { type: 'skip_turn', text: 'Beaver Dam. Lose a turn.', emoji: '🦫', spaceType: 'yellow', spaceName: 'BEAVER DAM' },
  // 23
  { type: 'move_to_previous_shit_pile', text: 'Move back to the last Shit Pile.', emoji: '↪️', spaceType: 'blue', spaceName: 'BACK TO LAST SHIT PILE' },
  // 24
  { type: 'go_to_space', text: 'Return to Shitz Creek Crossing.', emoji: '🌉', spaceType: 'red', spaceName: 'RETURN TO CROSSING', targetSpace: 'crossing' },
  // 25
  { type: 'none', text: 'Finish! Need 2 paddles to win!', emoji: '🏁', spaceType: 'finish', spaceName: 'FINISH' },
];

export const getSpaceEffect = (spaceIndex: number): SpaceEffect => {
  if (spaceIndex < 0 || spaceIndex >= SPACE_EFFECTS.length) {
    return { type: 'none', text: 'Unknown space', emoji: '❓', spaceType: 'safe' };
  }
  return SPACE_EFFECTS[spaceIndex];
};

export function findNextSpaceOfType(fromIndex: number, spaceType: SpaceType): number {
  for (let i = fromIndex + 1; i < SPACE_EFFECTS.length; i++) {
    if (SPACE_EFFECTS[i].spaceType === spaceType) return i;
  }
  for (let i = 0; i <= fromIndex; i++) {
    if (SPACE_EFFECTS[i].spaceType === spaceType) return i;
  }
  return fromIndex;
}

export function findClosestSpaceOfType(fromIndex: number, spaceType: SpaceType): number {
  let closestIdx = -1;
  let closestDist = Infinity;
  for (let i = 0; i < SPACE_EFFECTS.length; i++) {
    if (i !== fromIndex && SPACE_EFFECTS[i].spaceType === spaceType) {
      const dist = Math.abs(i - fromIndex);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    }
  }
  return closestIdx >= 0 ? closestIdx : fromIndex;
}

export function findPreviousSpaceOfType(fromIndex: number, spaceType: SpaceType): number {
  for (let i = fromIndex - 1; i >= 0; i--) {
    if (SPACE_EFFECTS[i].spaceType === spaceType) return i;
  }
  for (let i = SPACE_EFFECTS.length - 1; i >= fromIndex; i--) {
    if (SPACE_EFFECTS[i].spaceType === spaceType) return i;
  }
  return fromIndex;
}

export const getSpaceColor = (effect: SpaceEffect): string => {
  const st = effect.spaceType;
  if (st) {
    switch (st) {
      case 'start': return 'bg-emerald-500/70';
      case 'finish': return 'bg-emerald-600/70';
      case 'blue': return 'bg-blue-500/70';
      case 'yellow': return 'bg-yellow-500/70';
      case 'green': return 'bg-green-500/70';
      case 'red': return 'bg-red-500/70';
      case 'shit_pile': return 'bg-amber-700/80';
      case 'sewer': return 'bg-gray-700/80';
      case 'shitfaced': return 'bg-purple-600/80';
      case 'crossing': return 'bg-orange-500/70';
      case 'paddle_shop': return 'bg-cyan-500/70';
      case 'dog_poo': return 'bg-yellow-800/80';
      default: return 'bg-white/30';
    }
  }
  switch (effect.type) {
    case 'paddle_gain': return 'bg-green-500/70';
    case 'paddle_lose': return 'bg-red-500/70';
    case 'paddle_gift_right': return 'bg-pink-500/70';
    case 'move_forward': return 'bg-blue-500/70';
    case 'move_back': return 'bg-orange-500/70';
    case 'move_with_player_behind': return 'bg-orange-600/70';
    case 'move_to_previous_shit_pile': return 'bg-amber-800/70';
    case 'go_to_space': return 'bg-sky-500/70';
    case 'go_to_start': return 'bg-purple-500/70';
    case 'take_lead': return 'bg-yellow-500/70';
    case 'skip_turn': return 'bg-gray-500/70';
    case 'extra_roll': return 'bg-cyan-500/70';
    case 'paddle_lose_and_extra_roll': return 'bg-indigo-500/70';
    case 'draw_card': return 'bg-amber-600/70';
    case 'swap_random': return 'bg-pink-500/70';
    default: return 'bg-white/30';
  }
};

// ─── Card Effect Parsing ──────────────────────────────────────────────
// Maps the card_effect strings from the parsed_game_cards DB table
// to structured game actions the board component can execute.

export type CardActionType =
  | 'move_back' | 'move_forward'
  | 'paddle_gain' | 'paddle_lose' | 'paddle_steal' | 'paddle_gift_right' | 'paddle_gift_choose'
  | 'lose_turn' | 'extra_turn' | 'draw_again'
  | 'go_to_space' | 'go_to_space_and_gain_paddle'
  | 'take_lead'
  | 'send_player_to' | 'bring_player' | 'bring_all_players'
  | 'go_back_with_player' | 'behind_leader'
  | 'skip_yellow' | 'move_player_behind_last' | 'move_ahead_of_player'
  | 'move_both_to_space';

export interface ParsedCardAction {
  type: CardActionType;
  value?: number;
  targetSpace?: SpaceType;
  needsPlayerSelect?: boolean;
  text: string;
}

/**
 * Parse a card_effect string from the DB into a structured game action.
 * Handles all 50 real Shitz Creek shit-pile card effects.
 */
export function parseCardEffect(effectText: string): ParsedCardAction {
  const e = effectText.toUpperCase().trim();

  // ── Movement cards ──────────────────────────────────────────────
  if (e === 'TWO STEPS BACK' || e === 'MOVE BACK TWO SPACES')
    return { type: 'move_back', value: 2, text: effectText };
  if (e.includes('BACK THREE') || e.includes('GO BACK THREE'))
    return { type: 'move_back', value: 3, text: effectText };
  if (e === 'BACK FIVE STEPS')
    return { type: 'move_back', value: 5, text: effectText };
  if (e === 'MOVE AHEAD TWO SPACES')
    return { type: 'move_forward', value: 2, text: effectText };

  // ── Paddle gain cards ───────────────────────────────────────────
  if (e === 'GET A PADDLE' || e === 'FREE PADDLE' || e === 'GET A FREE PADDLE' || e === 'FOUND A LOST PADDLE')
    return { type: 'paddle_gain', text: effectText };

  // ── Paddle lose cards ───────────────────────────────────────────
  if (e === 'LOSE PADDLE LEFT')
    return { type: 'paddle_lose', text: effectText }; // lose paddle, give to player on left (handled in board)
  if (e.includes('LOSE PADDLE') || e === 'LOSE A PADDLE' || e === 'YOU LOSE A PADDLE' || e === 'PUT PADDLE BACK' || e === 'RETURN A PADDLE')
    return { type: 'paddle_lose', text: effectText };

  // ── Paddle steal / take cards ───────────────────────────────────
  if (e.includes('STEAL A PADDLE') || e.includes('TAKE A PADDLE FROM ANY') || e === 'TAKE A PADDLE FROM ANYONE' || e === 'TAKE A PADDLE')
    return { type: 'paddle_steal', needsPlayerSelect: true, text: effectText };

  // ── Paddle gift cards ───────────────────────────────────────────
  if (e.includes('GIFT A PADDLE TO YOUR RIGHT') || e.includes('GIFT A PADDLE TO THE RIGHT'))
    return { type: 'paddle_gift_right', text: effectText };
  if (e === 'GIFT A PADDLE')
    return { type: 'paddle_gift_choose', needsPlayerSelect: true, text: effectText };

  // ── Turn cards ──────────────────────────────────────────────────
  if (e === 'LOSE TURN' || e === 'LOSE A TURN' || e.includes('LOSE YOUR NEXT TURN'))
    return { type: 'lose_turn', text: effectText };
  if (e.includes('TAKE ANOTHER TURN'))
    return { type: 'extra_turn', text: effectText };
  if (e === 'DRAW AGAIN')
    return { type: 'draw_again', text: effectText };

  // ── Go-to-space cards (compound: go to shop AND get paddle) ─────
  if (e === 'GO TO SHOP AND GET A PADDLE')
    return { type: 'go_to_space_and_gain_paddle', targetSpace: 'paddle_shop', text: effectText };

  // ── Go-to-space cards (simple) ──────────────────────────────────
  if (e.includes('NEXT BLUE'))
    return { type: 'go_to_space', targetSpace: 'blue', text: effectText };
  if (e.includes('CLOSEST YELLOW') || e.includes('NEXT YELLOW') || e.includes('THE CLOSEST YELLOW'))
    return { type: 'go_to_space', targetSpace: 'shit_pile', text: effectText };
  if (e.includes('SEWER') && !e.includes('ANOTHER') && !e.includes('YOU AND'))
    return { type: 'go_to_space', targetSpace: 'sewer', text: effectText };
  if (e.includes('SHITFACED'))
    return { type: 'go_to_space', targetSpace: 'shitfaced', text: effectText };
  if (e.includes('PADDLE SHOP') || e.includes('RETURN TO PADDLE') || e.includes('GO BACK TO PADDLE') || e.includes('GO TO SHOP'))
    return { type: 'go_to_space', targetSpace: 'paddle_shop', text: effectText };
  if (e.includes('DOG POO') || e.includes('CLEAN DOG'))
    return { type: 'go_to_space', targetSpace: 'dog_poo', text: effectText };

  // ── Move both players to sewer ──────────────────────────────────
  if (e.includes('YOU AND ANOTHER') && e.includes('SEWER'))
    return { type: 'move_both_to_space', targetSpace: 'sewer', needsPlayerSelect: true, text: effectText };

  // ── Send another player to a space ──────────────────────────────
  if (e.includes('CROSSING') && (e.includes('SEND') || e.includes('ANOTHER')))
    return { type: 'send_player_to', targetSpace: 'crossing', needsPlayerSelect: true, text: effectText };

  // ── Take the lead ───────────────────────────────────────────────
  if (e === 'TAKE A LEAD' || e === 'MOVE TO THE LEAD' || e === 'MOVE AHEAD OF EVERYONE')
    return { type: 'take_lead', text: effectText };

  // ── Move ahead of a specific player ─────────────────────────────
  if (e === 'MOVE AHEAD OF ANY PLAYER')
    return { type: 'move_ahead_of_player', needsPlayerSelect: true, text: effectText };

  // ── Behind leader ───────────────────────────────────────────────
  if (e.includes('THREE SPACES BEHIND LEADER') || e.includes('BEHIND LEADER'))
    return { type: 'behind_leader', value: 3, text: effectText };

  // ── Bring player(s) to your space ───────────────────────────────
  if (e === 'BRING ANOTHER TO YOUR SPACE')
    return { type: 'bring_player', needsPlayerSelect: true, text: effectText };
  if (e === 'BRING ALL PLAYERS TO YOUR SPACE')
    return { type: 'bring_all_players', text: effectText };

  // ── Go back with closest player ─────────────────────────────────
  if (e.includes('GO BACK WITH CLOSEST'))
    return { type: 'go_back_with_player', value: 3, text: effectText };

  // ── Move a player behind the last ───────────────────────────────
  if (e.includes('MOVE A PLAYER BEHIND'))
    return { type: 'move_player_behind_last', needsPlayerSelect: true, text: effectText };

  // ── Skip yellow space ───────────────────────────────────────────
  if (e.includes('SKIP') && e.includes('YELLOW'))
    return { type: 'skip_yellow', text: effectText };

  // ── Fallback ────────────────────────────────────────────────────
  return { type: 'move_back', value: 1, text: effectText };
}
