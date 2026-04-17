/**
 * NotificationPanel Component
 * Displays notification dropdown with unread notifications
 * Shows notification details and handles marking as read
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle2, Trophy, BookOpen, TrendingUp, MessageCircle, Heart } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';
import { cn } from '../lib/utils';

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review_due':
        return <Heart className="w-4 h-4 text-orange-500" />;
      case 'achievement':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'new_content':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'weekly_summary':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'conversation_ready':
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'review_due':
        return 'bg-orange-50 border-orange-200';
      case 'achievement':
        return 'bg-yellow-50 border-yellow-200';
      case 'new_content':
        return 'bg-blue-50 border-blue-200';
      case 'weekly_summary':
        return 'bg-green-50 border-green-200';
      case 'conversation_ready':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return notifTime.toLocaleDateString();
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      window.location.href = notification.action_url;
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-50 border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">{unreadCount} unread</p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Stay tuned for updates!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150',
                      notification.is_read ? 'border-gray-300 opacity-70' : 'border-blue-500 bg-blue-50',
                      getNotificationColor(notification.type)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-semibold',
                          notification.is_read ? 'text-gray-700' : 'text-gray-900'
                        )}>
                          {notification.title}
                        </p>
                        <p className={cn(
                          'text-sm mt-1 line-clamp-2',
                          notification.is_read ? 'text-gray-600' : 'text-gray-700'
                        )}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>

                      {/* Read Indicator */}
                      {!notification.is_read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && unreadCount > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={markAllAsRead}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-3 rounded hover:bg-blue-50 transition-colors duration-150"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
