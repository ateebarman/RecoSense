import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser, useIsAdmin } from "../context/UserContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const { userName, logout } = useUser();
  const isAdmin = useIsAdmin();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const cartCount = getCartCount();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeIfOpen = () => setOpen(false);

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div className="navbar-brand">Recommender</div>
        <button
          className="navbar-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          ☰
        </button>
      </div>

      <div className={`navbar-links ${open ? 'open' : ''}`}>
        <NavLink to="/" onClick={closeIfOpen}>All Products</NavLink>
        <NavLink to="/liked" onClick={closeIfOpen}>Liked Products</NavLink>
        <NavLink to="/reviews" onClick={closeIfOpen}>My Reviews</NavLink>
        <NavLink to="/recommendations" onClick={closeIfOpen}>Recommendations</NavLink>
        {isAdmin && <NavLink to="/admin" onClick={closeIfOpen}>Admin</NavLink>}
        <NavLink to="/orders" onClick={closeIfOpen}>📦 Orders</NavLink>
        <NavLink to="/cart" className="cart-link" onClick={closeIfOpen}>
          🛒 Cart
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </NavLink>
      </div>

      <div className="navbar-user">
        <span>Welcome, {userName || "Reviewer"}</span>
        <NavLink to="/change-password" style={{ marginLeft: '10px', marginRight: '10px' }} onClick={closeIfOpen}>Change Password</NavLink>
        <button onClick={() => { handleLogout(); closeIfOpen(); }}>Logout</button>
      </div>
    </nav>
  );
};
export default Navbar;
