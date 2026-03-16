import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  transitionKey: string;
  direction?: 'left' | 'right' | 'up';
}

export function PageTransition({ children, transitionKey, direction }: Props) {
  const animName = direction === 'left'
    ? 'slide-in-left'
    : direction === 'right'
    ? 'slide-in-right'
    : 'slide-up';

  return (
    <div
      key={transitionKey}
      className="w-full h-full"
      style={{
        animation: `${animName} 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
      }}
    >
      {children}
    </div>
  );
}
