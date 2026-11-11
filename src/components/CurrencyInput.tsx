import React from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0,00',
  className = '',
  disabled = false,
  id,
}) => {
  // Convert numeric value (e.g. 140.5) to formatted Brazilian string without R$ symbol
  const displayValue = Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      const centsStr = Math.round(Number(value || 0) * 100).toString();
      if (centsStr.length <= 1) {
        onChange(0);
      } else {
        const nextCents = centsStr.slice(0, -1);
        onChange(parseInt(nextCents, 10) / 100);
      }
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      onChange(0);
      return;
    }

    // If key is a digit 0-9
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const currentCents = Math.round(Number(value || 0) * 100);
      // Limit to max 999.999,99 to prevent overflow
      if (currentCents > 99999999) return;
      const nextCents = currentCents * 10 + parseInt(e.key, 10);
      onChange(nextCents / 100);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const clean = pasted.replace(/[^\d]/g, '');
    if (clean) {
      const num = parseInt(clean, 10) / 100;
      onChange(isNaN(num) ? 0 : num);
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <span className="absolute left-2.5 text-[11px] font-bold text-slate-400 select-none pointer-events-none">
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={value > 0 ? displayValue : ''}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onChange={() => {}} // Controlled by onKeyDown/onPaste
        className={`w-full pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-right border rounded-lg focus:outline-none transition ${className}`}
      />
    </div>
  );
};
