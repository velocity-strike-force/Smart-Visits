import { useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export interface TypeaheadProps {
    label: string;
    placeholder: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
    /** Optional extra class on the wrapper div */
    className?: string;
}

export default function Typeahead({
    label,
    placeholder,
    options,
    value,
    onChange,
    className,
}: TypeaheadProps) {
    const [query, setQuery] = useState(value);
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = query
        ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
        : options;

    // Inline suggestion: first option that starts with the query (prefix match)
    const suggestion =
        query.length > 0
            ? (options.find((o) =>
                  o.toLowerCase().startsWith(query.toLowerCase()),
              ) ?? null)
            : null;

    // The ghost suffix is the untyped tail of the suggestion
    const ghostSuffix = suggestion ? suggestion.slice(query.length) : "";

    const handleSelect = (option: string) => {
        setQuery(option);
        onChange(option);
        setOpen(false);
    };

    const handleClear = () => {
        setQuery("");
        onChange("");
        setOpen(false);
    };

    const acceptSuggestion = () => {
        if (suggestion) {
            setQuery(suggestion);
            onChange(suggestion);
            setOpen(false);
        }
    };

    return (
        <div className={className}>
            <label className="block mb-2 text-sm">{label}</label>
            <div ref={containerRef} className="relative">
                {/* Ghost overlay — typed text invisible + gray completion */}
                {ghostSuffix && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 flex items-center px-3 py-2 pr-16 text-base overflow-hidden whitespace-pre rounded-lg"
                    >
                        <span className="invisible">{query}</span>
                        <span className="text-gray-400">{ghostSuffix}</span>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={ghostSuffix ? undefined : placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    onKeyDown={(e) => {
                        if (
                            (e.key === "Tab" || e.key === "ArrowRight") &&
                            ghostSuffix
                        ) {
                            e.preventDefault();
                            acceptSuggestion();
                        }
                    }}
                    className="relative w-full bg-transparent px-3 py-2 pr-16 border rounded-lg"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query && (
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleClear();
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setOpen((o) => !o);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-700"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
                {open && filtered.length > 0 && (
                    <ul className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-52 overflow-auto">
                        {filtered.map((option) => (
                            <li key={option}>
                                <button
                                    type="button"
                                    onMouseDown={() => handleSelect(option)}
                                    className={`w-full px-4 py-2 text-left hover:bg-blue-50 ${
                                        option === value
                                            ? "bg-blue-50 text-blue-700 font-medium"
                                            : ""
                                    }`}
                                >
                                    {option}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
