import { formatPrice } from '../utils/currency';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
}

export function PriceRangeSlider({ min, max, valueMin, valueMax, onChangeMin, onChangeMax }: PriceRangeSliderProps) {
  const range = max - min || 1;
  const minPct = ((valueMin - min) / range) * 100;
  const maxPct = ((valueMax - min) / range) * 100;

  return (
    <div className="price-range">
      <div className="price-range-track">
        <div className="price-range-track-fill" style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMin}
          onChange={(e) => onChangeMin(Math.min(Number(e.target.value), valueMax))}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => onChangeMax(Math.max(Number(e.target.value), valueMin))}
        />
      </div>
      <div className="price-range-values">
        <span>{formatPrice(valueMin)}</span>
        <span>{formatPrice(valueMax)}</span>
      </div>
    </div>
  );
}
