import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUser, useIsAdmin } from "./context/UserContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import LikedProducts from "./pages/LikedProducts";
import MyReviews from "./pages/MyReviews";
import ProductDetail from "./pages/ProductDetail";
import Recommendations from "./pages/Recommendations";
import AdminPanel from "./pages/AdminPanel";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";

function App() {
  const { user_id } = useUser();
  const isAdmin = useIsAdmin();
  return (
    <>
      {user_id && <Navbar />}
      <div className="page-container">
        <Routes>
          <Route
            path="/login"
            element={!user_id ? <Login /> : <Navigate to="/" />}
          />
          <Route
            path="/register"
            element={!user_id ? <Register /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={user_id ? <Home /> : <Navigate to="/login" />}
          />
          <Route
            path="/liked"
            element={user_id ? <LikedProducts /> : <Navigate to="/login" />}
          />
          <Route
            path="/reviews"
            element={user_id ? <MyReviews /> : <Navigate to="/login" />}
          />
          <Route
            path="/recommendations"
            element={user_id ? <Recommendations /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin"
            element={user_id && isAdmin ? <AdminPanel /> : <Navigate to={user_id ? "/" : "/login"} />}
          />
          <Route
            path="/product/:asin"
            element={user_id ? <ProductDetail /> : <Navigate to="/login" />}
          />
          <Route
            path="/cart"
            element={user_id ? <Cart /> : <Navigate to="/login" />}
          />
          <Route
            path="/checkout"
            element={user_id ? <Checkout /> : <Navigate to="/login" />}
          />
          <Route
            path="/orders"
            element={user_id ? <Orders /> : <Navigate to="/login" />}
          />
          <Route
            path="*"
            element={<Navigate to={user_id ? "/" : "/login"} />}
          />
        </Routes>
      </div>
    </>
  );
}
export default App;
