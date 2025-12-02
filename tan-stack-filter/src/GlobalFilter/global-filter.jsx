import React, { useState, useRef } from "react";
import FilterDropdown from "../FilterDropdown/filter-dropdown";
import "./global-filter.css";

const GlobalFilter = ({ globalFilter, setGlobalFilter, table }) => {
  const [showFilter, setShowFilter] = useState(false);
  const buttonRef = useRef(null);

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
    <div className="global-filter-container">
      <button
        ref={buttonRef}
        className={`global-filter-toggle ${
          Object.keys(globalFilter).length > 0 ? "active" : ""
        }`}
        onClick={() => setShowFilter(!showFilter)}
      >
        <span className="filter-icon">⚙️</span>
        Фильтры
        {Object.keys(globalFilter).length > 0 && (
          <span className="filter-count">
            {Object.keys(globalFilter).length}
          </span>
        )}
      </button>

      {showFilter && (
        <FilterDropdown
          table={table}
          onClose={() => setShowFilter(false)}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          buttonPosition={getButtonPosition()}
        />
      )}
    </div>
  );
};

export default GlobalFilter;
