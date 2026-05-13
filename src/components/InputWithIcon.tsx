import React from 'react';

type Props = {
  label?: string;
  icon?: React.ElementType;
  value?: any;
  onChange?: (e: any) => void;
  placeholder?: string;
  type?: string;
  inputMode?: string;
  textarea?: boolean;
  className?: string;
  name?: string;
};

export default function InputWithIcon({ label, icon: Icon, value, onChange, placeholder, type = 'text', inputMode, textarea, className, name }: Props) {
  return (
    <div>
      {label && <label className="text-sm font-bold text-slate-600">{label}</label>}
      <div className="mt-1 relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className="w-4 h-4 text-slate-400" />
          </div>
        )}
        {textarea ? (
          <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} className={`w-full rounded border px-3 py-2 ${Icon ? 'pl-10' : ''} ${className || ''}`} rows={4} />
        ) : (
          <input name={name} value={value} onChange={onChange} placeholder={placeholder} type={type} inputMode={inputMode as any} className={`w-full rounded border px-3 py-2 ${Icon ? 'pl-10' : ''} ${className || ''}`} />
        )}
      </div>
    </div>
  );
}
