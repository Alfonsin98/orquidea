import React from 'react';
import { Flower2, Brain, BookOpen, HardDriveDownload } from 'lucide-react';

export type TabKey = 'collection' | 'insights' | 'catalog' | 'settings';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-tab-btn ${currentTab === 'collection' ? 'active' : ''}`}
        onClick={() => onSelectTab('collection')}
      >
        <Flower2 size={22} />
        <span>Orquídeas</span>
      </button>

      <button
        className={`nav-tab-btn ${currentTab === 'insights' ? 'active' : ''}`}
        onClick={() => onSelectTab('insights')}
      >
        <Brain size={22} />
        <span>IA & Tips</span>
      </button>

      <button
        className={`nav-tab-btn ${currentTab === 'catalog' ? 'active' : ''}`}
        onClick={() => onSelectTab('catalog')}
      >
        <BookOpen size={22} />
        <span>Catálogo</span>
      </button>

      <button
        className={`nav-tab-btn ${currentTab === 'settings' ? 'active' : ''}`}
        onClick={() => onSelectTab('settings')}
      >
        <HardDriveDownload size={22} />
        <span>Respaldo</span>
      </button>
    </nav>
  );
};

