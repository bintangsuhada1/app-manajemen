'use client';

import React, { useEffect, useState } from 'react';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string | number;
  onChange: (value: string) => void; // raw numeric string (no thousand separators)
  allowDecimal?: boolean;
};

export default function NumberInput({ value, onChange, allowDecimal = false, ...rest }: Props) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    const v = value === null || value === undefined ? '' : String(value);
    setDisplay(formatForDisplay(v, allowDecimal));
  }, [value, allowDecimal]);

  function strip(v: string) {
    // keep digits and dots for initial parsing
    const onlyDigitsAndDots = v.replace(/[^0-9.]/g, '');
    if (!allowDecimal) return onlyDigitsAndDots.replace(/\./g, '');

    const parts = onlyDigitsAndDots.split('.');
    if (parts.length === 1) return parts[0];

    // If segments after the first all have length 3, treat dots as thousand separators
    const after = parts.slice(1);
    const allGroups = after.every((seg) => seg.length === 3);
    if (allGroups) {
      return parts.join(''); // remove grouping dots
    }

    // Otherwise treat last segment as decimal part, join earlier segments as integer
    const intPart = parts.slice(0, parts.length - 1).join('');
    const decPart = parts[parts.length - 1];
    return intPart + (decPart ? '.' + decPart : '');
  }

  function formatForDisplay(raw: string, allowDecimalLocal: boolean) {
    if (raw === '') return '';
    const cleaned = strip(raw);
    if (cleaned === '') return '';
    // For Rupiah formatting without decimal
    if (!allowDecimalLocal) {
      return new Intl.NumberFormat('id-ID').format(Number(cleaned));
    }
    // For decimal numbers (like percentages)
    if (cleaned.includes('.')) {
      const [intPart, decPart] = cleaned.split('.');
      const intFormatted = new Intl.NumberFormat('id-ID').format(Number(intPart || '0'));
      return decPart ? `${intFormatted}.${decPart}` : `${intFormatted}.`;
    }
    return new Intl.NumberFormat('id-ID').format(Number(cleaned));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const cleaned = strip(raw);
    setDisplay(formatForDisplay(cleaned, allowDecimal));
    onChange(cleaned);
  }

  return (
    <input
      {...rest}
      type="text"
      value={display}
      onChange={handleChange}
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
    />
  );
}
