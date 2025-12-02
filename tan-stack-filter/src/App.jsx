import React from "react";
import DataTable from "./DataTable/data-table";
import "./App.css";

function App() {
  const data = [
    { id: 1, name: "Объект A", weight: "100", speed: "50", length: "10" },
    { id: 2, name: "Объект B", weight: "200", speed: "30", length: "15" },
    { id: 3, name: "Объект C", weight: "150", speed: "70", length: "8" },
    { id: 4, name: "Объект D", weight: "80", speed: "90", length: "12" },
    { id: 5, name: "Объект E", weight: "250", speed: "40", length: "20" },
    { id: 6, name: "Объект F", weight: "120", speed: "60", length: "6" },
    { id: 7, name: "Объект G", weight: "180", speed: "55", length: "14" },
    { id: 8, name: "Объект H", weight: "90", speed: "75", length: "9" },
    { id: 9, name: "Объект I", weight: "100", speed: "50", length: "11" },
    { id: 10, name: "Объект J", weight: "200", speed: "30", length: "16" },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Фильтрация таблицы</h1>
        <p className="app-subtitle">
          Нажмите на кнопку ⚙️ в заголовке столбца для фильтрации данных
        </p>
      </header>

      <main className="app-main">
        <div className="table-wrapper">
          <DataTable data={data} />
        </div>

        <div className="instructions">
          <h3>Как использовать:</h3>
          <ul>
            <li>Нажмите ⚙️ в заголовке столбца для открытия фильтра</li>
            <li>Введите текст в поле "Значение" для поиска</li>
            <li>Выберите конкретные значения из списка чекбоксов</li>
            <li>
              Используйте кнопки "Выбрать все" / "Очистить" для быстрого выбора
            </li>
            <li>
              Нажмите "Применить" для фильтрации или "Сбросить" для очистки
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
