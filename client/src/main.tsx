import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

// StrictMode is intentionally omitted: the 3D hero mutates letter geometry once
// in a layout effect, and StrictMode's double-invoke would apply it twice.
createRoot(document.getElementById("root")!).render(<App />);
