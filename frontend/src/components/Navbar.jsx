import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useUser, useIsAdmin } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  User,
  Heart,
  Star,
  Sparkles,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Lock,
  Package
} from "lucide-react";

const Navbar = () => {
  const { user_id, userName, logout } = useUser();
  const isAdmin = useIsAdmin();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = getCartCount();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const handleMouseEnter = () => {
    if (dropdownTimeout) clearTimeout(dropdownTimeout);
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => setShowDropdown(false), 300);
    setDropdownTimeout(timeout);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  const navLinks = user_id ? [
    { to: "/", label: "Home", icon: <Sparkles size={18} /> },
    { to: "/shop", label: "Shop", icon: <ShoppingBag size={18} /> },
    { to: "/recommendations", label: "Smart Picks", icon: <Sparkles size={18} /> },
    { to: "/liked", label: "Wishlist", icon: <Heart size={18} /> },
    { to: "/reviews", label: "Reviews", icon: <Star size={18} /> },
    { to: "/orders", label: "Orders", icon: <Package size={18} /> },
  ] : [
    { to: "/", label: "Home", icon: <Sparkles size={18} /> },
    { to: "/login", label: "Login", icon: <Lock size={18} /> },
    { to: "/register", label: "Sign Up", icon: <User size={18} /> },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          <Sparkles className="brand-icon" />
          <span>RecoSense</span>
        </NavLink>

        {/* Desktop Links */}
        <div className="navbar-links-desktop">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
          {user_id && (
            <NavLink to="/cart" className="nav-item cart-item">
              <ShoppingBag size={18} />
              <span>Cart</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className="nav-item admin-badge">
              <span>Admin</span>
            </NavLink>
          )}
        </div>

        {/* User Profile / Auth Actions */}
        <div className="navbar-actions">
          {user_id ? (
            <div className="user-dropdown-container"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className={`user-profile ${showDropdown ? 'active' : ''}`}
                onClick={() => {
                  if (dropdownTimeout) clearTimeout(dropdownTimeout);
                  setShowDropdown(!showDropdown);
                }}
              >
                <div className="avatar">{userName?.charAt(0).toUpperCase()}</div>
                <span className="username">{userName}</span>
                <ChevronDown size={14} className={`dropdown-arrow ${showDropdown ? 'rotated' : ''}`} />
              </div>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className="dropdown-menu-premium"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <button onClick={() => { setShowDropdown(false); navigate('/profile'); }}>
                      <User size={16} /> My Profile
                    </button>
                    <button onClick={() => { setShowDropdown(false); navigate('/change-password'); }}>
                      <Lock size={16} /> Change Password
                    </button>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="logout-btn">
                      <LogOut size={16} /> Signature Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="auth-buttons">
              <NavLink to="/login" className="btn-secondary btn-sm">Sign In</NavLink>
              <NavLink to="/register" className="btn-primary btn-sm">Join Now</NavLink>
            </div>
          )}

          <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="mobile-nav-item"
              >
                {link.icon} {link.label}
              </NavLink>
            ))}
            {user_id && (
              <>
                <NavLink to="/profile" onClick={() => setIsOpen(false)} className="mobile-nav-item">
                  <User size={18} /> Profile
                </NavLink>
                <button onClick={handleLogout} className="mobile-nav-item logout">
                  <LogOut size={18} /> Logout
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
