import { PowerUpType, PowerUpInventory, POWERUP_INFO } from '@/utils/powerups';

interface Props {
  inventory: PowerUpInventory;
  activeSecondChance: boolean;
  onUsePowerUp: (type: PowerUpType) => void;
  disabled?: boolean;
  vertical?: boolean;
}

export function PowerUpBar({ inventory, activeSecondChance, onUsePowerUp, disabled, vertical }: Props) {
  const types: PowerUpType[] = ['fiftyFifty', 'extraTime', 'secondChance'];

  return (
    <div className={`flex items-center gap-2 ${vertical ? 'flex-col' : 'justify-center'}`}>
      {types.map(type => {
        const info = POWERUP_INFO[type];
        const count = inventory[type];
        const isActive = type === 'secondChance' && activeSecondChance;
        const isDisabled = disabled || count <= 0 || isActive;

        return (
          <button
            key={type}
            onClick={() => !isDisabled && onUsePowerUp(type)}
            disabled={isDisabled}
            className={`relative flex items-center gap-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
              vertical ? 'px-2 py-2 min-w-[44px] min-h-[44px] justify-center' : 'px-2 py-1'
            } ${
              isActive
                ? 'glass border-2 border-primary text-primary animate-glow-pulse'
                : count > 0
                ? 'glass border border-foreground/20 text-foreground hover:bg-foreground/20 active:scale-110'
                : 'bg-background/30 border border-foreground/5 text-muted-foreground opacity-30'
            }`}
            title={info.description}
          >
            <span>{info.icon}</span>
            {!vertical && <span>{info.label}</span>}
            {count > 0 && !isActive && (
              <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-primary text-primary-foreground w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
            {isActive && (
              <span className="text-[9px] text-primary font-bold">ON</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
