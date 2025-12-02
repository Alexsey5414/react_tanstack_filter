/**
 * DataTable.jsx
 *
 * Компонент таблицы с грид-сеткой, фильтрацией, сортировкой и ресайзом колонок
 * Использует TanStack Table v8 для управления состоянием и виртуализации
 */

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import "./data-table.css";

/**
 * FilterDropdown - компонент выпадающего окна фильтрации
 *
 * Поддерживает две вкладки:
 * 1. "По значениям" - поиск по тексту и выбор чекбоксов
 * 2. "Расширенный" - операторы фильтрации (содержит, равно, больше и т.д.)
 */
const FilterDropdown = ({
  column, // Объект колонки из TanStack Table
  onClose, // Функция закрытия dropdown
  allValues = [], // Все уникальные значения в колонке
  filterValue = "", // Текущее значение поиска
  setFilterValue, // Функция установки значения поиска
  selectedOptions = [], // Выбранные чекбоксы
  setSelectedOptions, // Функция установки выбранных чекбоксов
  applyFilter, // Функция применения фильтра
  resetFilter, // Функция сброса фильтра
  position, // Позиция для отображения dropdown
  isStringColumn = true, // Флаг строковой колонки (для операторов)
}) => {
  const dropdownRef = useRef(null); // Ref для отслеживания кликов вне dropdown
  const [activeTab, setActiveTab] = useState("values"); // Активная вкладка
  const [advancedFilter, setAdvancedFilter] = useState({
    operator: "contains", // Оператор фильтрации
    value1: "", // Первое значение
    value2: "", // Второе значение (для оператора "Между")
  });

  /**
   * Обработчик клика вне dropdown
   * Закрывает dropdown при клике на любую область вне компонента
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  /**
   * Инициализация продвинутого фильтра из состояния колонки
   * Вызывается при открытии dropdown или изменении колонки
   */
  useEffect(() => {
    const currentFilter = column.getFilterValue();
    if (currentFilter && currentFilter.type === "advanced") {
      setAdvancedFilter(currentFilter);
    }
  }, [column]);

  /**
   * Обработчик изменения состояния чекбокса
   * Добавляет или удаляет значение из выбранных опций
   */
  const handleCheckboxChange = (value) => {
    setSelectedOptions((prev) => {
      if (prev.includes(value)) {
        // Удаляем значение если уже выбрано
        return prev.filter((v) => v !== value);
      } else {
        // Добавляем значение если не выбрано
        return [...prev, value];
      }
    });
  };

  /**
   * Фильтрация значений по поисковому запросу
   * Используется для отображения только релевантных чекбоксов
   */
  const filteredValues = allValues.filter((value) => {
    if (!filterValue.trim()) return true;
    return value.toLowerCase().includes(filterValue.toLowerCase());
  });

  /**
   * Обработчик выбора всех/очистки всех чекбоксов
   * Работает только с отфильтрованными значениями
   */
  const handleHeaderCheckboxChange = () => {
    if (selectedOptions.length === filteredValues.length) {
      // Если все уже выбраны - снимаем выделение
      setSelectedOptions([]);
    } else {
      // Выбираем все отфильтрованные значения
      setSelectedOptions([...filteredValues]);
    }
  };

  // Проверка: все ли отфильтрованные значения выбраны
  const isAllChecked =
    filteredValues.length > 0 &&
    selectedOptions.length === filteredValues.length;
  // Проверка: выбраны ли некоторые, но не все значения
  const isSomeChecked =
    selectedOptions.length > 0 &&
    selectedOptions.length < filteredValues.length;

  /**
   * Обработчик изменения оператора в продвинутом фильтре
   * При выборе оператора "Между" добавляет второе поле ввода
   */
  const handleOperatorChange = (e) => {
    setAdvancedFilter((prev) => ({
      ...prev,
      operator: e.target.value,
      value2: e.target.value === "between" ? prev.value2 : "",
    }));
  };

  /**
   * Обработчик изменения значений в продвинутом фильтре
   * @param {string} field - название поля (value1 или value2)
   * @param {string} value - новое значение
   */
  const handleAdvancedValueChange = (field, value) => {
    setAdvancedFilter((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Применение продвинутого фильтра
   * Формирует объект фильтра и передает его в колонку
   */
  const applyAdvancedFilter = () => {
    if (
      advancedFilter.operator === "empty" ||
      advancedFilter.operator === "notEmpty" ||
      advancedFilter.value1 ||
      advancedFilter.value2
    ) {
      column.setFilterValue({
        type: "advanced",
        ...advancedFilter,
      });
    } else {
      column.setFilterValue(undefined);
    }
    onClose();
  };

  /**
   * Сброс продвинутого фильтра
   * Устанавливает значения по умолчанию
   */
  const resetAdvancedFilter = () => {
    setAdvancedFilter({
      operator: "contains",
      value1: "",
      value2: "",
    });
    column.setFilterValue(undefined);
    onClose();
  };

  // Операторы для строковых колонок
  const stringOperators = [
    { value: "contains", label: "Содержит" },
    { value: "equals", label: "Равно" },
    { value: "startsWith", label: "Начинается с" },
    { value: "endsWith", label: "Заканчивается на" },
    { value: "empty", label: "Пустое" },
    { value: "notEmpty", label: "Не пустое" },
    { value: "list", label: "Список" },
  ];

  // Операторы для числовых колонок
  const numberOperators = [
    { value: "equals", label: "Равно" },
    { value: "greaterThan", label: "Больше" },
    { value: "lessThan", label: "Меньше" },
    { value: "between", label: "Между" },
    { value: "empty", label: "Пустое" },
    { value: "notEmpty", label: "Не пустое" },
    { value: "list", label: "Список" },
  ];

  // Выбор операторов в зависимости от типа колонки
  const operators = isStringColumn ? stringOperators : numberOperators;

  return (
    <div
      ref={dropdownRef}
      className="filter-dropdown"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 1000,
      }}
    >
      {/* Заголовок dropdown с названием колонки */}
      <div className="filter-header">
        <h4>Фильтр: {column.columnDef.header}</h4>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      {/* Вкладки фильтрации */}
      <div className="filter-tabs">
        <button
          className={`tab-btn ${activeTab === "values" ? "active" : ""}`}
          onClick={() => setActiveTab("values")}
        >
          По значениям
        </button>
        <button
          className={`tab-btn ${activeTab === "advanced" ? "active" : ""}`}
          onClick={() => setActiveTab("advanced")}
        >
          Расширенный
        </button>
      </div>

      <div className="filter-content">
        {/* Вкладка "По значениям" */}
        {activeTab === "values" ? (
          <>
            {/* Поле поиска с иконкой лупы */}
            <div className="search-field">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Значение..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="search-input"
                  autoFocus
                />
              </div>
            </div>

            {/* Список чекбоксов с фиксированным заголовком */}
            <div className="checkbox-list">
              <div className="checkbox-header fixed-header">
                <label className="header-checkbox">
                  <input
                    type="checkbox"
                    checked={isAllChecked}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeChecked;
                      }
                    }}
                    onChange={handleHeaderCheckboxChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-label">Доступные значения</span>
                  <span className="counter">
                    ({selectedOptions.length}/{allValues.length})
                  </span>
                </label>
              </div>

              <div className="checkbox-items">
                {filteredValues.length > 0 ? (
                  filteredValues.map((value, index) => (
                    <label key={index} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(value)}
                        onChange={() => handleCheckboxChange(value)}
                        className="checkbox-input"
                      />
                      <span className="checkbox-label">{value}</span>
                    </label>
                  ))
                ) : (
                  <div className="no-values">
                    {allValues.length === 0
                      ? "Нет доступных значений"
                      : "Нет совпадений по фильтру"}
                  </div>
                )}
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="filter-actions">
              <button onClick={resetFilter} className="reset-btn">
                Сбросить
              </button>
              <button onClick={applyFilter} className="apply-btn">
                Применить
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Вкладка "Расширенный" */}
            <div className="advanced-filter">
              <div className="filter-row">
                <label className="filter-label">Оператор:</label>
                <select
                  value={advancedFilter.operator}
                  onChange={handleOperatorChange}
                  className="operator-select"
                >
                  {operators.map((operator) => (
                    <option key={operator.value} value={operator.value}>
                      {operator.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Поля ввода для значений (кроме операторов empty/notEmpty) */}
              {advancedFilter.operator !== "empty" &&
                advancedFilter.operator !== "notEmpty" && (
                  <>
                    <div className="filter-row">
                      <label className="filter-label">
                        {advancedFilter.operator === "between"
                          ? "От:"
                          : "Значение:"}
                      </label>
                      <input
                        type={isStringColumn ? "text" : "number"}
                        value={advancedFilter.value1}
                        onChange={(e) =>
                          handleAdvancedValueChange("value1", e.target.value)
                        }
                        className="value-input"
                        placeholder={
                          isStringColumn
                            ? "Введите значение..."
                            : "Введите число..."
                        }
                      />
                    </div>

                    {/* Второе поле для оператора "Между" */}
                    {advancedFilter.operator === "between" && (
                      <div className="filter-row">
                        <label className="filter-label">До:</label>
                        <input
                          type={isStringColumn ? "text" : "number"}
                          value={advancedFilter.value2}
                          onChange={(e) =>
                            handleAdvancedValueChange("value2", e.target.value)
                          }
                          className="value-input"
                          placeholder={
                            isStringColumn
                              ? "Введите значение..."
                              : "Введите число..."
                          }
                        />
                      </div>
                    )}

                    {/* Textarea для оператора "Список" */}
                    {advancedFilter.operator === "list" && (
                      <div className="filter-row">
                        <label className="filter-label">
                          Список (через запятую):
                        </label>
                        <textarea
                          value={advancedFilter.value1}
                          onChange={(e) =>
                            handleAdvancedValueChange("value1", e.target.value)
                          }
                          className="list-textarea"
                          placeholder="значение1, значение2, значение3..."
                          rows="3"
                        />
                      </div>
                    )}
                  </>
                )}

              {/* Описание текущего оператора */}
              <div className="filter-description">
                {advancedFilter.operator === "contains" &&
                  "Поиск значений, содержащих указанный текст"}
                {advancedFilter.operator === "equals" && "Точное совпадение"}
                {advancedFilter.operator === "startsWith" &&
                  "Значения, начинающиеся с указанного текста"}
                {advancedFilter.operator === "endsWith" &&
                  "Значения, заканчивающиеся на указанный текст"}
                {advancedFilter.operator === "greaterThan" &&
                  "Значения больше указанного числа"}
                {advancedFilter.operator === "lessThan" &&
                  "Значения меньше указанного числа"}
                {advancedFilter.operator === "between" &&
                  "Значения в указанном диапазоне"}
                {advancedFilter.operator === "empty" && "Пустые значения"}
                {advancedFilter.operator === "notEmpty" && "Не пустые значения"}
                {advancedFilter.operator === "list" &&
                  "Значения из списка (через запятую)"}
              </div>
            </div>

            {/* Кнопки действий для продвинутого фильтра */}
            <div className="filter-actions">
              <button onClick={resetAdvancedFilter} className="reset-btn">
                Сбросить
              </button>
              <button onClick={applyAdvancedFilter} className="apply-btn">
                Применить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * HeaderCell - компонент ячейки заголовка таблицы
 *
 * Отвечает за:
 * - Отображение названия колонки
 * - Сортировку по клику
 * - Кнопку фильтрации
 * - Ресайз колонки
 */
const HeaderCell = ({ header, tableData }) => {
  // Состояния для управления фильтром
  const [showFilter, setShowFilter] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [allValues, setAllValues] = useState([]);
  const headerRef = useRef(null); // Ref для позиционирования dropdown

  /**
   * Получение уникальных значений для колонки
   * Используется для отображения в фильтре "По значениям"
   */
  useEffect(() => {
    const columnId = header.column.id;

    if (!tableData || tableData.length === 0) {
      setAllValues([]);
      return;
    }

    // Извлекаем все значения из колонки, преобразуем в строки и удаляем дубликаты
    const columnValues = tableData
      .map((row) => row[columnId])
      .filter((value) => value !== undefined && value !== null)
      .map((value) => String(value));

    setAllValues([...new Set(columnValues)].sort());
  }, [tableData, header.column.id]);

  /**
   * Обработчик клика по кнопке фильтра
   * Вычисляет позицию для отображения dropdown
   */
  const handleFilterClick = (e) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
      });
    }
    setShowFilter(!showFilter);
  };

  /**
   * Применение фильтра "По значениям"
   * Формирует объект фильтра и передает его в колонку
   */
  const applyFilter = () => {
    const columnId = header.column.id;

    if (filterValue.trim() || selectedOptions.length > 0) {
      header.column.setFilterValue({
        type: "values",
        searchValue: filterValue.trim(),
        selectedOptions: selectedOptions,
      });
    } else {
      header.column.setFilterValue(undefined);
    }

    setShowFilter(false);
  };

  /**
   * Сброс фильтра "По значениям"
   */
  const resetFilter = () => {
    setFilterValue("");
    setSelectedOptions([]);
    header.column.setFilterValue(undefined);
    setShowFilter(false);
  };

  /**
   * Инициализация фильтра при открытии dropdown
   * Восстанавливает предыдущее состояние фильтра
   */
  useEffect(() => {
    if (showFilter) {
      const currentFilter = header.column.getFilterValue();
      if (currentFilter && currentFilter.type === "values") {
        setFilterValue(currentFilter.searchValue || "");
        setSelectedOptions(currentFilter.selectedOptions || []);
      } else {
        setFilterValue("");
        setSelectedOptions([]);
      }
    }
  }, [showFilter, header.column]);

  /**
   * Обработчик клика для сортировки
   */
  const handleSortClick = (e) => {
    e.stopPropagation();
    if (header.column.getCanSort()) {
      header.column.toggleSorting();
    }
  };

  // Определяем тип колонки для фильтра (строковая или числовая)
  const isStringColumn = header.column.id === "name";
  // Проверяем, есть ли у колонки фильтр
  const hasFilter = header.column.columnDef.enableColumnFilter !== false;
  // Проверяем, можно ли сортировать колонку
  const canSort = header.column.getCanSort();

  return (
    <div
      ref={headerRef}
      className={`grid-header-cell ${canSort ? "sortable" : ""}`}
      style={{
        width: header.getSize(),
        minWidth: header.column.columnDef.minSize || 80,
        maxWidth: header.column.columnDef.maxSize || 500,
      }}
    >
      <div className="header-content" onClick={handleSortClick}>
        <div className="header-text">
          {/* Рендерим заголовок колонки */}
          {flexRender(header.column.columnDef.header, header.getContext())}
          {/* Иконка сортировки */}
          {header.column.getIsSorted() && (
            <span className="sort-icon">
              {header.column.getIsSorted() === "asc" ? "↑" : "↓"}
            </span>
          )}
        </div>

        {/* Кнопка фильтра (отображается только если у колонки включен фильтр) */}
        {hasFilter && (
          <button
            className={`filter-btn ${
              header.column.getFilterValue() ? "active" : ""
            }`}
            onClick={handleFilterClick}
            title="Фильтр"
          >
            {header.column.getFilterValue() ? "⏳" : "🔽"}
          </button>
        )}

        {/* Выпадающий фильтр */}
        {showFilter && hasFilter && (
          <FilterDropdown
            column={header.column}
            onClose={() => setShowFilter(false)}
            allValues={allValues}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
            applyFilter={applyFilter}
            resetFilter={resetFilter}
            position={position}
            isStringColumn={isStringColumn}
          />
        )}
      </div>
    </div>
  );
};

/**
 * DataTable - основной компонент таблицы
 *
 * Использует TanStack Table для:
 * - Управления состоянием таблицы
 * - Сортировки, фильтрации, ресайза
 * - Визуализации данных через грид-сетку
 */
const DataTable = ({ data }) => {
  /**
   * Определение колонок таблицы
   *
   * Каждая колонка имеет:
   * - accessorKey: ключ для доступа к данным
   * - header: заголовок колонки
   * - cell: функция рендеринга ячейки
   * - enableColumnFilter: включение фильтрации
   * - enableSorting: включение сортировки
   * - size/minSize/maxSize: настройки ресайза
   * - filterFn: функция фильтрации
   */
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Название",
        cell: (info) => info.getValue(),
        enableColumnFilter: true,
        enableSorting: true,
        size: 200,
        minSize: 80,
        maxSize: 400,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;

          const cellValue = String(row.getValue(columnId));

          // Фильтрация "По значениям"
          if (filterValue.type === "values") {
            const searchValue = filterValue.searchValue?.toLowerCase();
            const selectedOptions = filterValue.selectedOptions || [];

            let passes = true;

            if (searchValue) {
              passes = passes && cellValue.toLowerCase().includes(searchValue);
            }

            if (selectedOptions.length > 0) {
              passes = passes && selectedOptions.includes(cellValue);
            }

            return passes;
          }

          // Продвинутая фильтрация
          if (filterValue.type === "advanced") {
            const operator = filterValue.operator;
            const value1 = filterValue.value1;
            const value2 = filterValue.value2;

            switch (operator) {
              case "contains":
                return cellValue.toLowerCase().includes(value1.toLowerCase());
              case "equals":
                return cellValue === value1;
              case "startsWith":
                return cellValue.toLowerCase().startsWith(value1.toLowerCase());
              case "endsWith":
                return cellValue.toLowerCase().endsWith(value1.toLowerCase());
              case "empty":
                return !cellValue || cellValue.trim() === "";
              case "notEmpty":
                return cellValue && cellValue.trim() !== "";
              case "list":
                const list = value1.split(",").map((item) => item.trim());
                return list.includes(cellValue);
              default:
                return true;
            }
          }

          return true;
        },
      },
      {
        accessorKey: "weight",
        header: "Вес (кг)",
        cell: (info) => info.getValue(),
        enableColumnFilter: true,
        enableSorting: true,
        size: 120,
        minSize: 80,
        maxSize: 300,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;

          const cellValue = Number(row.getValue(columnId));

          if (filterValue.type === "values") {
            const searchValue = filterValue.searchValue?.toLowerCase();
            const selectedOptions = filterValue.selectedOptions || [];

            let passes = true;

            if (searchValue) {
              passes =
                passes && String(cellValue).toLowerCase().includes(searchValue);
            }

            if (selectedOptions.length > 0) {
              passes = passes && selectedOptions.includes(String(cellValue));
            }

            return passes;
          }

          if (filterValue.type === "advanced") {
            const operator = filterValue.operator;
            const value1 = Number(filterValue.value1);
            const value2 = Number(filterValue.value2);

            switch (operator) {
              case "equals":
                return cellValue === value1;
              case "greaterThan":
                return cellValue > value1;
              case "lessThan":
                return cellValue < value1;
              case "between":
                return cellValue >= value1 && cellValue <= value2;
              case "empty":
                return isNaN(cellValue) || cellValue === null;
              case "notEmpty":
                return !isNaN(cellValue) && cellValue !== null;
              case "list":
                const list = filterValue.value1
                  .split(",")
                  .map((item) => Number(item.trim()));
                return list.includes(cellValue);
              default:
                return true;
            }
          }

          return true;
        },
      },
      {
        accessorKey: "speed",
        header: "Скорость (км/ч)",
        cell: (info) => info.getValue(),
        enableColumnFilter: true,
        enableSorting: true,
        size: 120,
        minSize: 80,
        maxSize: 300,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;

          const cellValue = Number(row.getValue(columnId));

          if (filterValue.type === "values") {
            const searchValue = filterValue.searchValue?.toLowerCase();
            const selectedOptions = filterValue.selectedOptions || [];

            let passes = true;

            if (searchValue) {
              passes =
                passes && String(cellValue).toLowerCase().includes(searchValue);
            }

            if (selectedOptions.length > 0) {
              passes = passes && selectedOptions.includes(String(cellValue));
            }

            return passes;
          }

          if (filterValue.type === "advanced") {
            const operator = filterValue.operator;
            const value1 = Number(filterValue.value1);
            const value2 = Number(filterValue.value2);

            switch (operator) {
              case "equals":
                return cellValue === value1;
              case "greaterThan":
                return cellValue > value1;
              case "lessThan":
                return cellValue < value1;
              case "between":
                return cellValue >= value1 && cellValue <= value2;
              case "empty":
                return isNaN(cellValue) || cellValue === null;
              case "notEmpty":
                return !isNaN(cellValue) && cellValue !== null;
              case "list":
                const list = filterValue.value1
                  .split(",")
                  .map((item) => Number(item.trim()));
                return list.includes(cellValue);
              default:
                return true;
            }
          }

          return true;
        },
      },
      {
        accessorKey: "length",
        header: "Длина (м)",
        cell: (info) => info.getValue(),
        enableColumnFilter: true,
        enableSorting: true,
        size: 120,
        minSize: 80,
        maxSize: 300,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;

          const cellValue = Number(row.getValue(columnId));

          if (filterValue.type === "values") {
            const searchValue = filterValue.searchValue?.toLowerCase();
            const selectedOptions = filterValue.selectedOptions || [];

            let passes = true;

            if (searchValue) {
              passes =
                passes && String(cellValue).toLowerCase().includes(searchValue);
            }

            if (selectedOptions.length > 0) {
              passes = passes && selectedOptions.includes(String(cellValue));
            }

            return passes;
          }

          if (filterValue.type === "advanced") {
            const operator = filterValue.operator;
            const value1 = Number(filterValue.value1);
            const value2 = Number(filterValue.value2);

            switch (operator) {
              case "equals":
                return cellValue === value1;
              case "greaterThan":
                return cellValue > value1;
              case "lessThan":
                return cellValue < value1;
              case "between":
                return cellValue >= value1 && cellValue <= value2;
              case "empty":
                return isNaN(cellValue) || cellValue === null;
              case "notEmpty":
                return !isNaN(cellValue) && cellValue !== null;
              case "list":
                const list = filterValue.value1
                  .split(",")
                  .map((item) => Number(item.trim()));
                return list.includes(cellValue);
              default:
                return true;
            }
          }

          return true;
        },
      },
    ],
    []
  );

  // Состояния для управления таблицей
  const [sorting, setSorting] = useState([]); // Сортировка
  const [columnFilters, setColumnFilters] = useState([]); // Фильтры
  const [columnSizing, setColumnSizing] = useState({}); // Размеры колонок

  /**
   * Инициализация TanStack Table
   *
   * useReactTable создает виртуальную таблицу с:
   * - Управлением состоянием
   * - Автоматическим обновлением при изменении данных
   * - Встроенными функциями сортировки, фильтрации, ресайза
   */
  const table = useReactTable({
    data, // Массив данных
    columns, // Конфигурация колонок
    state: {
      sorting, // Состояние сортировки
      columnFilters, // Состояние фильтров
      columnSizing, // Состояние размеров колонок
    },
    onSortingChange: setSorting, // Обработчик изменения сортировки
    onColumnFiltersChange: setColumnFilters, // Обработчик изменения фильтров
    onColumnSizingChange: setColumnSizing, // Обработчик изменения размеров
    getCoreRowModel: getCoreRowModel(), // Модель для базовых строк
    getSortedRowModel: getSortedRowModel(), // Модель для сортированных строк
    getFilteredRowModel: getFilteredRowModel(), // Модель для отфильтрованных строк
    enableColumnResizing: true, // Включение ресайза колонок
    columnResizeMode: "onChange", // Режим ресайза (в реальном времени)
  });

  return (
    <div className="data-table-container">
      {/* Грид-сетка таблицы */}
      <div className="table-grid">
        {/* Заголовок таблицы */}
        <div className="table-grid-header">
          {table.getHeaderGroups().map((headerGroup) => (
            <div key={headerGroup.id} className="grid-row">
              {headerGroup.headers.map((header) => (
                <HeaderCell key={header.id} header={header} tableData={data} />
              ))}
            </div>
          ))}
        </div>

        {/* Тело таблицы с вертикальным скроллом */}
        <div className="table-grid-body">
          {table.getRowModel().rows.map((row) => (
            <div key={row.id} className="grid-row">
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  className="grid-cell"
                  style={{
                    width: cell.column.getSize(),
                    minWidth: cell.column.columnDef.minSize || 80,
                  }}
                >
                  {/* Рендерим содержимое ячейки */}
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Сообщение при отсутствии данных */}
        {table.getRowModel().rows.length === 0 && (
          <div className="no-data-message">
            Нет данных, соответствующих фильтрам
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
