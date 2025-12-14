import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getUserOrders, getOrderStats } from '../services/api';
import '../styles/Orders.css';

const Orders = () => {
  const { user_id } = useUser();
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
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="orders-container">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <h1>My Orders</h1>

      {error && <p className="error-message">{error}</p>}

      {/* Order Statistics */}
      {stats && (
        <div className="order-stats">
          <div className="stat-card">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
          <div className="stat-card">
            <h3>${stats.totalSpent.toFixed(2)}</h3>
            <p>Total Spent</p>
          </div>
          <div className="stat-card">
            <h3>${stats.averageOrderValue.toFixed(2)}</h3>
            <p>Avg Order Value</p>
          </div>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders yet. Start shopping to place your first order!</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.orderNumber}</h3>
                  <p className="order-date">{formatDate(order.orderDate)}</p>
                </div>
                <div className="order-meta">
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="order-total">${order.total.toFixed(2)}</p>
                </div>
                <button
                  className="expand-btn"
                  onClick={() => toggleExpandOrder(order._id)}
                >
                  {expandedOrder === order._id ? '▼' : '▶'}
                </button>
              </div>

              {expandedOrder === order._id && (
                <div className="order-details">
                  {/* Items Section */}
                  <div className="details-section">
                    <h4>Items Ordered</h4>
                    <div className="order-items">
                      {order.items.map((item, index) => (
                        <div key={index} className="order-item">
                          <img
                            src={item.image || 'https://via.placeholder.com/60'}
                            alt={item.title}
                          />
                          <div className="item-info">
                            <p className="item-title">{item.title}</p>
                            <p className="item-brand">{item.brand}</p>
                            <p className="item-qty">Qty: {item.quantity}</p>
                          </div>
                          <div className="item-price">
                            <p>{item.price}</p>
                            <p className="item-subtotal">
                              ${(parseFloat(item.price?.replace('$', '') || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="details-section pricing">
                    <h4>Order Summary</h4>
                    <div className="pricing-row">
                      <span>Subtotal:</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="pricing-row">
                      <span>Shipping:</span>
                      <span>${order.shipping.toFixed(2)}</span>
                    </div>
                    <div className="pricing-row">
                      <span>Tax:</span>
                      <span>${order.tax.toFixed(2)}</span>
                    </div>
                    <div className="pricing-row total">
                      <span>Total:</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Shipping Section */}
                  <div className="details-section">
                    <h4>Shipping Information</h4>
                    <div className="shipping-info">
                      <p>
                        <strong>
                          {order.shippingInfo.firstName} {order.shippingInfo.lastName}
                        </strong>
                      </p>
                      <p>{order.shippingInfo.address}</p>
                      <p>
                        {order.shippingInfo.city}, {order.shippingInfo.state}{' '}
                        {order.shippingInfo.zipCode}
                      </p>
                      <p>Email: {order.shippingInfo.email}</p>
                      {order.shippingInfo.phone && <p>Phone: {order.shippingInfo.phone}</p>}
                    </div>
                  </div>

                  {/* Timeline Section */}
                  <div className="details-section">
                    <h4>Order Timeline</h4>
                    <div className="order-timeline">
                      <div className={`timeline-item ${order.status === 'confirmed' ? 'active' : 'completed'}`}>
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <p className="timeline-title">Order Confirmed</p>
                          <p className="timeline-date">{formatDate(order.orderDate)}</p>
                        </div>
                      </div>
                      <div
                        className={`timeline-item ${
                          order.status === 'shipped' ? 'active' : order.status === 'delivered' ? 'completed' : ''
                        }`}
                      >
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <p className="timeline-title">Order Shipped</p>
                          <p className="timeline-date">Coming soon</p>
                        </div>
                      </div>
                      <div
                        className={`timeline-item ${order.status === 'delivered' ? 'completed' : ''}`}
                      >
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <p className="timeline-title">Order Delivered</p>
                          <p className="timeline-date">Coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
