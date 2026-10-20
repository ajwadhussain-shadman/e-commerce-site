"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Bell, ExternalLink, ShieldCheck, X } from "lucide-react";
import { notificationService } from "@/services/notificationService";

export default function AdminHeader({ onOpenSidebar }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const initialFetchRef = useRef(true);

  const fetchUnreadCount = async () => {
    try {
      const result = await notificationService.getUnreadCount();
      setUnreadCount(result.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  useEffect(() => {
    if (initialFetchRef.current) {
      initialFetchRef.current = false;
      fetchUnreadCount();
    }
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications(1, 10);
      setNotifications(result.data || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
    // Navigate to the order
    if (notification.data?.orderId) {
      router.push(`/admin/orders?search=${notification.data.orderId}`);
    }
    setShowDropdown(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".notification-dropdown")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-stone-700 hover:text-stone-900 rounded-lg hover:bg-stone-100"
          aria-label="Open Admin Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-bold text-stone-900 hidden sm:inline">
            Importora Management Console
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg transition-colors"
        >
          <span>View Live Store</span>
          <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
        </Link>

        {/* Notifications Bell */}
        <div className="relative notification-dropdown">
          <button
            onClick={handleDropdownToggle}
            className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Notifications"
            aria-expanded={showDropdown}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
                <h3 className="font-semibold text-stone-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }}
                      className="text-[10px] text-amber-700 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDropdown(false); }}
                    className="p-1 text-stone-400 hover:text-stone-600"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-sm text-stone-500">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-stone-500">No notifications</div>
                ) : (
                  <ul className="divide-y divide-stone-100">
                    {notifications.map((notification) => (
                      <li
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          !notification.read ? "bg-amber-50/50" : ""
                        } hover:bg-stone-50`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm text-stone-900 ${!notification.read ? "" : "text-stone-700"}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-stone-600 mt-0.5 truncate">{notification.message}</p>
                            <p className="text-[10px] text-stone-400 mt-1">{formatTime(notification.createdAt)}</p>
                          </div>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 mt-2" />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="px-4 py-3 border-t border-stone-200">
                <Link
                  href="/admin/orders"
                  className="block text-center text-xs font-semibold text-amber-700 hover:underline"
                >
                  View all orders
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
          <div className="w-7 h-7 rounded-full bg-stone-900 text-amber-400 font-serif font-bold text-xs flex items-center justify-center">
            A
          </div>
          <span className="font-semibold text-stone-900 hidden sm:inline">Admin</span>
        </div>
      </div>
    </header>
  );
}