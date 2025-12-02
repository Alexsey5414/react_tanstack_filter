import React from "react";
import FilterableTable from "./FilterableTable/filterable-table";
import "./App.css";

function App() {
  const data = [
    { id: 1, name: "Объект A", weight: 100, speed: 50, length: 10 },
    { id: 2, name: "Объект B", weight: 200, speed: 30, length: 15 },
    { id: 3, name: "Объект C", weight: 150, speed: 70, length: 8 },
    { id: 4, name: "Объект D", weight: 80, speed: 90, length: 12 },
    { id: 5, name: "Объект E", weight: 250, speed: 40, length: 20 },
    { id: 6, name: "Объект F", weight: 120, speed: 60, length: 6 },
    { id: 7, name: "Объект G", weight: 180, speed: 55, length: 14 },
    { id: 8, name: "Объект H", weight: 90, speed: 75, length: 9 },
  ];

  return (
    <div className="App">
      <header className="App-header">
        <h1>Таблица с фильтрацией</h1>
        <p>Используйте кнопки ⚙️ в заголовках для фильтрации</p>
      </header>

      <main className="App-main">
        <FilterableTable data={data} />
      </main>
    </div>
  );
}

export default App;
