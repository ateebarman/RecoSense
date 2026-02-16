import React from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import {
    ShoppingBag,
    Sparkles,
    Search,
    TrendingUp,
    ShieldCheck,
    Users,
    ArrowRight,
    Star,
    BrainCircuit,
    Zap,
    Shield,
    Globe,
    Github,
    Twitter,
    Linkedin,
    MessageSquare,
    Quote,
    Heart,
    Smartphone,
    BarChart3,
    Database
} from "lucide-react";

const Landing = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0, opacity: 1
        }
    };

    return (
        <div className="landing-page">
            <motion.div className="scroll-progress" style={{ scaleX }} />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-background">
                    <div className="glow glow-1"></div>
                    <div className="glow glow-2"></div>
                </div>

                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="badge">
                        <Sparkles size={14} className="text-primary" />
                        <span>Advanced Hybrid Recommendation Engine</span>
                    </div>

                    <h1 className="hero-title">
                        Find Your Perfect <br />
                        <span className="gradient-text">Smartphone</span> Match
                    </h1>

                    <p className="hero-subtitle">
                        Experience the next generation of electronics discovery. Driven by
                        RoBERTa sentiment models and LightFM hybrid filtering for
                        unprecedented recommendation precision.
                    </p>

                    <div className="hero-actions">
                        <Link to="/register" className="btn-primary btn-lg shadow-glow">
                            Start Exploring <ArrowRight size={20} />
                        </Link>
                        <Link to="/shop" className="btn-secondary btn-lg">
                            Browse Catalog
                        </Link>
                    </div>

                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-value">50k+</span>
                            <span className="stat-label">Smartphones</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-value">98%</span>
                            <span className="stat-label">Model Accuracy</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-value">120k+</span>
                            <span className="stat-label">Reviews Analyzed</span>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2 className="section-title">Technologically <span className="gradient-text">Advanced</span></h2>
                    <p className="section-subtitle">Our engine leverages deep semantic analysis and collaborative patterns to refine your shopping experience.</p>
                </div>

                <motion.div
                    className="features-grid"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {[
                        { icon: <MessageSquare />, title: "RoBERTa Sentiment", desc: "Analysis of review semantics to understand the true qualitative experience of every device." },
                        { icon: <BrainCircuit />, title: "LightFM Hybrid", desc: "Collaborative filtering meets content metadata for high-recall, high-precision recommendations." },
                        { icon: <TrendingUp />, title: "Real-time Adaptation", desc: "Our model recomputes recommendations as you interact, adapting instantly to your changing taste." },
                        { icon: <Users />, title: "Demographic Precision", desc: "Smart cold-start logic that matches new users using robust age and gender profiling." },
                        { icon: <Database />, title: "Rich Metadata", desc: "Detailed smartphone specs and hierarchical categories intelligently organized for discovery." },
                        { icon: <BarChart3 />, title: "Quantitative Ranking", desc: "Products are ranked using multiple interaction weights (likes vs reviews) for better relevance." }
                    ].map((feature, i) => (
                        <motion.div key={i} className="feature-card" variants={itemVariants}>
                            <div className="feature-icon-wrapper">
                                {React.cloneElement(feature.icon, { className: "feature-icon" })}
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Info Section (Technically Superior) */}
            <section className="info-section">
                <div className="info-layout">
                    <motion.div
                        className="info-content"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2>Precision <br /><span className="gradient-text">Engineered discovery</span></h2>
                        <p>We've moved beyond simple popularity lists. RecoSense builds a personalized mathematical model of your preferences through cross-domain analytical patterns.</p>

                        <div className="info-points">
                            <div className="info-point">
                                <div className="point-icon"><Search size={20} /></div>
                                <div className="point-text">
                                    <h4>Semantic Extraction</h4>
                                    <p>RoBERTa models process user reviews to identify high-value attributes like battery life, camera quality, and value for money.</p>
                                </div>
                            </div>
                            <div className="info-point">
                                <div className="point-icon"><Shield size={20} /></div>
                                <div className="point-text">
                                    <h4>Secure Privacy</h4>
                                    <p>Your interaction history is processed using locally optimized inference to ensure your preferences stay private.</p>
                                </div>
                            </div>
                            <div className="info-point">
                                <div className="point-icon"><BarChart3 size={20} /></div>
                                <div className="point-text">
                                    <h4>Hybrid Accuracy</h4>
                                    <p>LightFM bridges the gap between 'what people like' and 'what you specifically need' using robust feature weighting.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="info-visual"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <div className="quote-card">
                            <div className="quote-icon">
                                <Quote size={32} />
                            </div>
                            <p className="quote-text">
                                "The recommendation engine predicted my next smartphone upgrade with 95% accuracy using just my review history."
                            </p>
                            <div className="quote-author">
                                <div className="author-avatar" style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(to bottom right, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>AM</div>
                                <div className="author-info">
                                    <strong>Ateeb M.</strong>
                                    <span>Tech Lead & Reviewer</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Big CTA Banner */}
            <section className="cta-banner-section">
                <motion.div
                    className="cta-banner-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    viewport={{ once: true }}
                >
                    <h2>Ready to Find Your <br />Next Favorite Device?</h2>
                    <p>Join the thousands of users finding their perfect smartphone match through predictive discovery.</p>
                    <Link to="/register" className="btn-cta-premium shadow-glow">
                        Get Started Free <ArrowRight size={20} />
                    </Link>
                </motion.div>
            </section>

            {/* Expanded Footer */}
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
                            <button type="submit" className="btn-primary w-full">Subscribe</button>
                        </form>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 RecoSense Engine. Engineering personalized discovery.</p>
                    <p>Built with <Heart size={14} fill="var(--secondary)" style={{ display: 'inline', verticalAlign: 'middle', border: 'none' }} stroke="none" /> for the modern tech enthusiast</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
