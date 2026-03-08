import { Game, Review, PricingPlan } from '@/types/game';

import CreekImage from '@/assets/images/games/shits-creek.webp';
import DeuceImage from '@/assets/images/games/deuce-drop.png';
import OcrapsImage from '@/assets/images/games/ocraps.png';
import ShitGoImage from '@/assets/images/games/shit-go.png';
import ShitoImage from '@/assets/images/games/shito.png';
import SlangingShitImage from '@/assets/images/games/slang-shit.png';

export const games: Game[] = [
  {
    id: 'up-shitz-creek',
    slug: 'up-shitz-creek',
    name: 'Up Shitz Creek',
    tagline: 'Navigate the chaos without a paddle!',
    description: 'A hilarious board game where players race through treacherous waters, avoiding obstacles and sabotaging opponents to reach safety first.',
    image: CreekImage,
    players: '2-6',
    playTime: '45-60 min',
    age: '17+',
    price: 25.00,
    category: 'Board Game'
  },
  {
    id: 'let-that-shit-go',
    slug: 'let-that-shit-go',
    name: 'Let That Shit Go',
    tagline: 'Release the drama, embrace the chaos!',
    description: 'A therapeutic party game where players compete to let go of their baggage in the most hilarious ways possible.',
    image: ShitGoImage,
    players: '3-8',
    playTime: '30-45 min',
    age: '17+',
    price: 25.00,
    category: 'Party Game'
  },

  {
    id: 'o-craps',
    slug: 'o-craps',
    name: 'O Craps',
    tagline: 'Roll the dice, take the risk!',
    description: 'A fast-paced dice game where luck and strategy collide in the most ridiculous ways.',
    image: OcrapsImage,
    players: '2-8',
    playTime: '20-30 min',
    age: '17+',
    price: 20.00,
    category: 'Dice Game'
  },
  {
    id: 'shito',
    slug: 'shito',
    name: 'Shito',
    tagline: 'The crappiest bingo you\'ll ever play!',
    description: 'A hilarious twist on classic bingo where players mark off ridiculous scenarios and shitty situations to win.',
    image: ShitoImage,
    players: '2-12',
    playTime: '20-30 min',
    age: '17+',
    price: 20.00,
    category: 'Bingo Game'
  },

  {

    id: 'drop-deuce',
    slug: 'drop-deuce',
    name: 'Drop A Deuce',
    tagline: 'The ultimate kids party game!',
    description: 'A hilarious and exciting party game perfect for kids birthdays and family gatherings! Players compete in silly challenges, wacky dares, and laugh-out-loud activities. Get ready to drop the fun!',
    image: DeuceImage,
    players: '3-10',
    playTime: '20-40 min',
    age: '6+',
    price: 15.00,
    category: 'Party Game'
  },


  {
    id: 'slanging-shit',
    slug: 'slanging-shit',
    name: 'Slanging Shit',
    tagline: 'Act it out, guess the crap!',
    description: 'A party charades game where players act out and guess the shitty words and phrases on the cards. No talking allowed!',
    image: SlangingShitImage,
    players: '4-10',
    playTime: '30-60 min',
    age: '18+',
    price: 15.00,
    category: 'Party Game'
  }
];

export const reviews: Review[] = [
  { id: '1', name: 'Mike T.', avatar: '', rating: 5, comment: 'Up Shitz Creek had us crying laughing! Best board game ever!', game: 'Up Shitz Creek' },
  { id: '2', name: 'Sarah L.', avatar: '', rating: 5, comment: 'O Craps is our new game night staple! So addictive!', game: 'O Craps' },
  { id: '3', name: 'Jake R.', avatar: '', rating: 4, comment: 'Shito bingo destroyed friendships. 10/10 would recommend!', game: 'Shito' },
  { id: '4', name: 'Emma K.', avatar: '', rating: 5, comment: 'Slanging Shit charades is hilarious! Everyone was dying!', game: 'Slanging Shit' },
  { id: '5', name: 'Chris M.', avatar: '', rating: 5, comment: 'Finally a game that matches my sense of humor!', game: 'Up Shitz Creek' },
  { id: '6', name: 'Lisa P.', avatar: '', rating: 5, comment: 'Bought the whole collection. No regrets!', game: 'O Craps' },
  { id: '7', name: 'Dave W.', avatar: '', rating: 4, comment: 'Warning: You will lose friends playing Shito bingo. Worth it.', game: 'Shito' },
  { id: '8', name: 'Amy H.', avatar: '', rating: 5, comment: 'The online version is perfect for remote game nights!', game: 'Slanging Shit' },
  { id: '9', name: 'Tom B.', avatar: '', rating: 5, comment: 'Let That Shit Go is surprisingly therapeutic AND hilarious!', game: 'Let That Shit Go' },
  { id: '10', name: 'Nina R.', avatar: '', rating: 5, comment: 'Drop A Deuce was the hit of my kid\'s birthday party! All the kids loved it!', game: 'Drop A Deuce' }


];

export const pricingPlans: PricingPlan[] = [
  { id: 'daily', name: '24-Hour Pass', price: 2, period: 'one-time', features: ['Access to ALL 6 games', '24 hours of unlimited play', 'Invite unlimited friends', 'Full online features'] },
  { id: 'monthly', name: 'Monthly Membership', price: 5, period: '/month', features: ['Access to ALL 6 games', 'Unlimited plays all month', 'Priority support', 'New games first', 'Cancel anytime'], popular: true },
  { id: 'annual', name: 'Annual Membership', price: 30, period: '/year', features: ['Access to ALL 6 games', 'Best value - Save 50%', 'Unlimited plays all year', 'Exclusive content', 'Physical game discount', 'Priority support'] }
];

