import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUser, useIsAdmin } from "./context/UserContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import LikedProducts from "./pages/LikedProducts";
import MyReviews from "./pages/MyReviews";
import ProductDetail from "./pages/ProductDetail";
import Recommendations from "./pages/Recommendations";
import AdminPanel from "./pages/AdminPanel";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import ChangePassword from "./pages/ChangePassword";
import Profile from "./pages/Profile";

function App() {
  const { user_id } = useUser();
  const isAdmin = useIsAdmin();
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <div className="page-container-main">
        <Routes>
          <Route
            path="/"
            element={<Landing />}
          />
          <Route
            path="/profile"
            element={user_id ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={!user_id ? <Login /> : <Navigate to="/shop" />}
          />
          <Route
            path="/register"
            element={!user_id ? <Register /> : <Navigate to="/shop" />}
          />
          <Route
            path="/shop"
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
            element={user_id && isAdmin ? <AdminPanel /> : <Navigate to={user_id ? "/shop" : "/login"} />}
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
            path="/change-password"
            element={user_id ? <ChangePassword /> : <Navigate to="/login" />}
          />
          <Route
            path="*"
            element={<Navigate to={user_id ? "/shop" : "/"} />}
          />
        </Routes>
      </div>
      <Footer />
    </>
  );
}
export default App;
