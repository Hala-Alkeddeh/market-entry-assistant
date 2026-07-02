import AppRouter from "./router/AppRouter";
import "./App.css";

export default function App() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <AppRouter />
      </main>
    </div>
  );
}