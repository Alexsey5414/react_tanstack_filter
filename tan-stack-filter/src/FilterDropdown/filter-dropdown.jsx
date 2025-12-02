import React, { useRef, useEffect } from "react";
import "./filter-dropdown.css";

const FilterDropdown = ({
  column,
  onClose,
  globalFilter,
  setGlobalFilter,
  table,
  buttonPosition,
}) => {
  const filterValue = column?.getFilterValue() || globalFilter || {};
  const dropdownRef = useRef(null);

  // Закрытие при клике вне dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const isFilterButton = event.target.closest(".filter-button");
        if (!isFilterButton) {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleChange = (field, value) => {
    const newValue = { ...filterValue, [field]: value || undefined };

    if (table) {
      // Для глобального фильтра
      table.setGlobalFilter(
        Object.keys(newValue).length > 0 ? newValue : undefined
      );
      if (setGlobalFilter) setGlobalFilter(newValue);
    } else {
      // Для фильтра колонки
      column.setFilterValue(
        Object.keys(newValue).length > 0 ? newValue : undefined
      );
    }
  };

  const handleReset = () => {
    if (table) {
      table.setGlobalFilter(undefined);
      if (setGlobalFilter) setGlobalFilter({});
    } else {
      column.setFilterValue(undefined);
    }
  };

  // Дополнительная функция для корректировки позиции
  const adjustPosition = (position) => {
    if (!position) return position;

    const dropdownWidth = 280; // Ширина dropdown
    const dropdownHeight = 350; // Примерная высота dropdown
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let adjustedLeft = position.left;
    let adjustedTop = position.top;

    // Проверяем, не выходит ли dropdown за правый край
    if (adjustedLeft + dropdownWidth > viewportWidth + scrollX) {
      adjustedLeft = viewportWidth + scrollX - dropdownWidth - 10;
    }

    // Проверяем, не выходит ли dropdown за нижний край
    if (adjustedTop + dropdownHeight > viewportHeight + scrollY) {
      // Если выходит за нижний край, показываем сверху от кнопки
      adjustedTop = position.top - dropdownHeight - 10;
    }

    // Проверяем, не выходит ли dropdown за левый край
    if (adjustedLeft < scrollX) {
      adjustedLeft = scrollX + 10;
    }

    return { top: adjustedTop, left: adjustedLeft };
  };

  // Обновляем getDropdownStyles:
  const getDropdownStyles = () => {
    if (buttonPosition) {
      const adjustedPosition = adjustPosition(buttonPosition);
      return {
        position: "fixed",
        top: `${adjustedPosition.top}px`,
        left: `${adjustedPosition.left}px`,
      };
    }
    return {};
  };

  return (
    <div
      ref={dropdownRef}
      className="filter-dropdown"
      style={getDropdownStyles()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="filter-header">
        <span className="filter-title">
          {table
            ? "Глобальный фильтр"
            : `Фильтр по ${column?.columnDef?.header || "колонке"}`}
        </span>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="filter-fields">
        <div className="filter-field">
          <label htmlFor="weightMin">Вес (мин):</label>
          <input
            id="weightMin"
            type="number"
            value={filterValue.weightMin || ""}
            onChange={(e) => handleChange("weightMin", e.target.value)}
            placeholder="От"
            min="0"
          />
        </div>

        <div className="filter-field">
          <label htmlFor="speedMin">Скорость (мин):</label>
          <input
            id="speedMin"
            type="number"
            value={filterValue.speedMin || ""}
            onChange={(e) => handleChange("speedMin", e.target.value)}
            placeholder="От"
            min="0"
          />
        </div>

        <div className="filter-field">
          <label htmlFor="lengthMin">Длина (мин):</label>
          <input
            id="lengthMin"
            type="number"
            value={filterValue.lengthMin || ""}
            onChange={(e) => handleChange("lengthMin", e.target.value)}
            placeholder="От"
            min="0"
          />
        </div>

        <div className="filter-actions">
          <button className="reset-btn" onClick={handleReset}>
            Сбросить
          </button>
          <button className="apply-btn" onClick={onClose}>
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterDropdown;
