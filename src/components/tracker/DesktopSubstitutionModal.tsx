import React from 'react';

interface Player {
  id: string;
  name: string;
  number?: string;
}

interface DesktopSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerOut: Player | null;
  benchPlayers: Player[];
  onConfirm: (playerInId: string) => void;
}

export const DesktopSubstitutionModal: React.FC<DesktopSubstitutionModalProps> = ({
  isOpen,
  onClose,
  playerOut,
  benchPlayers,
  onConfirm
}) => {
  if (!isOpen || !playerOut) return null;

  const handlePlayerSelect = (playerId: string) => {
    onConfirm(playerId);
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    margin: 0,
    padding: '16px',
  };

  const modalStyle: React.CSSProperties = {
    background: 'rgba(30, 30, 30, 0.95)',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '400px',
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#ea580c',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    zIndex: 10000,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: '20px',
    lineHeight: '1.3',
    padding: '0 8px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
    maxWidth: '100%',
  };

  const playerButtonStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '14px 10px',
    borderRadius: '12px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#4a4a4a',
    background: 'rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '80px',
    minWidth: '60px',
    touchAction: 'manipulation',
  };

  const playerImageStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#4a4a4a',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
  };

  const playerNameStyle: React.CSSProperties = {
    fontSize: '11px',
    textAlign: 'center',
    lineHeight: '1.2',
    marginBottom: '4px',
    color: '#ffffff',
    fontWeight: '500',
  };

  const cancelButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    background: '#666666',
    color: '#ffffff',
    transition: 'all 0.2s ease',
    touchAction: 'manipulation',
    minHeight: '48px',
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <div style={titleStyle}>
          Select player to sub in for {playerOut.name}:
        </div>
        <div style={gridStyle}>
          {benchPlayers.map((player) => (
            <button
              key={player.id}
              style={playerButtonStyle}
              onClick={() => handlePlayerSelect(player.id)}
            >
              <div style={playerImageStyle}>
                {player.number || player.name.charAt(0)}
              </div>
              <div style={playerNameStyle}>
                {player.name}
              </div>
            </button>
          ))}
        </div>
        <button 
          style={cancelButtonStyle}
          onClick={onClose}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};
