import React, { useState, useRef, useEffect } from "react";
import { flexRender } from "@tanstack/react-table";
import FilterDropdown from "../FilterDropdown/filter-dropdown";
import "./filterable-header.css";

const FilterableHeader = ({ header, globalFilter }) => {
  const [showFilter, setShowFilter] = useState(false);
  const headerRef = useRef(null);
  const buttonRef = useRef(null);

  // Закрытие меню при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  // Получаем позицию кнопки для правильного позиционирования
  const getButtonPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      return {
        top: buttonRect.bottom + window.scrollY,
        left: buttonRect.left + window.scrollX,
      };
    }
    return { top: 0, left: 0 };
  };

  return (
    <th
      key={header.id}
      ref={headerRef}
      className={`filterable-header ${showFilter ? "active" : ""}`}
    >
      <div className="header-content">
        <div
          className="header-title"
          onClick={header.column.getToggleSortingHandler()}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {header.column.getIsSorted() && (
            <span className="sort-indicator">
              {header.column.getIsSorted() === "asc" ? " 🔼" : " 🔽"}
            </span>
          )}
        </div>

        <button
          ref={buttonRef}
          className={`filter-button ${showFilter ? "active" : ""}`}
          onClick={toggleFilter}
          aria-label="Фильтр"
          title="Открыть фильтр"
        >
          <svg
            className="filter-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
          >
            <path
              fill="currentColor"
              d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"
            />
          </svg>
        </button>

        {showFilter && header.column.getCanFilter() && (
          <FilterDropdown
            column={header.column}
            onClose={() => setShowFilter(false)}
            globalFilter={globalFilter}
            buttonPosition={getButtonPosition()}
          />
        )}
      </div>
    </th>
  );
};

export default FilterableHeader;
