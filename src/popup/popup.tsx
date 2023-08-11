import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const popup = (
  <div style={{ height: 500, width: 300}}>
    <h2 style={{ textAlign: "center" }}>Viserion</h2>
    <App />
  </div>
);

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
root.render(popup);
