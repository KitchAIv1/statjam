'use client';

import React from 'react';

interface TabNavigationProps {
  activeTab: 'Feed' | 'Game' | 'Stats';
  onTabChange?: (tab: 'Feed' | 'Game' | 'Stats') => void;
}

/**
 * NBA-Style Tab Navigation Component
 * 
 * Clean tab navigation matching NBA.com design patterns.
 * Currently shows Feed tab as active, with placeholders for future tabs.
 */
const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  
  const tabs = [
    { id: 'Feed', label: 'Feed', active: true },
    { id: 'Game', label: 'Game', active: false, disabled: true },
    { id: 'Stats', label: 'Stats', active: false, disabled: true }
  ] as const;

  const handleTabClick = (tabId: 'Feed' | 'Game' | 'Stats') => {
    if (onTabChange && !tabs.find(t => t.id === tabId)?.disabled) {
      onTabChange(tabId);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(tab.id === activeTab ? styles.activeTab : {}),
              ...(tab.disabled ? styles.disabledTab : {})
            }}
            onClick={() => handleTabClick(tab.id)}
            disabled={tab.disabled}
          >
            <span style={{
              ...styles.tabLabel,
              ...(tab.id === activeTab ? styles.activeTabLabel : {}),
              ...(tab.disabled ? styles.disabledTabLabel : {})
            }}>
              {tab.label}
            </span>
            {tab.id === activeTab && (
              <div style={styles.activeIndicator} />
            )}
          </button>
        ))}
      </div>
      
      {/* Coming Soon Indicator */}
      <div style={styles.comingSoon}>
        <span style={styles.comingSoonText}>
          Game & Stats tabs coming soon
        </span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: '#1a1a1a',
    borderBottom: '1px solid #333',
    position: 'sticky' as const,
    top: '140px', // Below header
    zIndex: 90
  },
  tabContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px'
  },
  tab: {
    position: 'relative' as const,
    background: 'transparent',
    border: 'none',
    padding: '16px 24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  activeTab: {
    background: 'rgba(255, 215, 0, 0.1)'
  },
  disabledTab: {
    cursor: 'not-allowed',
    opacity: 0.5
  },
  tabLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#b3b3b3',
    transition: 'color 0.2s ease'
  },
  activeTabLabel: {
    color: '#FFD700'
  },
  disabledTabLabel: {
    color: '#666666'
  },
  activeIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: '#FFD700'
  },
  comingSoon: {
    padding: '8px 20px',
    background: 'rgba(75, 0, 130, 0.1)',
    borderTop: '1px solid #333'
  },
  comingSoonText: {
    fontSize: '12px',
    color: '#4B0082',
    fontWeight: '500'
  }
};

export default TabNavigation;