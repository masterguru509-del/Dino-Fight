import React from 'react';
import { X, Layers, Sun, Cpu, Sparkles, Volume2, Shield } from 'lucide-react';

interface BlueprintModalProps {
  onClose: () => void;
}

export const BlueprintModal: React.FC<BlueprintModalProps> = ({ onClose }) => {
  const pillars = [
    {
      num: '01. Пространственный перевод 2.5D → 3D (1:1 Паритет логики)',
      icon: <Layers className="w-5 h-5 text-amber-400" />,
      desc: 'Арена сохраняет точные математические координаты оригинала (X: 0..1100, прыжки и гравитация -1.1, хитбоксы стоя 180 и в приседе 55), но разворачивается в глубоком 3D-пространстве по оси Z: объёмный рельеф земли, 3D-деревья, горные хребты и ночное светило с реальным параллаксом.',
    },
    {
      num: '02. Процедурный 3D-риггинг, Броня и 5 стадий Эволюции',
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      desc: 'Рекс и Раптор собраны как иерархические 3D-скелеты (Three.js Groups) с процедурной анимацией шага, отдачи челюсти, приседания и дыхания. Все 4 слота брони (Сапоги, Кольчуга, Жилет, Рогатый Шлем в 4 тирах от Серебра до Мифрила) и 5 уровней Эволюции (боевые шрамы, золотые хребтовые шипы, плазменные кольца и корона Легенды) рендерятся непосредственно на 3D-теле.',
    },
    {
      num: '03. Динамическое PBR-освещение и 7 погодных стихий',
      icon: <Sun className="w-5 h-5 text-cyan-400" />,
      desc: 'Трёхточечное студийное освещение (лунный Key Light с мягкими тенями PCFSoftShadowMap, атмосферный Fill Light и контровой Rim Light) дополнено динамическими вспышками выстрелов, взрывов и молний. Все 7 типов погоды (Ясно, Дождь, Снег, Туман, Гроза, Лепестки сакуры и Песчаная буря) работают через 3D-частицы и экспоненциальный туман.',
    },
    {
      num: '04. 3D-Питомцы, Кузница пушек и Спец-дроп',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      desc: 'Летающий 3D-дракон с фазами сканирования, прицеливания и залпа файерболами, плюс ползущие 3D-змея и скорпион с механикой стакающегося яда. Врат-портал и грузовой парашют сбрасывают фиолетовую двухствольную пушку с кристаллом и радиальным 3D-кольцом захвата.',
    },
    {
      num: '05. Кинематографичная камера и Hitstop-физика',
      icon: <Cpu className="w-5 h-5 text-rose-400" />,
      desc: 'Плавная интерполяция камеры (lerp) отслеживает дистанцию между бойцами, автоматически меняя угол обзора и высоту, а при критических попаданиях срабатывает микро-фрейм hitstop и 3D-тряска камеры.',
    },
    {
      num: '06. Генеративный саундтрек и Web Audio SFX',
      icon: <Volume2 className="w-5 h-5 text-amber-300" />,
      desc: 'Встроенный многоголосный Web Audio синтезатор создаёт мягкую эмбиент-музыку (аккордовые прогрессии с low-pass фильтрацией) и процедурные звуки выстрелов, рикошета по 3D-щиту, яда и эволюции без внешних аудиофайлов.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050510]/85 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-[#110a26]/95 border border-amber-400/25 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wider text-amber-400">
              АРХИТЕКТУРНЫЙ ПЛАН: 2D → 3D AAA WEBGL
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Lead Gameplay Programmer · Technical Artist · Game Director Vision
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {pillars.map((p) => (
            <div
              key={p.num}
              className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5"
            >
              <div className="flex items-center gap-2.5 font-display font-bold text-base text-white">
                {p.icon}
                <span>{p.num}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-7">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-black/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
          >
            Понятно, в бой!
          </button>
        </div>
      </div>
    </div>
  );
};
