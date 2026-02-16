import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getUserOrders, getOrderStats } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  Timer,
  ShoppingBag
} from 'lucide-react';
import '../styles/Orders.css';

const Orders = () => {
  const { user_id, userName } = useUser();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [user_id]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const [ordersRes, statsRes] = await Promise.all([
        getUserOrders(user_id),
        getOrderStats(user_id),
      ]);
      setOrders(ordersRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load your order history.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString, showTime = true) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(showTime && { hour: '2-digit', minute: '2-digit' })
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { label: 'Pending', class: 'badge-warning', icon: <Timer size={14} /> };
      case 'confirmed': return { label: 'Confirmed', class: 'badge-info', icon: <CheckCircle2 size={14} /> };
      case 'shipped': return { label: 'Shipped', class: 'badge-info', icon: <Truck size={14} /> };
      case 'delivered': return { label: 'Delivered', class: 'badge-success', icon: <CheckCircle2 size={14} /> };
      case 'cancelled': return { label: 'Cancelled', class: 'badge-danger', icon: <Clock size={14} /> };
      default: return { label: status, class: '', icon: null };
    }
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-shimmer-grid">
          {[...Array(3)].map((_, i) => <div key={i} className="shimmer-card" style={{ height: '100px' }}></div>)}
          {[...Array(2)].map((_, i) => <div key={i} className="shimmer-card" style={{ height: '300px' }}></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="welcome-badge">
            <Package size={14} />
            <span>Tracking your deliveries</span>
          </div>
          <h1>Order <span className="gradient-text">History</span></h1>
        </motion.div>

        {stats && (
          <div className="header-meta-group">
            <div className="meta-item">
              <ShoppingBag size={18} />
              <span>{stats.totalOrders} Orders</span>
            </div>
          </div>
        )}
      </header>

      {error && <div className="error-message glass-card">{error}</div>}

      {stats && (
        <div className="stat-grid-premium">
          <motion.div
            className="stat-card-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-icon"><Package /></div>
            <div className="stat-info">
              <h3>{stats.totalOrders}</h3>
              <p>Total Orders</p>
            </div>
          </motion.div>
          <motion.div
            className="stat-card-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-icon"><DollarSign /></div>
            <div className="stat-info">
              <h3>${stats.totalSpent.toFixed(2)}</h3>
              <p>Total Investment</p>
            </div>
          </motion.div>
          <motion.div
            className="stat-card-premium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="stat-icon"><TrendingUp /></div>
            <div className="stat-info">
              <h3>${stats.averageOrderValue.toFixed(2)}</h3>
              <p>Avg Order Value</p>
            </div>
          </motion.div>
        </div>
      )}

      {orders.length === 0 ? (
        <motion.div
          className="empty-state-premium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="empty-icon"><ShoppingBag /></div>
          <h3>No orders yet</h3>
          <p>Your history is waiting for your first discovery.</p>
          <button className="btn-primary" onClick={() => window.location.href = '/shop'}>
            Go to Shop <ArrowRight size={18} />
          </button>
        </motion.div>
      ) : (
        <div className="orders-list-premium">
          <AnimatePresence>
            {orders.map((order, index) => {
              const statusInfo = getStatusInfo(order.status);
              const isExpanded = expandedOrder === order._id;

              return (
                <motion.div
                  key={order._id}
                  className={`order-group glass-card ${isExpanded ? 'active' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="order-summary-row" onClick={() => toggleExpandOrder(order._id)}>
                    <div className="order-main-info">
                      <div className="order-number-group">
                        <span className="order-id-label">ORDER #{order.orderNumber}</span>
                        <div className="order-date-row">
                          <Calendar size={14} />
                          <span>{formatDate(order.orderDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="order-meta-info">
                      <span className={`badge-premium ${statusInfo.class}`}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                      <div className="order-total-group">
                        <span className="total-val">${order.total.toFixed(2)}</span>
                        <ChevronRight className={`expand-arrow ${isExpanded ? 'rotated' : ''}`} />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="order-expanded-details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="details-grid">
                          <div className="details-main">
                            <h4 className="section-title">Items Information</h4>
                            <div className="expanded-items-list">
                              {order.items.map((item, i) => (
                                <div key={i} className="expanded-item">
                                  <div className="item-img-container">
                                    <img src={item.image || 'https://via.placeholder.com/60'} alt={item.title} />
                                  </div>
                                  <div className="item-text-info">
                                    <p className="item-title">{item.title}</p>
                                    <p className="item-meta">Qty: {item.quantity} • {item.price}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="details-sidebar">
                            <div className="details-sidebar-card">
                              <h4 className="section-title">Shipping To</h4>
                              <div className="shipping-address-box">
                                <p className="shipping-name">{order.shippingInfo.firstName} {order.shippingInfo.lastName}</p>
                                <p className="shipping-addr">{order.shippingInfo.address}</p>
                                <p className="shipping-loc">{order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zipCode}</p>
                              </div>
                            </div>

                            <div className="details-sidebar-card">
                              <h4 className="section-title">Price Breakdown</h4>
                              <div className="breakdown-list">
                                <div className="breakdown-item">
                                  <span>Subtotal</span>
                                  <span>${order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="breakdown-item">
                                  <span>Shipping</span>
                                  <span>${order.shipping.toFixed(2)}</span>
                                </div>
                                <div className="breakdown-item">
                                  <span>Tax</span>
                                  <span>${order.tax.toFixed(2)}</span>
                                </div>
                                <div className="breakdown-item total">
                                  <span>Total</span>
                                  <span>${order.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="order-track-timeline">
                          <h4 className="section-title">Order Progress</h4>
                          <div className="modern-timeline">
                            {[
                              { label: 'Confirmed', date: formatDate(order.orderDate, false), active: true },
                              { label: 'Processing', date: 'Done', active: true },
                              { label: 'Shipped', date: 'Expected Soon', active: order.status === 'shipped' || order.status === 'delivered' },
                              { label: 'Delivered', date: 'Expected Soon', active: order.status === 'delivered' }
                            ].map((step, i) => (
                              <div key={i} className={`timeline-step ${step.active ? 'active' : ''}`}>
                                <div className="step-marker">
                                  {step.active ? <CheckCircle2 size={16} /> : <div className="step-dot" />}
                                </div>
                                <div className="step-label">
                                  <span className="step-name">{step.label}</span>
                                  <span className="step-date">{step.date}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Orders;
