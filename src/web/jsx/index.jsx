import React from "react";
import * as ReactDOMClient from "react-dom/client";
import WorkflowVisualizer from "./aworkflowvisualizer";


ReactDOMClient.createRoot(document.getElementById("root")).render(
    <WorkflowVisualizer />
);