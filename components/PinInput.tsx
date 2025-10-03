import React, { useRef, useState } from 'react';

interface PinInputProps {
  length: number;
  onChange: (pin: string) => void;
}

const PinInput: React.FC<PinInputProps> = ({ length, onChange }) => {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newPin = [...pin];
    newPin[index] = element.value;
    setPin(newPin);
    onChange(newPin.join(''));

    if (element.value !== '' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {pin.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            if (el) inputRefs.current[index] = el;
          }}
          type="password"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-12 h-14 text-center text-2xl font-semibold bg-subtle border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      ))}
    </div>
  );
};

export default PinInput;