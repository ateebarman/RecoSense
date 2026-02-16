import React from "react";
import { Link } from "react-router-dom";
import {
    Github,
    Twitter,
    Linkedin,
    MessageSquare,
    Sparkles,
    Heart
} from "lucide-react";

const Footer = () => {
    return (
        <footer className="main-footer">
            <div className="footer-grid">
                <div className="footer-col footer-info-col">
                    <div className="navbar-brand">
                        <Sparkles className="brand-icon" size={24} />
                        <span>RecoSense</span>
                    </div>
                    <p>Empowering consumers to master the electronics market through personalized, model-driven discovery paths and community-enriched reviews.</p>
                    <div className="social-links">
                        <a href="#" className="social-link"><Github size={20} /></a>
                        <a href="#" className="social-link"><Twitter size={20} /></a>
                        <a href="#" className="social-link"><Linkedin size={20} /></a>
                        <a href="#" className="social-link"><MessageSquare size={20} /></a>
                    </div>
                </div>

                <div className="footer-col">
                    <h4>Platform</h4>
                    <ul className="footer-links-list">
                        <li><Link to="/shop">Shop Catalog</Link></li>
                        <li><Link to="/recommendations">Smart Picks</Link></li>
                        <li><Link to="/liked">Wishlist</Link></li>
                        <li><Link to="/reviews">My Reviews</Link></li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Resources</h4>
                    <ul className="footer-links-list">
                        <li><a href="#">Help Documentation</a></li>
                        <li><a href="#">API Specification</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Security Standards</a></li>
                    </ul>
                </div>

                <div className="footer-col footer-newsletter">
                    <h4>Product Updates</h4>
                    <p>Get notified about new model refreshes and curated smartphone collections.</p>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="you@email.com" className="newsletter-input" />
                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Subscribe</button>
                    </form>
                </div>
            </div>

        </footer>
    );
};

export default Footer;
