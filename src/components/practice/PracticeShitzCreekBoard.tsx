import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dice1, Dice2, Dice3, Dice4, Dice5, Dice6,
  Trophy, RotateCcw, Lightbulb, Loader2,
  Shuffle, Check, Info, AlertTriangle, Users, ArrowRight,
} from 'lucide-react';
import {
  getSpaceEffect,
  getSpaceColor,
  SpaceEffect,
  SPACE_EFFECTS,
  parseCardEffect as baseParseCardEffect,
  ParsedCardAction,
  findNextSpaceOfType,
  findClosestSpaceOfType,
  findPreviousSpaceOfType,
  SpaceType,
} from '@/data/shitzCreekSpaceEffects';
import ShitzCreekDeckTracker from '@/components/lobby/ShitzCreekDeckTracker';
import {
  DeckState,
  initializeDeck,
  drawFromDeck,
} from '@/lib/shitzCreekDeck';
import BotCardRevealOverlay, { type BotCardRevealData } from '@/components/practice/BotCardRevealOverlay';


// ─── Types ────────────────────────────────────────────────────────────

interface Props {
  gameData: Record<string, any>;
  isMyTurn: boolean;
  onAction: (action: string, data?: any) => void;
  players: { player_id: string; player_name: string; isBot?: boolean; avatar?: string }[];
  currentPlayerId: string;
  isPaused?: boolean;
  onHint?: () => void;
  /** When a bot draws a card, this data drives the animated reveal overlay */
  botCardReveal?: BotCardRevealData | null;
  /** Called when the bot card reveal overlay auto-dismisses or is tapped away */
  onBotCardDismiss?: () => void;
}

interface DbCard {
  id: string;
  game_id: string;
  card_type: string;
  card_name: string;
  card_text: string | null;
  card_effect: string;
  card_category: string;
  card_number: number;
  drink_count: number;
  metadata: Record<string, any>;
  source_file: string;
  image_url?: string;
}

interface CardSeed {
  card_name: string;
  card_text: string;
  card_effect: string;
  card_category: string;
  /**
   * Optional explicit action override.
   * We now prefer the shared parser from shitzCreekSpaceEffects.ts so this is
   * only used when a card's PDF wording does not line up cleanly with the
   * parser's current phrase handling.
   */
  action?: ParsedCardAction;
}

interface ManifestCardSeed extends CardSeed {
  sourceIndex: number;
}

type CardImageModule = { default: string };

const CARD_IMAGE_MODULES = import.meta.glob<CardImageModule>(
  '@/assets/cards/shitzcreek/images/*.png',
  { eager: true }
);

// ─── Constants ────────────────────────────────────────────────────────

const BOARD_SPACES = [
  { x: 7, y: 50 },
  { x: 7, y: 40 },
  { x: 7, y: 27 },
  { x: 16.5, y: 27 },
  { x: 26, y: 27 },
  { x: 35, y: 27 },
  { x: 46.5, y: 33 }, // Bridge
  { x: 60, y: 27 },
  { x: 69, y: 27 },
  { x: 78.5, y: 27 },
  { x: 88.3, y: 27 }, // Shit Top right
  { x: 88.3, y: 39.5 },
  { x: 88.3, y: 52 },
  { x: 88.3, y: 65 },
  { x: 88.7, y: 77 }, // Bottom Right
  { x: 79.5, y: 77 },
  { x: 70.5, y: 77 },
  { x: 61, y: 77 },
  { x: 51.5, y: 77 },
  { x: 42.5, y: 77 },
  { x: 33.5, y: 77 },
  { x: 24.5, y: 77 },
  { x: 15.3, y: 77 },
  { x: 6, y: 77 }, // Bottom Left
  { x: 6, y: 65 },
  { x: 12, y: 57 },
];

const TOTAL_SPACES = BOARD_SPACES.length;
const FINISH_SPACE = TOTAL_SPACES - 1;


// Shared space-type constants aligned with shitzCreekSpaceEffects.ts.
const ST = {
  BLUE: 'blue' as SpaceType,
  SHIT_PILE: 'shit_pile' as SpaceType,
  PADDLE_SHOP: 'paddle_shop' as SpaceType,
  SEWER: 'sewer' as SpaceType,
  SHITFACED: 'shitfaced' as SpaceType,
  CROSSING: 'crossing' as SpaceType,
};

const CARD_SEEDS: CardSeed[] = [
  // Page 1
  {
    card_name: 'You Have Stepped in Shit',
    card_text: 'You have stepped in shit. Take 2 steps back.',
    card_effect: 'Go back 2 spaces',
    card_category: 'movement',
    action: { type: 'move_back', text: 'Go back 2 spaces', value: 2 },
  },
  {
    card_name: 'You Have Found a Lost Paddle',
    card_text: 'You have found a lost paddle.',
    card_effect: 'Gain 1 paddle',
    card_category: 'paddle',
    action: { type: 'paddle_gain', text: 'Gain 1 paddle', value: 1 },
  },
  {
    card_name: 'Boat With One Paddle',
    card_text: 'You got in a boat with only one paddle. Give one paddle to the person on your right.',
    card_effect: 'Give 1 paddle to the player on your right',
    card_category: 'paddle',
    action: { type: 'paddle_gift_right', text: 'Give 1 paddle to the player on your right' },
  },
  {
    card_name: 'Take a Paddle',
    card_text: 'Take a paddle from any other player.',
    card_effect: 'Take 1 paddle from any other player',
    card_category: 'paddle',
    action: { type: 'paddle_steal', text: 'Take 1 paddle from any other player', needsPlayerSelect: true },
  },
  {
    card_name: 'You Are Sick as Sh*t',
    card_text: 'Lose your next turn.',
    card_effect: 'Lose your next turn',
    card_category: 'turn',
    action: { type: 'lose_turn', text: 'Lose your next turn' },
  },
  {
    card_name: 'Sh*t Piles',
    card_text: 'Put a paddle back.',
    card_effect: 'Lose 1 paddle',
    card_category: 'paddle',
    action: { type: 'paddle_lose', text: 'Lose 1 paddle', value: 1 },
  },
  {
    card_name: 'Some Sad Sh*t',
    card_text: 'Go to closest blue space.',
    card_effect: 'Go to the closest blue space',
    card_category: 'movement',
    action: { type: 'go_to_space', text: 'Go to the closest blue space', targetSpace: ST.BLUE },
  },
  {
    card_name: 'Some Cool Sh*t',
    card_text: 'Advance two spaces.',
    card_effect: 'Move forward 2 spaces',
    card_category: 'movement',
    action: { type: 'move_forward', text: 'Move forward 2 spaces', value: 2 },
  },
  {
    card_name: 'Holy Crap You Lost Your Sh*t',
    card_text: 'Go back 3 spaces.',
    card_effect: 'Go back 3 spaces',
    card_category: 'movement',
    action: { type: 'move_back', text: 'Go back 3 spaces', value: 3 },
  },

  // Page 2
  {
    card_name: 'Here’s Some Cool Sh*t',
    card_text: 'You just earned a free paddle.',
    card_effect: 'Gain 1 paddle',
    card_category: 'paddle',
    action: { type: 'paddle_gain', text: 'Gain 1 paddle', value: 1 },
  },
  {
    card_name: 'Lost Paddle',
    card_text: 'You have found a lost paddle.',
    card_effect: 'Gain 1 paddle',
    card_category: 'paddle',
    action: { type: 'paddle_gain', text: 'Gain 1 paddle', value: 1 },
  },
  {
    card_name: 'Plunger Instead of a Paddle',
    card_text: 'Return one paddle to the pile. If you have 0, go to start.',
    card_effect: 'Lose 1 paddle',
    card_category: 'paddle',
    action: { type: 'paddle_lose', text: 'Lose 1 paddle', value: 1 },
  },
  {
    card_name: 'Take a Paddle From Any Other Player',
    card_text: 'Take a paddle from any other player.',
    card_effect: 'Take 1 paddle from any other player',
    card_category: 'paddle',
    action: { type: 'paddle_steal', text: 'Take 1 paddle from any other player', needsPlayerSelect: true },
  },
  {
    card_name: 'You Stepped in Sh*t',
    card_text: 'Go back 5 steps.',
    card_effect: 'Go back 5 spaces',
    card_category: 'movement',
    action: { type: 'move_back', text: 'Go back 5 spaces', value: 5 },
  },
  {
    card_name: 'Sh*t Happens',
    card_text: 'Lose next turn.',
    card_effect: 'Lose your next turn',
    card_category: 'turn',
    action: { type: 'lose_turn', text: 'Lose your next turn' },
  },
  {
    card_name: 'Didn’t Change the Litter',
    card_text: 'Go to the closest yellow space.',
    card_effect: 'Go to the closest yellow space',
    card_category: 'movement',
    action: { type: 'go_to_space', text: 'Go to the closest yellow space', targetSpace: ST.SHIT_PILE },
  },
  {
    card_name: 'Flush Another Player',
    card_text: 'Take a paddle from any one player.',
    card_effect: 'Take 1 paddle from any other player',
    card_category: 'paddle',
    action: { type: 'paddle_steal', text: 'Take 1 paddle from any other player', needsPlayerSelect: true },
  },
  {
    card_name: 'Take the Lead',
    card_text: 'Move ahead of any player.',
    card_effect: 'Take the lead',
    card_category: 'movement',
    action: { type: 'take_lead', text: 'Take the lead' },
  },

  // Page 3
  {
    card_name: 'You Found a Bridge',
    card_text: 'Skip next yellow.',
    card_effect: 'Skip the next yellow space',
    card_category: 'turn',
    action: { type: 'skip_yellow', text: 'Skip the next yellow space' },
  },
  {
    card_name: 'Lost Paddle Again',
    card_text: 'You have found a lost paddle.',
    card_effect: 'Gain 1 paddle',
    card_category: 'paddle',
    action: { type: 'paddle_gain', text: 'Gain 1 paddle', value: 1 },
  },
  {
    card_name: 'Take Another Turn',
    card_text: 'Take another turn or draw a card.',
    card_effect: 'Take another turn',
    card_category: 'turn',
    action: { type: 'extra_turn', text: 'Take another turn' },
  },
  {
    card_name: 'Gift Another Player a Paddle',
    card_text: 'Gift another player a paddle.',
    card_effect: 'Give 1 paddle to another player',
    card_category: 'paddle',
    action: { type: 'paddle_gift_choose', text: 'Give 1 paddle to another player', needsPlayerSelect: true },
  },
  {
    card_name: 'No Sh*t',
    card_text: 'Go to the head of the path.',
    card_effect: 'Take the lead',
    card_category: 'movement',
    action: { type: 'take_lead', text: 'Take the lead' },
  },
  {
    card_name: 'Someone Is an Angry Sh*t',
    card_text: 'Take a paddle.',
    card_effect: 'Gain 1 paddle',
    card_category: 'paddle',
    action: { type: 'paddle_gain', text: 'Gain 1 paddle', value: 1 },
  },
  {
    card_name: 'Sh*t Stinks',
    card_text: 'Lose a paddle.',
    card_effect: 'Lose 1 paddle',
    card_category: 'paddle',
    action: { type: 'paddle_lose', text: 'Lose 1 paddle', value: 1 },
  },
  {
    card_name: 'Oh Happy Crap',
    card_text: 'You get to skip the next yellow.',
    card_effect: 'Skip the next yellow space',
    card_category: 'turn',
    action: { type: 'skip_yellow', text: 'Skip the next yellow space' },
  },
  {
    card_name: 'You Lucky Sh*t',
    card_text: 'You get a free paddle.',
    card_effect: 'Gain 1 paddle',
    card_category: 'paddle',
    action: { type: 'paddle_gain', text: 'Gain 1 paddle', value: 1 },
  },

  // Page 4
  {
    card_name: 'Pooper Scooper',
    card_text: 'Go back to the sewer space.',
    card_effect: 'Go to the sewer space',
    card_category: 'movement',
    action: { type: 'go_to_space', text: 'Go to the sewer space', targetSpace: ST.SEWER },
  },
  {
    card_name: 'Hang Over',
    card_text: 'Return to the shitfaced space.',
    card_effect: 'Go to the shitfaced space',
    card_category: 'movement',
    action: { type: 'go_to_space', text: 'Go to the shitfaced space', targetSpace: ST.SHITFACED },
  },
  {
    card_name: 'You Caught the Beaver',
    card_text: 'Send another player to the crossing bridge.',
    card_effect: 'Send another player to the crossing bridge',
    card_category: 'movement',
    action: {
      type: 'send_player_to',
      text: 'Send another player to the crossing bridge',
      targetSpace: ST.CROSSING,
      needsPlayerSelect: true,
    },
  },
  {
    card_name: 'Cut in Front of the Latrine Line',
    card_text: 'Go to the space ahead of the leader.',
    card_effect: 'Take the lead',
    card_category: 'movement',
    action: { type: 'take_lead', text: 'Take the lead' },
  },
  {
    card_name: 'Everyone’s in the Same Shit',
    card_text: 'Pull another player into your space.',
    card_effect: 'Bring another player to your space',
    card_category: 'movement',
    action: { type: 'bring_player', text: 'Bring another player to your space', needsPlayerSelect: true },
  },
  {
    card_name: 'Something Scared the Shit Out of You',
    card_text: 'Lose a turn.',
    card_effect: 'Lose your next turn',
    card_category: 'turn',
    action: { type: 'lose_turn', text: 'Lose your next turn' },
  },
  {
    card_name: 'You’ve Strained Too Hard',
    card_text: 'Go back to closest yellow space.',
    card_effect: 'Go to the closest yellow space',
    card_category: 'movement',
    action: { type: 'go_to_space', text: 'Go to the closest yellow space', targetSpace: ST.SHIT_PILE },
  },
  {
    card_name: 'Send Another Player to Shitz Creek Crossing',
    card_text: 'Send another player to Shitz Creek Crossing.',
    card_effect: 'Send another player to the crossing bridge',
    card_category: 'movement',
    action: {
      type: 'send_player_to',
      text: 'Send another player to the crossing bridge',
      targetSpace: ST.CROSSING,
      needsPlayerSelect: true,
    },
  },
  {
    card_name: 'Dog Shit on the Neighbor’s Lawn',
    card_text: 'Go clean it up. You can’t miss him.',
    card_effect: 'Go to the crossing bridge',
    card_category: 'movement',
    action: { type: 'go_to_space', text: 'Go to the crossing bridge', targetSpace: ST.CROSSING },
  },

  // Page 5
  {
    card_name: 'You Need Help With Your Sewer',
    card_text: 'Take yourself and another player to the space.',
    card_effect: 'Take yourself and another player to the sewer space',
    card_category: 'movement',
    action: {
      type: 'move_both_to_space',
      text: 'Take yourself and another player to the sewer space',
      targetSpace: ST.SEWER,
      needsPlayerSelect: true,
    },
  },
  {
    card_name: 'Keep Moving Forward',
    card_text: 'Ahead of everyone.',
    card_effect: 'Take the lead',
    card_category: 'movement',
    action: { type: 'take_lead', text: 'Take the lead' },
  },
  {
    card_name: 'You’re All Alone',
    card_text: 'Go back with the closest player.',
    card_effect: 'Go back with the closest player',
    card_category: 'movement',
    action: { type: 'go_back_with_player', text: 'Go back with the closest player', value: 3 },
  },
  {
    card_name: 'Third in Line for the Latrine',
    card_text: 'Go that many spaces behind the leader.',
    card_effect: 'Go 3 spaces behind the leader',
    card_category: 'movement',
    action: { type: 'behind_leader', text: 'Go 3 spaces behind the leader', value: 3 },
  },
  {
    card_name: 'Hard to Be Number 1',
    card_text: 'Go back 2 spaces.',
    card_effect: 'Go back 2 spaces',
    card_category: 'movement',
    action: { type: 'move_back', text: 'Go back 2 spaces', value: 2 },
  },
  {
    card_name: 'Shitty Day',
    card_text: 'Give a paddle to the person on your right.',
    card_effect: 'Give 1 paddle to the player on your right',
    card_category: 'paddle',
    action: { type: 'paddle_gift_right', text: 'Give 1 paddle to the player on your right' },
  },
  {
    card_name: 'You Pooped Today',
    card_text: 'Draw again.',
    card_effect: 'Draw again',
    card_category: 'turn',
    action: { type: 'draw_again', text: 'Draw again' },
  },
  {
    card_name: 'Shitty Days Are Better With Friends',
    card_text: 'Bring ALL yours to your space.',
    card_effect: 'Bring all players to your space',
    card_category: 'movement',
    action: { type: 'bring_all_players', text: 'Bring all players to your space' },
  },
  {
    card_name: 'Return to the Paddle',
    card_text: 'Return to the paddle shop.',
    card_effect: 'Go to the paddle shop',
    card_category: 'movement',
    action: { type: 'go_to_space', text: 'Go to the paddle shop', targetSpace: ST.PADDLE_SHOP },
  },
];

const CARD_ACTIONS_BY_ID: Record<string, ParsedCardAction> = Object.fromEntries(
  CARD_SEEDS.flatMap((seed, index) =>
    seed.action
      ? [[`sc-card-src-${String(index + 1).padStart(3, '0')}`, seed.action]]
      : []
  )
);

const RANDOM_MANIFEST_SIZE = 45;

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getSeedPageAndCard(sourceIndex: number): { page: number; card: number } {
  return {
    page: Math.floor(sourceIndex / 9) + 1,
    card: (sourceIndex % 9) + 1,
  };
}

function getSeedImageBaseName(sourceIndex: number): string {
  const { page, card } = getSeedPageAndCard(sourceIndex);
  return `p${page}-c${card}`;
}

function buildRandomCardSeeds(): ManifestCardSeed[] {
  return shuffleArray(
    CARD_SEEDS.map((seed, index) => ({
      ...seed,
      sourceIndex: index,
    }))
  ).slice(0, Math.min(RANDOM_MANIFEST_SIZE, CARD_SEEDS.length));
}

// ─── Small sub-components ─────────────────────────────────────────────

const DiceIcon = ({ value }: { value: number }) => {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const Icon = icons[value - 1] || Dice1;
  return <Icon className="w-12 h-12 text-white" />;
};

const PaddleIcon = ({ count, size = 'md' }: { count: number; size?: 'sm' | 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`${sizeClass} text-amber-400`} fill="currentColor">
          <ellipse cx="12" cy="6" rx="6" ry="4" />
          <rect x="10" y="8" width="4" height="14" rx="1" />
        </svg>
      ))}
      {count > 5 && <span className="text-amber-400 text-xs">+{count - 5}</span>}
    </div>
  );
};

// ─── Helpers for card display ─────────────────────────────────────────

function getCardActionIcon(action: ParsedCardAction | null): string {
  if (!action) return '💩';
  switch (action.type) {
    case 'paddle_gain': case 'go_to_space_and_gain_paddle': return '🏆';
    case 'paddle_lose': return '😢';
    case 'paddle_steal': return '🦝';
    case 'paddle_gift_right': case 'paddle_gift_choose': return '🎁';
    case 'move_forward': return '🚀';
    case 'move_back': return '⬅️';
    case 'lose_turn': return '⏸️';
    case 'extra_turn': case 'draw_again': return '🎲';
    case 'go_to_space': return '📍';
    case 'take_lead': return '👑';
    case 'send_player_to': case 'move_player_behind_last': return '😈';
    case 'bring_player': case 'bring_all_players': return '🧲';
    case 'behind_leader': return '🏃';
    case 'go_back_with_player': case 'move_both_to_space': return '👥';
    case 'skip_yellow': return '🛡️';
    case 'move_ahead_of_player': return '🏎️';
    default: return '💩';
  }
}

function getCardActionColor(action: ParsedCardAction | null): string {
  if (!action) return 'from-amber-700 to-amber-900';
  switch (action.type) {
    case 'paddle_gain': case 'go_to_space_and_gain_paddle': case 'extra_turn': case 'take_lead':
      return 'from-green-600 to-emerald-800';
    case 'paddle_lose': case 'lose_turn': case 'move_back': case 'behind_leader':
      return 'from-red-600 to-red-900';
    case 'paddle_steal': case 'send_player_to': case 'move_player_behind_last':
      return 'from-purple-600 to-purple-900';
    case 'go_to_space': case 'move_both_to_space':
      return 'from-blue-600 to-blue-900';
    case 'skip_yellow':
      return 'from-yellow-500 to-amber-700';
    default:
      return 'from-amber-700 to-amber-900';
  }
}

// ─── Card image helpers ──────────────────────────────────────────────

function normalizeCardImageKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.png$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCardImageCandidates(card: DbCard): string[] {
  const sourceIndex = Number(card.metadata?.sourceIndex ?? card.card_number - 1);
  const baseName = getSeedImageBaseName(sourceIndex);

  return [
    baseName,
    normalizeCardImageKey(baseName),
  ];
}

function resolveCardImage(card: DbCard): string | undefined {
  const entries = Object.entries(CARD_IMAGE_MODULES).map(([fullPath, mod]) => {
    const fileName = fullPath.split('/').pop() || fullPath;
    return {
      fileName,
      moduleUrl: mod.default,
      normalizedFileName: normalizeCardImageKey(fileName),
      rawFileName: fileName.replace(/\.png$/i, '').toLowerCase(),
    };
  });

  const candidates = getCardImageCandidates(card);
  const match = entries.find(entry =>
    candidates.includes(entry.normalizedFileName) || candidates.includes(entry.rawFileName)
  );

  return match?.moduleUrl;
}

function buildCardsManifest(selectedSeeds: ManifestCardSeed[]): DbCard[] {
  return selectedSeeds.map((seed, manifestIndex) => {
    const { page, card } = getSeedPageAndCard(seed.sourceIndex);

    return {
      id: `sc-card-src-${String(seed.sourceIndex + 1).padStart(3, '0')}`,
      game_id: 'shitz-creek',
      card_type: 'shit-pile',
      card_name: seed.card_name,
      card_text: seed.card_text,
      card_effect: seed.card_effect,
      card_category: seed.card_category,
      card_number: manifestIndex + 1,
      drink_count: 0,
      metadata: {
        page,
        card,
        slot: card - 1,
        sourceIndex: seed.sourceIndex,
        sourceCardNumber: seed.sourceIndex + 1,
        sourceImageFile: `${getSeedImageBaseName(seed.sourceIndex)}.png`,
      },
      source_file: 'shitzcreek-card-images',
    };
  });
}

function parseLocalCardEffect(card: DbCard): ParsedCardAction | null {
  // Prefer the shared parser so the practice board stays aligned with the real
  // game logic that already exists elsewhere in the codebase. Only fall back to
  // a per-card override when a specific PDF card's wording needs help.
  const parsed = baseParseCardEffect(card.card_effect);
  const override = CARD_ACTIONS_BY_ID[card.id];

  // The shared parser currently falls back to `move_back 1` for unknown text.
  // Preserve explicit per-card overrides for those cases so the practice board
  // still behaves correctly without drifting away from the shared parser.
  if (
    override &&
    parsed.type === 'move_back' &&
    parsed.value === 1 &&
    parsed.text === card.card_effect
  ) {
    return override;
  }

  return parsed || override || null;
}

// ─── Main Component ───────────────────────────────────────────────────

export default function PracticeShitzCreekBoard({
  gameData,
  isMyTurn,
  onAction,
  players,
  currentPlayerId,
  isPaused,
  onHint,
  botCardReveal,
  onBotCardDismiss,
}: Props) {
  // ── Local UI state ────────────────────────────────────────────────
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState('');
  const [boardImage, setBoardImage] = useState<string | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [showSpaceInfo, setShowSpaceInfo] = useState(false);

  // Local card asset deck
  const [dbCards, setDbCards] = useState<DbCard[]>([]);
  const [dbCardsMap, setDbCardsMap] = useState<Map<string, DbCard>>(new Map());
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsError, setCardsError] = useState<string | null>(null);

  // Card modal
  const [showCardModal, setShowCardModal] = useState(false);
  const [drawnDbCard, setDrawnDbCard] = useState<DbCard | null>(null);
  const [parsedAction, setParsedAction] = useState<ParsedCardAction | null>(null);
  const [isDrawingCard, setIsDrawingCard] = useState(false);
  const [waitingForCard, setWaitingForCard] = useState(false);

  // Player picker modal
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [playerPickerPrompt, setPlayerPickerPrompt] = useState('');
  const [pendingAction, setPendingAction] = useState<ParsedCardAction | null>(null);

  // Landed space tracking
  const [landedSpaceEffect, setLandedSpaceEffect] = useState<SpaceEffect | null>(null);
  const [landedSpaceIndex, setLandedSpaceIndex] = useState<number | null>(null);

  const gameDataRef = useRef(gameData);
  useEffect(() => { gameDataRef.current = gameData; }, [gameData]);

  const deckInitRef = useRef(false);

  // ── Derived game state ────────────────────────────────────────────
  const positions: Record<string, number> = gameData.positions || {};
  const paddles: Record<string, number> = gameData.paddles || {};
  const dice: number = gameData.dice || 1;
  const currentTurn: number = gameData.currentTurn || 0;
  const winner: string | null = gameData.winner || null;
  const skipTurn: Record<string, boolean> = gameData.skipTurn || {};
  const extraRoll: Record<string, boolean> = gameData.extraRoll || {};
  const skipYellow: Record<string, boolean> = gameData.skipYellow || {};
  const lastCard = gameData.lastCard || null;
  const deckState: DeckState | null = gameData.deckState || null;

  const currentPlayer = players[currentTurn];
  const isCurrentPlayer = currentPlayer?.player_id === currentPlayerId;

  // ── Initialisation ────────────────────────────────────────────────

  useEffect(() => {
    loadBoardImage();
    loadCardsFromAssets();
  }, []);

  useEffect(() => {
    if (Object.keys(positions).length === 0 && players.length > 0) {
      const initPositions: Record<string, number> = {};
      const initPaddles: Record<string, number> = {};
      players.forEach(p => {
        initPositions[p.player_id] = 0;
        initPaddles[p.player_id] = 1;
      });
      onAction('init', { positions: initPositions, paddles: initPaddles, currentTurn: 0 });
    }
  }, [players.length, onAction, positions]);

  useEffect(() => {
    if (dbCards.length > 0 && !deckState && !deckInitRef.current) {
      deckInitRef.current = true;
      const newDeck = initializeDeck(dbCards.map(c => c.id));
      onAction('initDeck', { deckState: newDeck });
      console.log(`🃏 Practice: Initialized deck with ${newDeck.drawPile.length} cards`);
    }
  }, [dbCards, deckState, onAction]);

  // ── Load board image ──────────────────────────────────────────────

  const loadBoardImage = async () => {
    try {
      const boardImage = await import('@/assets/images/boards/shitz-creek-board.png');
      setBoardImage(boardImage.default);
    } catch (err) {
      console.log('Board image not found in assets:', err);
    }
    setLoadingBoard(false);
  };

  // ── Load cards from local PNG assets ─────────────────────────────────

  const loadCardsFromAssets = async () => {
    setCardsLoading(true);
    setCardsError(null);

    try {
      const selectedSeeds = buildRandomCardSeeds();
      const manifest = buildCardsManifest(selectedSeeds);

      const cards: DbCard[] = manifest.map((card, index) => ({
        ...card,
        image_url: resolveCardImage(card),
        metadata: {
          ...card.metadata,
          imageIndex: index,
          sourceImageFile: card.metadata?.sourceImageFile,
          imageCandidates: getCardImageCandidates(card),
        },
      }));

      const missingImages = cards.filter(card => !card.image_url);
      if (missingImages.length > 0) {
        throw new Error(
          `Missing PNG assets for ${missingImages.length} card(s): ${missingImages
            .map(card => `${card.card_number}. ${card.card_name} (${card.metadata?.sourceImageFile || 'unknown file'})`)
            .join(', ')}`
        );
      }

      setDbCards(cards);

      const map = new Map<string, DbCard>();
      cards.forEach(card => map.set(card.id, card));
      setDbCardsMap(map);

      console.log(`✅ Practice: Loaded ${cards.length} randomly selected cards from local PNG assets`);
    } catch (err: any) {
      console.error('Practice: Failed to load cards from local PNG assets or build the random 45-card manifest:', err);
      setCardsError(err?.message || 'Failed to load card PNG assets');
    } finally {
      setCardsLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────

  const getPlayerColor = (index: number): string => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
    return colors[index % colors.length];
  };

  const getPlayerToRightOf = (playerId: string): string | null => {
    const idx = players.findIndex(p => p.player_id === playerId);
    if (idx < 0 || players.length < 2) return null;
    return players[(idx + 1) % players.length].player_id;
  };

  const getPlayerToRight = (): string | null => {
    const playerId = currentPlayer?.player_id;
    if (!playerId) return null;
    return getPlayerToRightOf(playerId);
  };

  const getClosestPlayer = (): string | null => {
    const playerId = currentPlayer?.player_id;
    if (!playerId) return null;
    const myPos = positions[playerId] || 0;
    let closest: string | null = null;
    let closestDist = Infinity;
    players.forEach(p => {
      if (p.player_id === playerId) return;
      const dist = Math.abs((positions[p.player_id] || 0) - myPos);
      if (dist < closestDist) {
        closestDist = dist;
        closest = p.player_id;
      }
    });
    return closest;
  };

  // ── Apply space effect after landing ──────────────────────────────

  const applySpaceEffect = useCallback(
    (spaceIndex: number, currentPositions: Record<string, number>, currentPaddles: Record<string, number>, playerId: string) => {
      const effect = getSpaceEffect(spaceIndex);
      setLandedSpaceIndex(spaceIndex);
      setLandedSpaceEffect(effect);

      if (effect.type === 'none') {
        return { positions: currentPositions, paddles: currentPaddles, needsCard: false, message: effect.text };
      }

      const newPositions = { ...currentPositions };
      const newPaddles = { ...currentPaddles };
      let msg = effect.text;

      if (effect.spaceType === 'shit_pile' && skipYellow[playerId]) {
        const newSkipYellow = { ...skipYellow, [playerId]: false };
        onAction('update', { skipYellow: newSkipYellow });
        return {
          positions: newPositions,
          paddles: newPaddles,
          needsCard: false,
          message: 'You skipped this Shit Pile space!',
        };
      }

      switch (effect.type) {
        case 'paddle_gain':
          newPaddles[playerId] = (newPaddles[playerId] || 1) + (effect.value || 1);
          break;
        case 'paddle_lose':
          if (newPaddles[playerId] > 0) {
            newPaddles[playerId] = Math.max(0, (newPaddles[playerId] || 1) - (effect.value || 1));
          }
          break;
        case 'paddle_gift_right': {
          const rightPlayerId = getPlayerToRightOf(playerId);
          const amount = effect.value || 1;
          if (rightPlayerId && (newPaddles[playerId] || 0) > 0) {
            const transfer = Math.min(amount, newPaddles[playerId] || 0);
            newPaddles[playerId] = Math.max(0, (newPaddles[playerId] || 0) - transfer);
            newPaddles[rightPlayerId] = (newPaddles[rightPlayerId] || 1) + transfer;
            msg = `Lost ${transfer} paddle${transfer === 1 ? '' : 's'} to ${players.find(p => p.player_id === rightPlayerId)?.player_name || 'the player on your right'}.`;
          }
          break;
        }
        case 'move_forward':
          newPositions[playerId] = Math.min(FINISH_SPACE, (newPositions[playerId] || 0) + (effect.value || 2));
          break;
        case 'move_back':
          newPositions[playerId] = Math.max(0, (newPositions[playerId] || 0) - (effect.value || 2));
          break;
        case 'move_with_player_behind': {
          const spaces = effect.value || 1;
          const myPos = newPositions[playerId] || 0;
          newPositions[playerId] = Math.max(0, myPos - spaces);

          const behindPlayers = players
            .filter(p => p.player_id !== playerId)
            .map(p => ({ id: p.player_id, pos: newPositions[p.player_id] || 0 }))
            .filter(p => p.pos < myPos)
            .sort((a, b) => b.pos - a.pos);

          const behindPlayer = behindPlayers[0];
          if (behindPlayer) {
            newPositions[behindPlayer.id] = Math.max(0, (newPositions[behindPlayer.id] || 0) - spaces);
            msg = `You and ${players.find(p => p.player_id === behindPlayer.id)?.player_name || 'the player behind you'} moved back ${spaces} space${spaces === 1 ? '' : 's'}.`;
          }
          break;
        }
        case 'move_to_previous_shit_pile':
          newPositions[playerId] = findPreviousSpaceOfType(newPositions[playerId] || 0, 'shit_pile');
          break;
        case 'go_to_start':
          newPositions[playerId] = 0;
          break;
        case 'go_to_space':
          if (effect.targetSpace) {
            newPositions[playerId] = findClosestSpaceOfType(newPositions[playerId] || 0, effect.targetSpace);
          }
          break;
        case 'take_lead': {
          const maxPos = Math.max(...Object.values(newPositions).map(p => p || 0));
          if (maxPos > (newPositions[playerId] || 0)) {
            newPositions[playerId] = Math.min(maxPos + 1, FINISH_SPACE);
          }
          break;
        }
        case 'skip_turn':
          return { positions: newPositions, paddles: newPaddles, needsCard: false, message: msg, skipTurn: true };
        case 'extra_roll':
          return { positions: newPositions, paddles: newPaddles, needsCard: false, message: msg, extraRoll: true };
        case 'paddle_lose_and_extra_roll':
          if (newPaddles[playerId] > 0) {
            newPaddles[playerId] = Math.max(0, (newPaddles[playerId] || 1) - (effect.value || 1));
          }
          return { positions: newPositions, paddles: newPaddles, needsCard: false, message: msg, extraRoll: true };
        case 'swap_random': {
          const otherPlayers = players.filter(p => p.player_id !== playerId);
          if (otherPlayers.length > 0) {
            const randomPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
            const myPos = newPositions[playerId] || 0;
            const theirPos = newPositions[randomPlayer.player_id] || 0;
            newPositions[playerId] = theirPos;
            newPositions[randomPlayer.player_id] = myPos;
            msg = `Swapped positions with ${randomPlayer.player_name}!`;
          }
          break;
        }
        case 'draw_card':
          return { positions: newPositions, paddles: newPaddles, needsCard: true, message: msg };
      }

      return { positions: newPositions, paddles: newPaddles, needsCard: false, message: msg };
    },
    [players, skipYellow, onAction],
  );

  // ── Draw a card from the persistent deck ──────────────────────────

  const drawCard = () => {
    if (dbCards.length === 0) {
      setMessage('No cards loaded! Try refreshing.');
      return;
    }

    const currentDeck = gameDataRef.current.deckState as DeckState | null;
    if (!currentDeck) {
      const newDeck = initializeDeck(dbCards.map(c => c.id));
      onAction('initDeck', { deckState: newDeck });
      setMessage('Deck initialised! Draw again.');
      return;
    }

    setIsDrawingCard(true);

    setTimeout(() => {
      const latestDeck = (gameDataRef.current.deckState as DeckState) || currentDeck;
      const result = drawFromDeck(latestDeck);

      if (!result.cardId) {
        setMessage('No cards in deck!');
        setIsDrawingCard(false);
        return;
      }

      onAction('updateDeck', { deckState: result.deckState });

      if (result.reshuffled) {
        setMessage('Discard pile reshuffled back into the deck!');
      }

      const card = dbCardsMap.get(result.cardId) || dbCards.find(c => c.id === result.cardId);
      if (!card) {
        setMessage('Card not found in local data!');
        setIsDrawingCard(false);
        return;
      }

      const action = parseLocalCardEffect(card);
      setDrawnDbCard(card);
      setParsedAction(action);
      setIsDrawingCard(false);
    }, 800);
  };

  // ── Execute a parsed card action ──────────────────────────────────

  const executeAction = useCallback(
    (action: ParsedCardAction, targetPlayerId?: string): boolean => {
      const gd = gameDataRef.current;
      const pos = { ...(gd.positions || {}) };
      const pad = { ...(gd.paddles || {}) };
      const sk = { ...(gd.skipTurn || {}) };
      const er = { ...(gd.extraRoll || {}) };
      const sy = { ...(gd.skipYellow || {}) };

      const playerId = currentPlayer?.player_id;
      if (!playerId) return false;

      if (!pad[playerId]) pad[playerId] = 1;
      const myPos = pos[playerId] || 0;

      switch (action.type) {
        case 'move_back':
          pos[playerId] = Math.max(0, myPos - (action.value || 2));
          setMessage(`Moved back ${action.value || 2} spaces!`);
          break;

        case 'move_forward':
          pos[playerId] = Math.min(FINISH_SPACE, myPos + (action.value || 2));
          setMessage(`Moved forward ${action.value || 2} spaces!`);
          break;

        case 'paddle_gain':
          pad[playerId] = (pad[playerId] || 1) + 1;
          setMessage('Got a paddle! +1');
          break;

        case 'paddle_lose':
          pad[playerId] = Math.max(0, (pad[playerId] || 1) - 1);
          setMessage('Lost a paddle! -1');
          break;

        case 'paddle_steal':
          if (targetPlayerId && (pad[targetPlayerId] || 0) > 0) {
            pad[targetPlayerId]--;
            pad[playerId] = (pad[playerId] || 1) + 1;
            setMessage(`Stole a paddle from ${players.find(p => p.player_id === targetPlayerId)?.player_name}!`);
          } else {
            setMessage('Target has no paddles to steal!');
          }
          break;

        case 'paddle_gift_right': {
          const rightId = getPlayerToRight();
          if (rightId && pad[playerId] > 0) {
            pad[playerId]--;
            pad[rightId] = (pad[rightId] || 1) + 1;
            setMessage(`Gifted a paddle to ${players.find(p => p.player_id === rightId)?.player_name}!`);
          } else {
            setMessage('No paddle to gift!');
          }
          break;
        }

        case 'paddle_gift_choose':
          if (targetPlayerId && pad[playerId] > 0) {
            pad[playerId]--;
            pad[targetPlayerId] = (pad[targetPlayerId] || 1) + 1;
            setMessage(`Gifted a paddle to ${players.find(p => p.player_id === targetPlayerId)?.player_name}!`);
          } else {
            setMessage('No paddle to gift!');
          }
          break;

        case 'lose_turn':
          sk[playerId] = true;
          setMessage('You lose your next turn!');
          break;

        case 'extra_turn':
          er[playerId] = true;
          setMessage('Take another turn!');
          break;

        case 'draw_again':
          setMessage('Draw again!');
          break;

        case 'go_to_space': {
          if (action.targetSpace) {
            const target =
              action.targetSpace === 'shit_pile'
                ? findClosestSpaceOfType(myPos, action.targetSpace)
                : findNextSpaceOfType(myPos, action.targetSpace);
            pos[playerId] = target;
            setMessage(`Moved to ${SPACE_EFFECTS[target]?.spaceName || String(action.targetSpace)} (space ${target})!`);
          }
          break;
        }

        case 'go_to_space_and_gain_paddle': {
          if (action.targetSpace) {
            const target = findClosestSpaceOfType(myPos, action.targetSpace);
            pos[playerId] = target;
            pad[playerId] = (pad[playerId] || 1) + 1;
            setMessage('Moved to Paddle Shop and got a free paddle!');
          }
          break;
        }

        case 'take_lead': {
          const maxPos = Math.max(...Object.values(pos).map(p => (typeof p === 'number' ? p : 0)));
          if (maxPos > myPos) pos[playerId] = Math.min(maxPos + 1, FINISH_SPACE);
          setMessage('You took the lead!');
          break;
        }

        case 'move_ahead_of_player':
          if (targetPlayerId) {
            const theirPos = pos[targetPlayerId] || 0;
            pos[playerId] = Math.min(theirPos + 1, FINISH_SPACE);
            setMessage(`Moved ahead of ${players.find(p => p.player_id === targetPlayerId)?.player_name}!`);
          }
          break;

        case 'behind_leader': {
          const leaderPos = Math.max(...Object.values(pos).map(p => (typeof p === 'number' ? p : 0)));
          pos[playerId] = Math.max(0, leaderPos - (action.value || 3));
          setMessage(`Moved to ${action.value || 3} spaces behind the leader!`);
          break;
        }

        case 'send_player_to':
          if (targetPlayerId && action.targetSpace) {
            const target = findClosestSpaceOfType(pos[targetPlayerId] || 0, action.targetSpace);
            pos[targetPlayerId] = target;
            setMessage(`Sent ${players.find(p => p.player_id === targetPlayerId)?.player_name} to ${SPACE_EFFECTS[target]?.spaceName || String(action.targetSpace)}!`);
          }
          break;

        case 'bring_player':
          if (targetPlayerId) {
            pos[targetPlayerId] = myPos;
            setMessage(`Brought ${players.find(p => p.player_id === targetPlayerId)?.player_name} to your space!`);
          }
          break;

        case 'bring_all_players':
          players.forEach(p => { pos[p.player_id] = myPos; });
          setMessage('Brought all players to your space!');
          break;

        case 'go_back_with_player': {
          const closestId = getClosestPlayer();
          const backSpaces = action.value || 3;
          pos[playerId] = Math.max(0, myPos - backSpaces);
          if (closestId) {
            pos[closestId] = Math.max(0, (pos[closestId] || 0) - backSpaces);
            setMessage(`You and ${players.find(p => p.player_id === closestId)?.player_name} went back ${backSpaces} spaces!`);
          } else {
            setMessage(`Went back ${backSpaces} spaces!`);
          }
          break;
        }

        case 'move_player_behind_last':
          if (targetPlayerId) {
            const minPos = Math.min(...Object.values(pos).map(p => (typeof p === 'number' ? p : 0)));
            pos[targetPlayerId] = Math.max(0, minPos - 1);
            setMessage(`Moved ${players.find(p => p.player_id === targetPlayerId)?.player_name} behind last place!`);
          }
          break;

        case 'skip_yellow':
          sy[playerId] = true;
          setMessage('You can skip the next Shit Pile space!');
          break;

        case 'move_both_to_space': {
          if (action.targetSpace) {
            const target = findClosestSpaceOfType(myPos, action.targetSpace);
            pos[playerId] = target;
            if (targetPlayerId) {
              pos[targetPlayerId] = target;
              setMessage(`You and ${players.find(p => p.player_id === targetPlayerId)?.player_name} moved to ${SPACE_EFFECTS[target]?.spaceName || String(action.targetSpace)}!`);
            }
          }
          break;
        }
      }

      if ((pos[playerId] || 0) >= FINISH_SPACE && (pad[playerId] || 0) >= 2) {
        onAction('win', { winner: playerId, positions: pos, paddles: pad });
        return false;
      }

      onAction('cardEffect', {
        positions: pos,
        paddles: pad,
        skipTurn: sk,
        extraRoll: er,
        skipYellow: sy,
        lastCard: { text: action.text, type: action.type },
      });

      return action.type === 'draw_again';
    },
    [currentPlayer, players, onAction, getClosestPlayer],
  );

  // ── Handle "Continue" after viewing drawn card ────────────────────

  const handleCardContinue = useCallback(() => {
    if (!parsedAction) {
      closeCardModal();
      nextTurn();
      return;
    }

    if (parsedAction.needsPlayerSelect) {
      const otherPlayers = players.filter(p => p.player_id !== currentPlayer?.player_id);
      if (otherPlayers.length === 0) {
        setMessage('No other players to target!');
        closeCardModal();
        setTimeout(() => nextTurn(), 800);
        return;
      }

      let prompt = 'Select a player';
      switch (parsedAction.type) {
        case 'paddle_steal': prompt = 'Select a player to steal a paddle from'; break;
        case 'paddle_gift_choose': prompt = 'Select a player to gift a paddle to'; break;
        case 'send_player_to': prompt = `Select a player to send to ${String(parsedAction.targetSpace).replace('_', ' ')}`; break;
        case 'bring_player': prompt = 'Select a player to bring to your space'; break;
        case 'move_ahead_of_player': prompt = 'Select a player to move ahead of'; break;
        case 'move_player_behind_last': prompt = 'Select a player to move behind last place'; break;
        case 'move_both_to_space': prompt = `Select a player to move to ${String(parsedAction.targetSpace).replace('_', ' ')} with you`; break;
      }

      setPlayerPickerPrompt(prompt);
      setPendingAction(parsedAction);
      setShowCardModal(false);
      setShowPlayerPicker(true);
      setWaitingForCard(false);
      return;
    }

    const shouldDrawAgain = executeAction(parsedAction);
    setShowCardModal(false);
    setWaitingForCard(false);
    setDrawnDbCard(null);
    setParsedAction(null);

    if (shouldDrawAgain) {
      setTimeout(() => {
        setShowCardModal(true);
        setWaitingForCard(true);
        setDrawnDbCard(null);
        setParsedAction(null);
      }, 600);
    } else {
      setTimeout(() => nextTurn(), 1000);
    }
  }, [parsedAction, players, currentPlayer, executeAction]);

  // ── Handle player selection from picker ───────────────────────────

  const handlePlayerSelected = useCallback(
    (targetPlayerId: string) => {
      if (!pendingAction) return;
      const shouldDrawAgain = executeAction(pendingAction, targetPlayerId);
      setShowPlayerPicker(false);
      setPendingAction(null);
      setDrawnDbCard(null);
      setParsedAction(null);

      if (shouldDrawAgain) {
        setTimeout(() => {
          setShowCardModal(true);
          setWaitingForCard(true);
          setDrawnDbCard(null);
          setParsedAction(null);
        }, 600);
      } else {
        setTimeout(() => nextTurn(), 1000);
      }
    },
    [pendingAction, executeAction],
  );

  // ── Close modals ──────────────────────────────────────────────────

  const closeCardModal = () => {
    setShowCardModal(false);
    setWaitingForCard(false);
    setDrawnDbCard(null);
    setParsedAction(null);
  };

  // ── Roll dice ─────────────────────────────────────────────────────

  const rollDice = () => {
    if (!isCurrentPlayer || rolling || isPaused || waitingForCard || showPlayerPicker) return;

    const playerId = currentPlayer.player_id;

    if (skipTurn[playerId]) {
      const newSkip = { ...skipTurn, [playerId]: false };
      setMessage('Turn skipped!');
      onAction('update', { skipTurn: newSkip });
      setTimeout(() => nextTurn(newSkip), 1000);
      return;
    }

    setRolling(true);
    setMessage('');
    setLandedSpaceEffect(null);
    setLandedSpaceIndex(null);

    setTimeout(() => {
      const latestData = gameDataRef.current;
      const latestPositions = latestData.positions || {};
      const latestPaddles = latestData.paddles || {};

      const roll = Math.floor(Math.random() * 6) + 1;
      const currentPos = latestPositions[playerId] || 0;
      const newPos = Math.min(currentPos + roll, FINISH_SPACE);

      const newPaddles = { ...latestPaddles };
      if (!newPaddles[playerId]) newPaddles[playerId] = 1;

      if (newPos >= FINISH_SPACE) {
        if (newPaddles[playerId] >= 2) {
          onAction('win', {
            winner: playerId,
            dice: roll,
            positions: { ...latestPositions, [playerId]: FINISH_SPACE },
            paddles: newPaddles,
          });
          setRolling(false);
          return;
        } else {
          setMessage('Need 2 paddles to win! Collect more paddles!');
        }
      }

      const newPositions = { ...latestPositions, [playerId]: newPos };
      const result = applySpaceEffect(newPos, newPositions, newPaddles, playerId);

      setMessage(result.message || '');

      if (result.needsCard) {
        setWaitingForCard(true);
        setShowCardModal(true);
        setDrawnDbCard(null);
        setParsedAction(null);
        onAction('move', { dice: roll, positions: result.positions, paddles: result.paddles });
        setRolling(false);
        return;
      }

      if ((result as any).skipTurn) {
        onAction('move', {
          dice: roll,
          positions: result.positions,
          paddles: result.paddles,
          skipTurn: { ...skipTurn, [playerId]: true },
        });
        setRolling(false);
        setTimeout(() => nextTurn(), 1500);
        return;
      }

      if ((result as any).extraRoll) {
        onAction('move', {
          dice: roll,
          positions: result.positions,
          paddles: result.paddles,
          extraRoll: { ...extraRoll, [playerId]: true },
        });
        setRolling(false);
        return;
      }

      onAction('move', { dice: roll, positions: result.positions, paddles: result.paddles });
      setRolling(false);

      setTimeout(() => nextTurn(), 1500);
    }, 800);
  };

  // ── Next turn ─────────────────────────────────────────────────────

  const nextTurn = (currentSkip?: Record<string, boolean>) => {
    const next = (currentTurn + 1) % players.length;
    onAction('nextTurn', {
      currentTurn: next,
      lastCard: null,
      skipTurn: currentSkip || skipTurn,
      extraRoll: {},
    });
    setMessage('');
    setLandedSpaceEffect(null);
    setLandedSpaceIndex(null);
  };

  // ── Winner screen ─────────────────────────────────────────────────

  if (winner) {
    const winnerPlayer = players.find(p => p.player_id === winner);
    const winnerName = winnerPlayer?.player_name || 'Unknown';
    return (
      <div className="bg-gradient-to-br from-amber-900 via-yellow-800 to-amber-900 rounded-xl p-6 text-center">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-3xl font-bold text-yellow-400 mb-2">Winner!</h2>
        <p className="text-xl text-white">
          {winnerName} {winnerPlayer?.isBot ? '(Bot)' : ''} made it up Shitz Creek!
        </p>
        <Button
          onClick={() =>
            onAction('reset', {
              positions: {},
              paddles: {},
              winner: null,
              currentTurn: 0,
              dice: 1,
              skipTurn: {},
              extraRoll: {},
              skipYellow: {},
              lastCard: null,
              deckState: null,
            })
          }
          className="mt-4 bg-amber-600 hover:bg-amber-500"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Play Again
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────

  const displaySpaceIndex = landedSpaceIndex !== null ? landedSpaceIndex : (positions[currentPlayer?.player_id] || 0);
  const displaySpaceEffect = landedSpaceEffect || getSpaceEffect(positions[currentPlayer?.player_id] || 0);

  return (
    <div className="bg-gradient-to-br from-amber-900 via-yellow-800 to-amber-900 rounded-xl p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-white">Up Shitz Creek</h3>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSpaceInfo(!showSpaceInfo)}
            className="text-amber-200 hover:text-white"
          >
            <Info className="w-4 h-4 mr-1" />
            Spaces
          </Button>
          {onHint && (
            <Button onClick={onHint} variant="outline" size="sm" className="text-amber-300 border-amber-500">
              <Lightbulb className="w-4 h-4 mr-1" />
              Hint
            </Button>
          )}
        </div>
      </div>

      {/* Deck Tracker */}
      <div className="mb-3">
        <ShitzCreekDeckTracker deckState={deckState} loading={cardsLoading} />
      </div>

      {/* Cards loading error */}
      {cardsError && (
        <div className="bg-red-900/60 border border-red-500/50 rounded-lg p-3 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div className="text-sm text-red-200 flex-1">
            <span className="font-semibold">Card loading failed:</span> {cardsError}
          </div>
          <Button variant="link" size="sm" onClick={loadCardsFromAssets} className="text-red-300 underline p-0 h-auto">
            Retry
          </Button>
        </div>
      )}

      {/* Space Info Panel */}
      {showSpaceInfo && (
        <div className="bg-black/50 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
          <h4 className="text-amber-300 font-bold mb-2">Space Effects:</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {SPACE_EFFECTS.map((effect, idx) => (
              <div key={idx} className={`flex items-center gap-1 p-1 rounded ${getSpaceColor(effect)}`}>
                <span>{effect.emoji}</span>
                <span className="text-white">
                  {idx}: {effect.type === 'none' ? (idx === 0 ? 'Start' : idx === 25 ? 'Finish' : 'Safe') : effect.type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skip-shit-pile token indicator */}
      {currentPlayer && skipYellow[currentPlayer.player_id] && (
        <div className="bg-yellow-600/40 border border-yellow-500/50 rounded-lg p-2 mb-3 text-center text-yellow-200 text-sm flex items-center justify-center gap-2">
          <span>🛡️</span> Skip Shit Pile token active!
        </div>
      )}

      {/* Game Board */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-blue-900 via-blue-700 to-green-800 rounded-xl overflow-hidden border-4 border-amber-600 mb-4">
        {loadingBoard ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : boardImage ? (
          <img
            src={boardImage}
            alt="Shitz Creek Game Board"
            className="absolute inset-0 w-full h-full object-contain bg-amber-900"
          />
        ) : (
          <>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d={`M ${BOARD_SPACES.map(s => `${s.x},${s.y}`).join(' L ')}`}
                fill="none"
                stroke="rgba(139, 69, 19, 0.5)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {BOARD_SPACES.map((space, idx) => {
              const effect = getSpaceEffect(idx);
              return (
                <div
                  key={idx}
                  className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-xs transform -translate-x-1/2 -translate-y-1/2 border-2 border-white/50 ${getSpaceColor(effect)}`}
                  style={{ left: `${space.x}%`, top: `${space.y}%` }}
                  title={effect.text}
                >
                  {effect.emoji}
                </div>
              );
            })}
          </>
        )}

        {/* Player pieces */}
        {players.map((player, idx) => {
          const pos = positions[player.player_id] || 0;
          const space = BOARD_SPACES[Math.min(pos, BOARD_SPACES.length - 1)];
          const offset = idx * 3;

          return (
            <div
              key={player.player_id}
              className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${getPlayerColor(idx)} ring-2 ring-white shadow-lg`}
              style={{
                left: `${space.x + offset}%`,
                top: `${space.y - 5}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: player.player_id === currentPlayerId ? 10 : 5,
              }}
              title={`${player.player_name} - Space ${pos}`}
            >
              {player.isBot ? player.avatar || '🤖' : '💩'}
            </div>
          );
        })}
      </div>

      {/* Current space effect display */}
      {currentPlayer && (
        <div className={`rounded-lg p-2 mb-3 text-center text-white text-sm ${getSpaceColor(displaySpaceEffect)}`}>
          <span className="mr-2">{displaySpaceEffect.emoji}</span>
          Space {displaySpaceIndex}: {displaySpaceEffect.text}
        </div>
      )}

      {/* Dice and controls */}
      <div className="flex justify-center items-center gap-4 mb-4">
        <div className={`bg-amber-700 rounded-xl p-3 ${rolling ? 'animate-bounce' : ''}`}>
          <DiceIcon value={dice} />
        </div>
        <Button
          onClick={rollDice}
          disabled={!isCurrentPlayer || rolling || isPaused || waitingForCard || showPlayerPicker}
          className="bg-yellow-600 hover:bg-yellow-500 text-lg px-6 py-4"
        >
          {rolling
            ? 'Rolling...'
            : waitingForCard
              ? 'Draw Card First!'
              : skipTurn[currentPlayer?.player_id]
                ? 'Skip Turn'
                : extraRoll[currentPlayer?.player_id]
                  ? 'Roll Again!'
                  : 'Roll Dice'}
        </Button>
      </div>

      {/* Message */}
      {message && message !== displaySpaceEffect.text && (
        <div className="bg-red-600/50 rounded-lg p-3 mb-4 text-center text-white animate-pulse">
          {message}
        </div>
      )}

      {/* Last card effect */}
      {lastCard && (
        <div className="bg-yellow-600/30 rounded-lg p-3 mb-4 text-center text-yellow-200">
          {lastCard.text}
        </div>
      )}

      {/* Players list */}
      <div className="bg-black/30 rounded-lg p-3">
        <h4 className="text-white font-bold mb-2">Players</h4>
        <div className="space-y-2">
          {players.map((p, idx) => (
            <div
              key={p.player_id}
              className={`flex justify-between items-center py-2 px-3 rounded ${
                idx === currentTurn ? 'bg-amber-600/50 ring-1 ring-amber-400' : 'bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full ${getPlayerColor(idx)} flex items-center justify-center text-sm`}>
                  {p.isBot ? p.avatar || '🤖' : '💩'}
                </div>
                <span className={`${p.player_id === currentPlayerId ? 'text-green-400' : 'text-white'}`}>
                  {p.player_name} {p.player_id === currentPlayerId && '(You)'}
                  {p.isBot && <span className="text-xs text-purple-300 ml-1">[Bot]</span>}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {skipYellow[p.player_id] && (
                  <span className="text-xs bg-yellow-600/50 text-yellow-200 px-1.5 py-0.5 rounded" title="Skip Yellow token">
                    🛡️
                  </span>
                )}
                {skipTurn[p.player_id] && (
                  <span className="text-xs bg-gray-600/50 text-gray-300 px-1.5 py-0.5 rounded">
                    Skip
                  </span>
                )}
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                  {getSpaceEffect(positions[p.player_id] || 0).emoji} Space {positions[p.player_id] || 0}
                </span>
                <PaddleIcon count={paddles[p.player_id] || 1} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-black/20 rounded-lg p-3">
        <h4 className="text-amber-300 font-semibold mb-1">How to Play:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>Roll the dice and move up the creek</li>
          <li>Each space has a unique effect - check the Space Guide!</li>
          <li>Land on shit-pile spaces to draw a local card from the deck</li>
          <li>Cards are drawn without replacement - when the deck runs out, the discard pile is reshuffled back in</li>
          <li>Some cards let you target other players</li>
          <li>Collect 2 paddles to be able to win</li>
          <li>Reach the finish with 2 paddles to win!</li>
        </ul>
      </div>

      {/* ─── Card Modal ──────────────────────────────────────────── */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-amber-900 to-yellow-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border-4 border-amber-600">
            <h3 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
              <span className="text-3xl">💩</span> Shit Pile Card!
            </h3>

            <div className={`relative aspect-[3/4] rounded-xl overflow-hidden mb-4 ${isDrawingCard ? 'animate-pulse' : ''}`}>
              {drawnDbCard && parsedAction ? (
                <div className="w-full h-full relative rounded-xl overflow-hidden" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  {drawnDbCard.image_url ? (
                    <img
                      src={drawnDbCard.image_url}
                      alt={drawnDbCard.card_name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${getCardActionColor(parsedAction)}`} />
                  )}

                  <div className="absolute inset-0 bg-black/35" />

                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="bg-black/40 rounded-lg px-3 py-2 mb-2">
                      <p className="text-amber-300 text-xs font-mono">{drawnDbCard.card_name}</p>
                    </div>
                    <p className="text-white font-bold text-sm leading-snug">
                      {drawnDbCard.card_effect}
                    </p>

                    {parsedAction.needsPlayerSelect && (
                      <div className="mt-2 flex items-center gap-1 text-yellow-300 text-xs">
                        <Users className="w-4 h-4" />
                        <span>Choose a player next</span>
                      </div>
                    )}

                    {parsedAction.targetSpace && (
                      <div className="mt-2 text-amber-200 text-xs">
                        Target: {String(parsedAction.targetSpace).replace('_', ' ').toUpperCase()} space
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-700 to-amber-900">
                  <div className="text-7xl mb-4 animate-bounce">💩</div>
                  <p className="text-amber-200 font-bold text-lg">Shit Pile</p>
                  <p className="text-amber-300/70 text-sm mt-1">Draw a card!</p>
                </div>
              )}
            </div>

            {parsedAction && (
              <div className="bg-gradient-to-r from-yellow-600/80 to-amber-600/80 rounded-lg p-4 mb-4 text-center border-2 border-yellow-400">
                <p className="text-white font-bold text-lg">{parsedAction.text}</p>
                <p className="text-amber-200 text-xs mt-1 capitalize">{parsedAction.type.replace(/_/g, ' ')}</p>
              </div>
            )}

            {!drawnDbCard ? (
              <Button
                onClick={drawCard}
                disabled={isDrawingCard || dbCards.length === 0}
                className="w-full bg-amber-600 hover:bg-amber-500 text-lg py-6 font-bold"
              >
                {isDrawingCard ? (
                  <>
                    <Shuffle className="w-5 h-5 mr-2 animate-spin" />
                    Drawing...
                  </>
                ) : dbCards.length === 0 ? (
                  <>
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {cardsLoading ? 'Loading Cards...' : 'No Cards Loaded'}
                  </>
                ) : (
                  <>
                    <Shuffle className="w-5 h-5 mr-2" />
                    Draw Card
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleCardContinue}
                className="w-full bg-green-600 hover:bg-green-500 text-lg py-6 font-bold animate-pulse"
              >
                <Check className="w-5 h-5 mr-2" />
                {parsedAction?.needsPlayerSelect ? 'Choose Player' : 'Continue'}
              </Button>
            )}

            <div className="mt-3">
              <ShitzCreekDeckTracker deckState={deckState} loading={cardsLoading} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Player Picker Modal ─────────────────────────────────── */}
      {showPlayerPicker && pendingAction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border-4 border-purple-500">
            <h3 className="text-xl font-bold text-white mb-2 text-center flex items-center justify-center gap-2">
              <Users className="w-6 h-6 text-purple-300" />
              Choose a Player
            </h3>
            <p className="text-purple-200 text-sm text-center mb-4">{playerPickerPrompt}</p>

            <div className="bg-black/30 rounded-lg p-3 mb-4 text-center">
              <span className="text-2xl mr-2">{getCardActionIcon(pendingAction)}</span>
              <span className="text-white font-bold">{pendingAction.text}</span>
            </div>

            <div className="space-y-2">
              {players
                .filter(p => p.player_id !== currentPlayer?.player_id)
                .map(p => (
                  <button
                    key={p.player_id}
                    onClick={() => handlePlayerSelected(p.player_id)}
                    className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 border-2 border-transparent hover:border-purple-400 rounded-xl p-4 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.isBot ? p.avatar || '🤖' : '💩'}</span>
                      <div className="text-left">
                        <p className="text-white font-bold">
                          {p.player_name}
                          {p.isBot && <span className="text-xs text-purple-300 ml-1">[Bot]</span>}
                        </p>
                        <p className="text-purple-300 text-xs">
                          Space {positions[p.player_id] || 0} &middot; {paddles[p.player_id] || 1} paddle
                          {(paddles[p.player_id] || 1) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-white transition-colors" />
                  </button>
                ))}
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setShowPlayerPicker(false);
                setPendingAction(null);
                setTimeout(() => nextTurn(), 500);
              }}
              className="w-full mt-4 border-purple-500 text-purple-200 hover:bg-purple-800"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ─── Bot Card Reveal Overlay ─────────────────────────────── */}
      {botCardReveal && onBotCardDismiss && (
        <BotCardRevealOverlay
          data={botCardReveal}
          onDismiss={onBotCardDismiss}
          duration={2500}
        />
      )}
    </div>
  );
}
