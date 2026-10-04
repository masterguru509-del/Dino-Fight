import React, { useRef, useState } from 'react';
import { Zap, Shield } from 'lucide-react';

interface TouchControlsProps {
  touchActionRef: React.MutableRefObject<{
    moveX: number;
    moveY: number;
    lookX: number;
    lookY: number;
    isCharging: boolean;
    doDash: boolean;
    doJump: boolean;
    isBlocking: boolean;
  }>;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ touchActionRef }) => {
  const [joyPos, setJoyPos] = useState({ x: 0, y: 0 });
  const joyOrigin = useRef<{ x: number; y: number } | null>(null);
  const lookOrigin = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex md:hidden flex-col justify-end p-5">
      <div className="flex items-end justify-between w-full">
        {/* Left Virtual Joystick */}
        <div
          className="pointer-events-auto relative w-28 h-28 rounded-full bg-slate-900/50 border-2 border-white/20 backdrop-blur-sm flex items-center justify-center touch-none"
          onTouchStart={(e) => {
            const t = e.touches[0];
            joyOrigin.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchMove={(e) => {
            if (!joyOrigin.current) return;
            const t = e.touches[0];
            const dx = t.clientX - joyOrigin.current.x;
            const dy = t.clientY - joyOrigin.current.y;
            const maxR = 40;
            const dist = Math.min(maxR, Math.hypot(dx, dy));
            const angle = Math.atan2(dy, dx);
            const nx = (Math.cos(angle) * dist) / maxR;
            const ny = (Math.sin(angle) * dist) / maxR;
            setJoyPos({ x: nx * maxR, y: ny * maxR });
            touchActionRef.current.moveX = nx;
            touchActionRef.current.moveY = ny;
          }}
          onTouchEnd={() => {
            joyOrigin.current = null;
            setJoyPos({ x: 0, y: 0 });
            touchActionRef.current.moveX = 0;
            touchActionRef.current.moveY = 0;
          }}
        >
          <div
            className="w-12 h-12 rounded-full bg-emerald-400/80 shadow-lg"
            style={{ transform: `translate(${joyPos.x}px, ${joyPos.y}px)` }}
          />
        </div>

        {/* Right Action Buttons (Jump, Dash, Shield, Fire/Aim) */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5 touch-none">
          <div className="flex items-center gap-2">
            <button
              onTouchStart={() => (touchActionRef.current.doDash = true)}
              className="w-12 h-12 rounded-full bg-amber-500/80 border border-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg"
            >
              <Zap className="w-5 h-5" />
            </button>
            <button
              onTouchStart={() => (touchActionRef.current.isBlocking = true)}
              onTouchEnd={() => (touchActionRef.current.isBlocking = false)}
              className="w-12 h-12 rounded-full bg-cyan-500/80 border border-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg"
            >
              <Shield className="w-5 h-5" />
            </button>
            <button
              onTouchStart={() => (touchActionRef.current.doJump = true)}
              className="px-4 h-12 rounded-full bg-purple-600/85 border border-purple-300 text-white font-bold text-xs flex items-center justify-center shadow-lg"
            >
              ПРЫЖОК
            </button>
          </div>

          <div
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-amber-400 border-2 border-white text-slate-950 font-display font-black text-sm flex items-center justify-center shadow-xl"
            onTouchStart={(e) => {
              const t = e.touches[0];
              lookOrigin.current = { x: t.clientX, y: t.clientY };
              touchActionRef.current.isCharging = true;
            }}
            onTouchMove={(e) => {
              if (!lookOrigin.current) return;
              const t = e.touches[0];
              touchActionRef.current.lookX = (t.clientX - lookOrigin.current.x) * 0.25;
              touchActionRef.current.lookY = (t.clientY - lookOrigin.current.y) * 0.25;
              lookOrigin.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchEnd={() => {
              lookOrigin.current = null;
              touchActionRef.current.lookX = 0;
              touchActionRef.current.lookY = 0;
              touchActionRef.current.isCharging = false;
            }}
          >
            ОГОНЬ
          </div>
        </div>
      </div>
    </div>
  );
};
