import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const { userName, logout } = useUser();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const cartCount = getCartCount();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-links">
        <NavLink to="/">All Products</NavLink>
        <NavLink to="/liked">Liked Products</NavLink>
        <NavLink to="/reviews">My Reviews</NavLink>
        <NavLink to="/recommendations">Recommendations</NavLink>
        <NavLink to="/orders">📦 Orders</NavLink>
        <NavLink to="/cart" className="cart-link">
          🛒 Cart
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </NavLink>
      </div>
      <div className="navbar-user">
        <span>Welcome, {userName || "Reviewer"}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};
export default Navbar;
