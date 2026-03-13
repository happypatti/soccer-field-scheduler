"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Inbox, Bell, Check, CheckCheck, Calendar, AlertTriangle, Trash2, 
  RefreshCw, ArrowLeft, X, Megaphone, MessageSquare, Send, Mail,
  ChevronRight, Eye
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  subject: string;
  content: string;
  senderId: string;
  receiverId: string | null;
  isFromAdmin: boolean;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Conversation {
  conversationId: string;
  subject: string;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [activeTab, setActiveTab] = useState<"notifications" | "messages">("notifications");
  
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: "", content: "" });
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchNotifications();
    fetchMessages();
  }, [session, status, router]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : 
                       Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ));
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
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
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

  const sendNewMessage = async () => {
    if (!newMessage.subject.trim() || !newMessage.content.trim()) {
      toast.error("Please enter a subject and message");
      return;
    }
    
    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newMessage.subject,
          content: newMessage.content,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to send");
      
      toast.success("Message sent to administrators");
      setNewMessage({ subject: "", content: "" });
      setShowNewMessage(false);
      fetchMessages();
    } catch (e) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const sendReply = async (conversationId: string) => {
    if (!replyContent.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent,
          conversationId,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to send");
      
      toast.success("Reply sent");
      setReplyContent("");
      fetchMessages();
      
      if (selectedConversation?.conversationId === conversationId) {
        const updatedRes = await fetch(`/api/messages?conversationId=${conversationId}`);
        const updatedMessages = await updatedRes.json();
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: Array.isArray(updatedMessages) ? updatedMessages : []
        } : null);
      }
    } catch (e) {
      toast.error("Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const openConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    if (conversation.unreadCount > 0) {
      await fetch("/api/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.conversationId }),
      });
      
      setConversations(prev => prev.map(c => 
        c.conversationId === conversation.conversationId 
          ? { ...c, unreadCount: 0 }
          : c
      ));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "approval": return <Check className="h-5 w-5 text-green-600" />;
      case "denial": return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "cancellation": return <Calendar className="h-5 w-5 text-orange-600" />;
      case "moved": return <RefreshCw className="h-5 w-5 text-blue-600" />;
      case "field_issue": return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "announcement": return <Megaphone className="h-5 w-5 text-purple-600" />;
      case "message": return <MessageSquare className="h-5 w-5 text-blue-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary"; className?: string }> = {
      approval: { label: "Approved", variant: "default" },
      denial: { label: "Denied", variant: "destructive" },
      cancellation: { label: "Cancelled", variant: "secondary" },
      moved: { label: "Moved", variant: "outline" },
      field_issue: { label: "Issue", variant: "secondary" },
      announcement: { label: "📢 Announcement", variant: "outline", className: "bg-purple-100 text-purple-800 border-purple-300" },
      message: { label: "Message", variant: "outline", className: "bg-blue-100 text-blue-800 border-blue-300" },
    };
    const badge = badges[type] || { label: "Alert", variant: "outline" as const };
    return <Badge variant={badge.variant} className={badge.className}>{badge.label}</Badge>;
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

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;
  const unreadMsgCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
              {unreadNotifCount + unreadMsgCount > 0 
                ? `${unreadNotifCount + unreadMsgCount} unread item${(unreadNotifCount + unreadMsgCount) !== 1 ? 's' : ''}` 
                : 'All caught up!'}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNewMessage(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black">
          <Mail className="h-4 w-4 mr-2" />
          Contact Admin
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "notifications" | "messages")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="relative">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadNotifCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadNotifCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="relative">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
            {unreadMsgCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadMsgCount}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""}>
                All ({notifications.length})
              </Button>
              <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}
                className={filter === "unread" ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""}>
                Unread ({unreadNotifCount})
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchNotifications}>
                <RefreshCw className="h-4 w-4 mr-2" />Refresh
              </Button>
              {unreadNotifCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={deleteAllNotifications} 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                  <Trash2 className="h-4 w-4 mr-2" />Delete all
                </Button>
              )}
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Inbox className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </h2>
              <p className="text-muted-foreground">
                {filter === "unread" ? "You're all caught up!" : "Updates about your reservations will appear here."}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <Card key={notification.id} 
                  className={`transition-all cursor-pointer hover:shadow-md ${!notification.isRead ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2 rounded-full ${!notification.isRead ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${!notification.isRead ? 'text-black' : 'text-gray-700'}`}>{notification.title}</h3>
                            {getTypeBadge(notification.type)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(notification.createdAt)}</span>
                            <button onClick={(e) => deleteNotification(notification.id, e)}
                              className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className={`text-sm ${!notification.isRead ? 'text-gray-800' : 'text-muted-foreground'}`}>{notification.message}</p>
                        {notification.isRead && notification.readAt && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />Read {formatDate(notification.readAt)}
                          </div>
                        )}
                        {!notification.isRead && (
                          <div className="flex items-center justify-end mt-2">
                            <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>Click to mark as read
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
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {selectedConversation ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />Back
                </Button>
                <h3 className="font-semibold">{selectedConversation.subject}</h3>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
                {selectedConversation.messages
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-lg ${msg.senderId === session?.user?.id ? 'bg-yellow-500 text-black' : 'bg-white border'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs opacity-70">{formatDate(msg.createdAt)}</span>
                          {msg.senderId === session?.user?.id && msg.isRead && (
                            <CheckCheck className="h-3 w-3 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Type your reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply(selectedConversation.conversationId)} />
                <Button onClick={() => sendReply(selectedConversation.conversationId)} disabled={isSending || !replyContent.trim()}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
                <Button variant="outline" size="sm" onClick={fetchMessages}>
                  <RefreshCw className="h-4 w-4 mr-2" />Refresh
                </Button>
              </div>
              {conversations.length === 0 ? (
                <Card className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
                  <p className="text-muted-foreground mb-4">Have a question? Send a message to the administrators.</p>
                  <Button onClick={() => setShowNewMessage(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    <Mail className="h-4 w-4 mr-2" />Contact Admin
                  </Button>
                </Card>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <Card key={conv.conversationId}
                      className={`transition-all cursor-pointer hover:shadow-md ${conv.unreadCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}
                      onClick={() => openConversation(conv)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${conv.unreadCount > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                              <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{conv.subject}</h3>
                                {conv.unreadCount > 0 && <Badge className="bg-yellow-500 text-black">{conv.unreadCount} new</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">{conv.lastMessage.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {conv.lastMessage.isFromAdmin ? "From Admin" : "You"} • {formatDate(conv.lastMessage.createdAt)}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />Contact Administrators
            </DialogTitle>
            <DialogDescription>
              Send a message to the field administrators. They will respond as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="e.g., Question about reservation" value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea id="message" className="w-full border rounded-md p-3 min-h-[120px]" placeholder="Write your message here..."
                value={newMessage.content} onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewMessage(false)}>Cancel</Button>
              <Button onClick={sendNewMessage} disabled={isSending || !newMessage.subject.trim() || !newMessage.content.trim()}
                className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Send className="h-4 w-4 mr-2" />{isSending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}