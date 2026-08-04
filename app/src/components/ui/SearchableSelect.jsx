import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, XIcon } from "lucide-react";

export function SearchableSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = useMemo(() => options.find(option => option.value === value), [options, value]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-slate-900"
        >
          {selectedOption ? selectedOption.label : <span className="text-slate-500">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <div className="p-2 border-b border-slate-200">
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-2"
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setSearch("");
                }}
                className="flex items-center justify-between p-3 hover:bg-slate-100 cursor-pointer text-sm"
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="h-4 w-4 text-blue-600" />}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">
              No results found.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}