'use client';

import React, { useEffect, useState } from 'react';
import { formatRupiahInput, parseRupiah } from '@/lib/rupiah';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string | number;
  onChange: (value: string) => void; // returns raw numeric string without formatting
};

export default function RupiahInput({ value, onChange, ...rest }: Props) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    const v = value === null || value === undefined ? '' : String(value);
    setDisplay(formatRupiahInput(v));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const cleaned = String(parseRupiah(raw));
    const formatted = formatRupiahInput(cleaned);
    setDisplay(formatted);
    onChange(cleaned);
  }

  return (
    <input
      {...rest}
      type="text"
      value={display}
      onChange={handleChange}
      inputMode="numeric"
    />
  );
}
