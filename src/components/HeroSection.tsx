import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Pause, Play } from 'lucide-react';
import { useLogo } from '@/contexts/LogoContext';

interface HeroSectionProps {
  onShopClick: () => void;
  onPricingClick: () => void;
}

const DAFISH_BOYZ_THEME_URL = 'https://yrfjejengmkqpjbluexn.supabase.co/storage/v1/object/public/audio/DaFish-Boyz-theme-song.mp3';


const HeroSection: React.FC<HeroSectionProps> = ({ onShopClick, onPricingClick }) => {
  const navigate = useNavigate();
  const { logoUrl } = useLogo();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayTheme = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(DAFISH_BOYZ_THEME_URL);
      audioRef.current.volume = 0.7;
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      setIsPlaying(true);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: 'url(https://d64gsuwffb70l.cloudfront.net/692bcf0e39ef29fa4b4a1d04_1764479278725_d55d9805.webp)'
      }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Logo at top of hero - Dynamic from LogoContext */}
        <div className="mb-8 flex justify-center mt-16">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/30 via-lime-500/30 to-amber-500/30 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
            <img 
              src={logoUrl} 
              alt="Dafish Boyz Logo" 
              className="relative w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl rounded-2xl"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.6))'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
        </div>
        
        <div className="inline-block bg-lime-500 text-black px-4 py-2 rounded-full text-sm font-bold mb-6 animate-bounce">
          NEW: Play Online Multiplayer!
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 leading-tight">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-lime-400">DaFish Boyz Funshitgames</span>
          When your day is Sh*tty
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Fun Shit games for adults who refuse to grow up. Play online with friends or get the physical games delivered to your door.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button onClick={onShopClick} className="px-8 py-4 bg-gradient-to-r from-amber-500 to-lime-500 hover:from-amber-400 hover:to-lime-400 text-black font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-amber-500/30">
            Shop Games
          </button>
          <button onClick={() => navigate('/lobby')} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30">
            Play Online
          </button>
        </div>
        
        {/* DaFish Boyz Theme Song Button */}
        <button
          onClick={handlePlayTheme}
          className={`group px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white font-bold text-base rounded-full transition-all transform hover:scale-110 shadow-lg shadow-pink-600/40 flex items-center gap-3 mx-auto border-2 border-pink-400/50 ${isPlaying ? 'animate-pulse ring-4 ring-pink-400' : ''}`}
        >
          <Music className={`w-5 h-5 ${isPlaying ? 'animate-spin' : 'group-hover:animate-bounce'}`} />
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5" />
              <span>Pause Theme</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Play DaFish Boyz Theme</span>
            </>
          )}
        </button>

        <div className="mt-12 flex items-center justify-center gap-8 text-gray-400">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">6</p>
            <p className="text-sm">Hilarious Games</p>
          </div>
          <div className="w-px h-12 bg-gray-700" />
          <div className="text-center">
            <p className="text-3xl font-bold text-white">50K+</p>
            <p className="text-sm">Games Sold</p>
          </div>
          <div className="w-px h-12 bg-gray-700" />
          <div className="text-center">
            <p className="text-3xl font-bold text-white">4.9</p>
            <p className="text-sm">Avg Rating</p>
          </div>
        </div>
        
        {/* Small logo badge at bottom */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-black/60 backdrop-blur-sm px-5 py-3 rounded-full border border-amber-500/40 shadow-lg">
            <img 
              src={logoUrl} 
              alt="Dafish Boyz" 
              className="w-8 h-8 object-contain rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <span className="text-amber-400 text-sm font-bold tracking-wide">DAFISH BOYZ FUNSHIT GAMES</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
