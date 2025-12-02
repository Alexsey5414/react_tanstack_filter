import React, { useMemo, useState, useEffect } from "react";
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
}) => {
  const dropdownRef = React.useRef(null);

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

  const handleCheckboxChange = (value) => {
    setSelectedOptions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  // Фильтрация значений по текстовому полю
  const filteredValues = allValues.filter((value) => {
    if (!filterValue.trim()) return true;
    return value.toLowerCase().includes(filterValue.toLowerCase());
  });

  // Галочка в заголовке - выбрать все/снять все
  const handleHeaderCheckboxChange = () => {
    if (selectedOptions.length === filteredValues.length) {
      // Если все уже выбраны - снять все
      setSelectedOptions([]);
    } else {
      // Выбрать все отфильтрованные значения
      setSelectedOptions([...filteredValues]);
    }
  };

  // Определяем состояние галочки в заголовке
  const isAllChecked =
    filteredValues.length > 0 &&
    selectedOptions.length === filteredValues.length;
  const isSomeChecked =
    selectedOptions.length > 0 &&
    selectedOptions.length < filteredValues.length;

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

      <div className="filter-content">
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
  const headerRef = React.useRef(null);

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
  const handleFilterClick = () => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
      });
    }
    setShowFilter(true);
  };

  // Применение фильтра
  const applyFilter = () => {
    const columnId = header.column.id;

    if (filterValue.trim() || selectedOptions.length > 0) {
      header.column.setFilterValue({
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
      if (currentFilter) {
        setFilterValue(currentFilter.searchValue || "");
        setSelectedOptions(currentFilter.selectedOptions || []);
      } else {
        setFilterValue("");
        setSelectedOptions([]);
      }
    }
  }, [showFilter, header.column]);

  return (
    <th
      ref={headerRef}
      className="header-cell"
      style={{ position: "relative" }}
    >
      <div className="header-content">
        <div className="header-text">
          {flexRender(header.column.columnDef.header, header.getContext())}
        </div>

        <button
          className={`filter-btn ${
            header.column.getFilterValue() ? "active" : ""
          }`}
          onClick={handleFilterClick}
          title="Фильтр"
        >
          ⚙️
        </button>

        {showFilter && (
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
          />
        )}
      </div>
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
      },
      {
        accessorKey: "weight",
        header: "Вес (кг)",
        cell: (info) => info.getValue(),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;

          const value = String(row.getValue(columnId));
          const searchValue = filterValue.searchValue?.toLowerCase();
          const selectedOptions = filterValue.selectedOptions || [];

          let passes = true;

          // Фильтрация по поисковому значению
          if (searchValue) {
            passes = passes && value.toLowerCase().includes(searchValue);
          }

          // Фильтрация по выбранным опциям
          if (selectedOptions.length > 0) {
            passes = passes && selectedOptions.includes(value);
          }

          return passes;
        },
      },
      {
        accessorKey: "speed",
        header: "Скорость (км/ч)",
        cell: (info) => info.getValue(),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;

          const value = String(row.getValue(columnId));
          const searchValue = filterValue.searchValue?.toLowerCase();
          const selectedOptions = filterValue.selectedOptions || [];

          let passes = true;

          if (searchValue) {
            passes = passes && value.toLowerCase().includes(searchValue);
          }

          if (selectedOptions.length > 0) {
            passes = passes && selectedOptions.includes(value);
          }

          return passes;
        },
      },
      {
        accessorKey: "length",
        header: "Длина (м)",
        cell: (info) => info.getValue(),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;

          const value = String(row.getValue(columnId));
          const searchValue = filterValue.searchValue?.toLowerCase();
          const selectedOptions = filterValue.selectedOptions || [];

          let passes = true;

          if (searchValue) {
            passes = passes && value.toLowerCase().includes(searchValue);
          }

          if (selectedOptions.length > 0) {
            passes = passes && selectedOptions.includes(value);
          }

          return passes;
        },
      },
    ],
    []
  );

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
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
