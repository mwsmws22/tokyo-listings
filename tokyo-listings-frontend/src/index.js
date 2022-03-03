import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ImageViewer from "./components/image-viewer.component";
import App from "./App";

ReactDOM.render(
  <Router>
    <Routes>
      <Route path="/*" element={<App />} />
      <Route path="/images/:listingId" element={<ImageViewer />} />
    </Routes>
  </Router>,
  document.getElementById("root")
);
