import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";

interface Props<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: T[];
  required?: boolean;
  disabled?: boolean;
}

export default function FieldListbox<T extends string>({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
}: Props<T>) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <ListboxButton className="relative w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-left text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500">
          <span>{value}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </ListboxButton>
        <ListboxOptions
          anchor="bottom start"
          className="z-30 mt-1 max-h-48 w-[var(--button-width)] overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg focus:outline-none"
        >
          {options.map((opt) => (
            <ListboxOption
              key={opt}
              value={opt}
              className="cursor-pointer select-none px-3 py-2 text-sm data-[focus]:bg-brand-50 data-[focus]:text-brand-900 data-[selected]:font-semibold"
            >
              {opt}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </div>
  );
}
