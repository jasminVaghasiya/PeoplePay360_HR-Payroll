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
  id,
  icon,
  align = 'auto',
  renderOption,
  renderTrigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to [{ value, label, disabled, ...raw }]
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          ...opt,
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

  const [alignRight, setAlignRight] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  // Auto-positioning check so dropdown never clips out of modal or viewport
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const modalContainer = dropdownRef.current.closest('.modal-content, [role="dialog"], .modal-panel, body');
      const containerRight = modalContainer ? modalContainer.getBoundingClientRect().right : window.innerWidth;
      const spaceToRight = containerRight - rect.left;

      if (align === 'right') {
        setAlignRight(true);
      } else if (align === 'left') {
        setAlignRight(false);
      } else {
        // Automatically align right if rightward space in container or viewport is less than 380px,
        // or trigger right edge is near the container's right margin
        setAlignRight(spaceToRight < 380 || (modalContainer && rect.right > containerRight - 90));
      }

      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 280 && rect.top > 280);
    }
  }, [isOpen, align]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden', flex: 1 }}>
          {icon && (
            <span style={{ display: 'flex', alignItems: 'center', color: '#94A3B8', flexShrink: 0 }}>
              {icon}
            </span>
          )}
          {renderTrigger ? (
            renderTrigger(selectedOption)
          ) : (
            <span className={`dropdown-trigger-label ${!selectedOption ? 'placeholder' : ''}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`dropdown-arrow-icon ${isOpen ? 'rotate' : ''}`} />
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className={`custom-dropdown-menu fade-in-scale ${alignRight ? 'align-right' : ''} ${openUpward ? 'open-upward' : ''}`} role="listbox">
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
                    {renderOption ? (
                      renderOption(option, isSelected)
                    ) : (
                      <>
                        <span className="option-label">{option.label}</span>
                        {isSelected && <Check size={14} className="option-check-icon" />}
                      </>
                    )}
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
