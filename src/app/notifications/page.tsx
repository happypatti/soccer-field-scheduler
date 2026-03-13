"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, Bell, Check, CheckCheck, Calendar, AlertTriangle, Trash2, RefreshCw, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedReservationId?: string;
  relatedFieldId?: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchNotifications();
  }, [session, status]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const deleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    if (!confirm("Delete all notifications? This cannot be undone.")) return;
    
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      });
      setNotifications([]);
      toast.success("All notifications deleted");
    } catch (e) {
      toast.error("Failed to delete all");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <Check className="h-5 w-5 text-green-600" />;
      case "denial":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "cancellation":
        return <Calendar className="h-5 w-5 text-orange-600" />;
      case "moved":
        return <RefreshCw className="h-5 w-5 text-blue-600" />;
      case "field_issue":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
      approval: { label: "Approved", variant: "default" },
      denial: { label: "Denied", variant: "destructive" },
      cancellation: { label: "Cancelled", variant: "secondary" },
      moved: { label: "Moved", variant: "outline" },
      field_issue: { label: "Issue", variant: "secondary" },
    };
    const badge = badges[type] || { label: "Alert", variant: "outline" as const };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Inbox className="h-8 w-8 text-yellow-500" />
              Inbox
            </h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={deleteAllNotifications} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete all
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button 
          variant={filter === "all" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""}
        >
          All ({notifications.length})
        </Button>
        <Button 
          variant={filter === "unread" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilter("unread")}
          className={filter === "unread" ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Inbox className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </h2>
          <p className="text-muted-foreground">
            {filter === "unread" 
              ? "You're all caught up! Check back later for new updates."
              : "When you receive updates about your reservations, they'll appear here."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all cursor-pointer hover:shadow-md ${
                !notification.isRead ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
              }`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`mt-1 p-2 rounded-full ${!notification.isRead ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${!notification.isRead ? 'text-black' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        {getTypeBadge(notification.type)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                        <button 
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete notification"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-sm ${!notification.isRead ? 'text-gray-800' : 'text-muted-foreground'}`}>
                      {notification.message}
                    </p>
                    
                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="flex items-center justify-end mt-2">
                        <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Unread - Click to mark as read
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load more hint */}
      {notifications.length >= 50 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing last 50 notifications
        </p>
      )}
    </div>
  );
}