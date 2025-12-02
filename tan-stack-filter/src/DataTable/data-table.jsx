import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import "./data-table.css";

// Компонент выпадающего фильтра
const FilterDropdown = ({
  column,
  onClose,
  allValues = [],
  filterValue = "",
  setFilterValue,
  selectedOptions = [],
  setSelectedOptions,
  applyFilter,
  resetFilter,
  position,
  isStringColumn = true,
}) => {
  const dropdownRef = useRef(null);
  const [activeTab, setActiveTab] = useState("values"); // 'values' или 'advanced'
  const [advancedFilter, setAdvancedFilter] = useState({
    operator: "contains",
    value1: "",
    value2: "",
  });

  // Закрытие при клике вне dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Инициализация продвинутого фильтра
  useEffect(() => {
    const currentFilter = column.getFilterValue();
    if (currentFilter && currentFilter.type === "advanced") {
      setAdvancedFilter(currentFilter);
    }
  }, [column]);

  // Обработчики для вкладки со значениями
  const handleCheckboxChange = (value) => {
    setSelectedOptions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const filteredValues = allValues.filter((value) => {
    if (!filterValue.trim()) return true;
    return value.toLowerCase().includes(filterValue.toLowerCase());
  });

  const handleHeaderCheckboxChange = () => {
    if (selectedOptions.length === filteredValues.length) {
      setSelectedOptions([]);
    } else {
      setSelectedOptions([...filteredValues]);
    }
  };

  const isAllChecked =
    filteredValues.length > 0 &&
    selectedOptions.length === filteredValues.length;
  const isSomeChecked =
    selectedOptions.length > 0 &&
    selectedOptions.length < filteredValues.length;

  // Обработчики для продвинутой вкладки
  const handleOperatorChange = (e) => {
    setAdvancedFilter((prev) => ({
      ...prev,
      operator: e.target.value,
      value2: e.target.value === "between" ? prev.value2 : "",
    }));
  };

  const handleAdvancedValueChange = (field, value) => {
    setAdvancedFilter((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Применение продвинутого фильтра
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

  // Сброс продвинутого фильтра
  const resetAdvancedFilter = () => {
    setAdvancedFilter({
      operator: "contains",
      value1: "",
      value2: "",
    });
    column.setFilterValue(undefined);
    onClose();
  };

  // Операторы для разных типов колонок
  const stringOperators = [
    { value: "contains", label: "Содержит" },
    { value: "equals", label: "Равно" },
    { value: "startsWith", label: "Начинается с" },
    { value: "endsWith", label: "Заканчивается на" },
    { value: "empty", label: "Пустое" },
    { value: "notEmpty", label: "Не пустое" },
    { value: "list", label: "Список" },
  ];

  const numberOperators = [
    { value: "equals", label: "Равно" },
    { value: "greaterThan", label: "Больше" },
    { value: "lessThan", label: "Меньше" },
    { value: "between", label: "Между" },
    { value: "empty", label: "Пустое" },
    { value: "notEmpty", label: "Не пустое" },
    { value: "list", label: "Список" },
  ];

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
      <div className="filter-header">
        <h4>Фильтр: {column.columnDef.header}</h4>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      {/* Вкладки */}
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
        {activeTab === "values" ? (
          <>
            {/* Текстовое поле поиска */}
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
            {/* Продвинутый фильтр */}
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

// Компонент заголовка таблицы с фильтром
const HeaderCell = ({ header, tableData }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [allValues, setAllValues] = useState([]);
  const headerRef = useRef(null);
  const resizerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);

  // Получаем уникальные значения для колонки
  useEffect(() => {
    const columnId = header.column.id;

    if (!tableData || tableData.length === 0) {
      setAllValues([]);
      return;
    }

    const columnValues = tableData
      .map((row) => row[columnId])
      .filter((value) => value !== undefined && value !== null)
      .map((value) => String(value));

    setAllValues([...new Set(columnValues)].sort());
  }, [tableData, header.column.id]);

  // Обработчик открытия фильтра
  const handleFilterClick = (e) => {
    e.stopPropagation();
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
      });
    }
    setShowFilter(!showFilter);
  };

  // Применение фильтра по значениям
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

  // Сброс фильтра
  const resetFilter = () => {
    setFilterValue("");
    setSelectedOptions([]);
    header.column.setFilterValue(undefined);
    setShowFilter(false);
  };

  // Инициализация значений при открытии
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

  // Обработка resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const headerElement = headerRef.current;
      if (!headerElement) return;

      const width = e.clientX - headerElement.getBoundingClientRect().left;
      if (width > 50) {
        // Минимальная ширина
        header.column.setSize(width);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, header.column]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  // Определяем тип колонки для фильтра
  const isStringColumn = header.column.id === "name";
  const hasFilter = header.column.columnDef.enableColumnFilter !== false;

  return (
    <th
      ref={headerRef}
      className="header-cell"
      style={{
        position: "relative",
        width: header.column.getSize(),
        minWidth: "80px",
      }}
      onClick={() => {
        if (!isResizing) {
          header.column.getToggleSortingHandler()();
        }
      }}
    >
      <div className="header-content">
        <div className="header-text">
          {flexRender(header.column.columnDef.header, header.getContext())}
          {header.column.getIsSorted() && (
            <span className="sort-icon">
              {header.column.getIsSorted() === "asc" ? "↑" : "↓"}
            </span>
          )}
        </div>

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

      {/* Resize handle */}
      <div
        ref={resizerRef}
        className={`resizer ${isResizing ? "active" : ""}`}
        onMouseDown={handleResizeStart}
        onClick={(e) => e.stopPropagation()}
      />
    </th>
  );
};

// Основной компонент таблицы
const DataTable = ({ data }) => {
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Название",
        cell: (info) => info.getValue(),
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;

          const cellValue = String(row.getValue(columnId));

          // Фильтрация по значениям
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

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnSizing, setColumnSizing] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <HeaderCell key={header.id} header={header} tableData={data} />
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {table.getRowModel().rows.length === 0 && (
        <div className="no-data-message">
          Нет данных, соответствующих фильтрам
        </div>
      )}
    </div>
  );
};

export default DataTable;
