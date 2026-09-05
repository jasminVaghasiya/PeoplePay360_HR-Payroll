import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export const CustomDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  style = {},
  searchPlaceholder = 'Search options...',
  name,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to [{ value, label, disabled }]
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value !== undefined ? opt.value : opt.id,
          label: opt.label !== undefined ? opt.label : (opt.name || String(opt.value)),
          disabled: Boolean(opt.disabled)
        };
      }
      return { value: opt, label: String(opt), disabled: false };
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Option count rule: auto-enable search if >= 9 options
  const showSearch = normalizedOptions.length >= 9;

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    if (!showSearch || !searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.trim().toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery, showSearch]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, showSearch]);

  const handleSelect = (option) => {
    if (option.disabled) return;
    onChange(option.value, option);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && !isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`custom-dropdown-container ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''} ${className}`}
      style={style}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        name={name}
        className="custom-dropdown-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className={`dropdown-trigger-label ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`dropdown-arrow-icon ${isOpen ? 'rotate' : ''}`} />
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="custom-dropdown-menu fade-in-scale" role="listbox">
          {/* Sticky Search Field (If >= 9 options) */}
          {showSearch && (
            <div className="dropdown-search-wrapper">
              <Search size={14} className="dropdown-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="dropdown-search-input"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="dropdown-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* Options Scroll List */}
          <div className="dropdown-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedOption && String(selectedOption.value) === String(option.value);

                return (
                  <div
                    key={String(option.value)}
                    role="option"
                    aria-selected={isSelected}
                    className={`dropdown-option-item ${isSelected ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                    onClick={() => handleSelect(option)}
                  >
                    <span className="option-label">{option.label}</span>
                    {isSelected && <Check size={14} className="option-check-icon" />}
                  </div>
                );
              })
            ) : (
              <div className="dropdown-no-results">
                <span>No options match your search.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
