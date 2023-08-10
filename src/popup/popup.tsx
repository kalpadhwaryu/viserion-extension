import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const popup = (
  <div>
    <h2>Viserion</h2>
    <App />
  </div>
);

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
root.render(popup);
