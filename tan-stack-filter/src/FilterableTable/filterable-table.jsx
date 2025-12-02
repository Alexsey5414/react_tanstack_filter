import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

import FilterDropdown from "../FilterDropdown/filter-dropdown";
import FilterableHeader from "../FilterableHeader/filterable-header";
import GlobalFilter from "../GlobalFilter/global-filter";
import "./filterable-table.css";

const FilterableTable = ({ data }) => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState({});

  const columnHelper = createColumnHelper();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Название",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("weight", {
        header: "Вес (кг)",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("speed", {
        header: "Скорость (км/ч)",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("length", {
        header: "Длина (м)",
        cell: (info) => info.getValue(),
      }),
    ],
    [columnHelper]
  );

  // Кастомная функция для глобальной фильтрации
  const customGlobalFilterFn = (rows, columnIds, filterValue) => {
    if (!filterValue || Object.keys(filterValue).length === 0) return rows;

    return rows.filter((row) => {
      let passes = true;

      if (filterValue.weightMin) {
        passes =
          passes && row.getValue("weight") >= Number(filterValue.weightMin);
      }

      if (filterValue.speedMin) {
        passes =
          passes && row.getValue("speed") >= Number(filterValue.speedMin);
      }

      if (filterValue.lengthMin) {
        passes =
          passes && row.getValue("length") >= Number(filterValue.lengthMin);
      }

      return passes;
    });
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: customGlobalFilterFn,
  });

  return (
    <div className="table-container">
      <div className="table-controls">
        <GlobalFilter
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          table={table}
        />

        {Object.keys(globalFilter).length > 0 && (
          <button
            className="reset-filters-btn"
            onClick={() => {
              setGlobalFilter({});
              setColumnFilters([]);
            }}
          >
            Сбросить все фильтры
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="filterable-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <FilterableHeader
                    key={header.id}
                    header={header}
                    globalFilter={globalFilter}
                  />
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
          {table.getRowModel().rows.length === 0 && (
            <tfoot>
              <tr>
                <td colSpan={columns.length} className="no-results">
                  Нет данных, соответствующих фильтрам
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="table-footer">
        <div className="row-count">
          Показано {table.getRowModel().rows.length} из {data.length} строк
        </div>
      </div>
    </div>
  );
};

export default FilterableTable;
