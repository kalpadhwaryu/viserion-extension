import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const popup = (
  <div>
    <h1>Hello World</h1>
    <App />
  </div>
);

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
root.render(popup);
