import React from 'react';
import { Link } from 'react-router-dom';
import { games } from '@/data/gamesData';
import { Game } from '@/types/game';
import GameCard from './GameCard';
import { useLogo } from '@/contexts/LogoContext';
import { GraduationCap, Bot, Zap, Target } from 'lucide-react';

interface GamesSectionProps {
  onViewDetails: (game: Game) => void;
}

const GamesSection: React.FC<GamesSectionProps> = ({
  onViewDetails
}) => {
  const { logoUrl } = useLogo();
  
  return (
    <section id="games" className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          {/* Logo above section title - Dynamic from LogoContext */}
          <div className="mb-6 flex justify-center">
            <img 
              src={logoUrl} 
              alt="Dafish Boyz" 
              className="w-16 h-16 object-contain opacity-80"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          <span className="inline-block bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm font-bold mb-4">
            OUR COLLECTION
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-lime-400">Complete FunShit</span> Collection
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Six hilariously inappropriate games that will make your game nights unforgettable. Play online or grab the physical versions.
          </p>
        </div>

        {/* Practice Mode Banner */}
        <Link 
          to="/practice"
          className="block mb-8 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/60 transition-all group"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Practice Mode
                  <span className="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded-full">NEW</span>
                </h3>
                <p className="text-gray-400 text-sm">Learn games with AI opponents, get hints from Coach Bot, and master your skills!</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-4 text-gray-400 text-sm">
                <span className="flex items-center gap-1"><Bot className="w-4 h-4 text-purple-400" /> AI Bots</span>
                <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-400" /> Instant Start</span>
                <span className="flex items-center gap-1"><Target className="w-4 h-4 text-green-400" /> Undo Moves</span>
              </div>
              <div className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                Start Practicing
              </div>
            </div>
          </div>
        </Link>
        
        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map(game => <GameCard key={game.id} game={game} onViewDetails={onViewDetails} />)}
        </div>

        {/* Branding footer for section */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex items-center gap-3 text-gray-500 text-sm">
            <img 
              src={logoUrl} 
              alt="Dafish Boyz" 
              className="w-5 h-5 object-contain opacity-50"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <span>All games by DAFISH BOYZ</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamesSection;
