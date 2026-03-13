"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Inbox, Bell, Check, CheckCheck, Calendar, AlertTriangle, Trash2, RefreshCw, ArrowLeft, X, Megaphone, MessageSquare, Send, Mail, ChevronRight, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Notification { id: string; type: string; title: string; message: string; isRead: boolean; readAt?: string; createdAt: string; }
interface User { id: string; name: string; email: string; role: string; tier?: string; }
interface Message { id: string; conversationId: string; subject: string; content: string; senderId: string; receiverId: string | null; isFromAdmin: boolean; isRead: boolean; readAt?: string; createdAt: string; sender?: User; receiver?: User; }
interface Conversation { conversationId: string; subject: string; lastMessage: Message; unreadCount: number; messages: Message[]; otherPerson?: User; }

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [activeTab, setActiveTab] = useState<"notifications" | "messages">("notifications");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessage, setNewMessage] = useState({ userId: "", subject: "", content: "" });
  const [userSearch, setUserSearch] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.push("/login"); return; }
    fetchNotifications(); fetchMessages(); fetchUsers();
  }, [session, status, router]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications"); const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); toast.error("Failed to load notifications"); } finally { setIsLoading(false); }
  };

  const fetchMessages = async () => {
    try { const res = await fetch("/api/messages"); const data = await res.json(); setConversations(data.conversations || []); } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try { const res = await fetch("/api/users"); const data = await res.json(); setAllUsers(Array.isArray(data) ? data.filter((u: User) => u.id !== session?.user?.id) : []); } catch (e) { console.error(e); }
  };

  const markAsRead = async (id: string) => {
    try { await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationIds: [id] }) });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)); } catch (e) { toast.error("Failed to mark as read"); }
  };

  const markAllAsRead = async () => {
    if (notifications.filter(n => !n.isRead).length === 0) return;
    try { await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))); toast.success("All notifications marked as read"); } catch (e) { toast.error("Failed"); }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationIds: [id] }) });
      setNotifications(prev => prev.filter(n => n.id !== id)); toast.success("Deleted"); } catch (e) { toast.error("Failed"); }
  };

  const deleteAllNotifications = async () => {
    if (notifications.length === 0 || !confirm("Delete all notifications?")) return;
    try { await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deleteAll: true }) }); setNotifications([]); toast.success("All deleted"); } catch (e) { toast.error("Failed"); }
  };

  const sendNewMessage = async () => {
    if (!newMessage.userId || !newMessage.subject.trim() || !newMessage.content.trim()) { toast.error("Please fill all fields"); return; }
    setIsSending(true);
    try {
      const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: newMessage.userId, subject: newMessage.subject, content: newMessage.content }) });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Message sent!`); setNewMessage({ userId: "", subject: "", content: "" }); setUserSearch(""); setShowNewMessage(false); fetchMessages();
    } catch (e) { toast.error("Failed to send"); } finally { setIsSending(false); }
  };

  const sendReply = async (conversationId: string) => {
    if (!replyContent.trim()) { toast.error("Enter a message"); return; }
    setIsSending(true);
    try {
      const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: replyContent, conversationId }) });
      if (!res.ok) throw new Error("Failed");
      toast.success("Reply sent"); setReplyContent(""); fetchMessages();
      if (selectedConversation?.conversationId === conversationId) {
        const updatedRes = await fetch(`/api/messages?conversationId=${conversationId}`);
        const updatedMessages = await updatedRes.json();
        setSelectedConversation(prev => prev ? { ...prev, messages: Array.isArray(updatedMessages) ? updatedMessages : [] } : null);
      }
    } catch (e) { toast.error("Failed"); } finally { setIsSending(false); }
  };

  const openConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (conversation.unreadCount > 0) {
      await fetch("/api/messages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: conversation.conversationId }) });
      setConversations(prev => prev.map(c => c.conversationId === conversation.conversationId ? { ...c, unreadCount: 0 } : c));
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
      approval: { label: "Approved", variant: "default" }, denial: { label: "Denied", variant: "destructive" },
      cancellation: { label: "Cancelled", variant: "secondary" }, moved: { label: "Moved", variant: "outline" },
      field_issue: { label: "Issue", variant: "secondary" }, announcement: { label: "📢 Announcement", variant: "outline", className: "bg-purple-100 text-purple-800" },
      message: { label: "Message", variant: "outline", className: "bg-blue-100 text-blue-800" },
    };
    const badge = badges[type] || { label: "Alert", variant: "outline" as const };
    return <Badge variant={badge.variant} className={badge.className}>{badge.label}</Badge>;
  };

  const getUserBadge = (user: User) => {
    if (user.role === "admin" || user.role === "gold_admin" || user.role === "silver_admin") return <Badge className="bg-red-500 text-white text-[10px]">Admin</Badge>;
    if (user.tier) { const c: Record<string, string> = { gold: "bg-yellow-500", silver: "bg-gray-400", bronze: "bg-amber-700" }; return <Badge className={`${c[user.tier] || 'bg-gray-500'} text-white text-[10px]`}>{user.tier}</Badge>; }
    return null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr); const now = new Date(); const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000); const diffHours = Math.floor(diffMs / 3600000); const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now"; if (diffMins < 60) return `${diffMins}m ago`; if (diffHours < 24) return `${diffHours}h ago`; if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filter === "unread" ? notifications.filter(n => !n.isRead) : notifications;
  const unreadNotifCount = notifications.filter(n => !n.isRead).length;
  const unreadMsgCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const filteredUsers = allUsers.filter(u => userSearch === "" || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));

  if (status === "loading" || isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Inbox className="h-8 w-8 text-yellow-500" />Inbox</h1>
            <p className="text-muted-foreground">{unreadNotifCount + unreadMsgCount > 0 ? `${unreadNotifCount + unreadMsgCount} unread` : 'All caught up!'}</p>
          </div>
        </div>
        <Button onClick={() => setShowNewMessage(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black"><Mail className="h-4 w-4 mr-2" />New Message</Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "notifications" | "messages")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notifications{unreadNotifCount > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadNotifCount}</span>}</TabsTrigger>
          <TabsTrigger value="messages"><MessageSquare className="h-4 w-4 mr-2" />Messages{unreadMsgCount > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadMsgCount}</span>}</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")} className={filter === "all" ? "bg-yellow-500 text-black" : ""}>All ({notifications.length})</Button>
              <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")} className={filter === "unread" ? "bg-yellow-500 text-black" : ""}>Unread ({unreadNotifCount})</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchNotifications}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
              {unreadNotifCount > 0 && <Button variant="outline" size="sm" onClick={markAllAsRead}><CheckCheck className="h-4 w-4 mr-2" />Mark all read</Button>}
              {notifications.length > 0 && <Button variant="outline" size="sm" onClick={deleteAllNotifications} className="text-red-600 border-red-200"><Trash2 className="h-4 w-4 mr-2" />Delete all</Button>}
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center"><Inbox className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" /><h2 className="text-xl font-semibold mb-2">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</h2></Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((n) => (
                <Card key={n.id} className={`cursor-pointer hover:shadow-md ${!n.isRead ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`} onClick={() => !n.isRead && markAsRead(n.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${!n.isRead ? 'bg-yellow-100' : 'bg-gray-100'}`}>{getTypeIcon(n.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2"><h3 className="font-semibold">{n.title}</h3>{getTypeBadge(n.type)}</div>
                          <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span><button onClick={(e) => deleteNotification(n.id, e)} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></button></div>
                        </div>
                        <p className="text-sm text-muted-foreground">{n.message}</p>
                        {n.isRead && n.readAt && <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground"><Eye className="h-3 w-3" />Read {formatDate(n.readAt)}</div>}
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                <div><h3 className="font-semibold">{selectedConversation.subject}</h3>{selectedConversation.otherPerson && <p className="text-sm text-muted-foreground flex items-center gap-2">with {selectedConversation.otherPerson.name}{getUserBadge(selectedConversation.otherPerson)}</p>}</div>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
                {selectedConversation.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg ${msg.senderId === session?.user?.id ? 'bg-yellow-500 text-black' : 'bg-white border'}`}>
                      {msg.senderId !== session?.user?.id && msg.sender && <p className="text-xs font-medium mb-1 flex items-center gap-1">{msg.sender.name}{getUserBadge(msg.sender)}</p>}
                      <p className="text-sm">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-2"><span className="text-xs opacity-70">{formatDate(msg.createdAt)}</span>{msg.senderId === session?.user?.id && msg.isRead && <CheckCheck className="h-3 w-3 text-blue-600" />}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Type your reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply(selectedConversation.conversationId)} />
                <Button onClick={() => sendReply(selectedConversation.conversationId)} disabled={isSending || !replyContent.trim()} className="bg-yellow-500 hover:bg-yellow-600 text-black"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{conversations.length} conversations</p><Button variant="outline" size="sm" onClick={fetchMessages}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button></div>
              {conversations.length === 0 ? (
                <Card className="p-12 text-center"><MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" /><h2 className="text-xl font-semibold mb-2">No messages yet</h2><p className="text-muted-foreground mb-4">Start a conversation!</p><Button onClick={() => setShowNewMessage(true)} className="bg-yellow-500 text-black"><Mail className="h-4 w-4 mr-2" />New Message</Button></Card>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <Card key={conv.conversationId} className={`cursor-pointer hover:shadow-md ${conv.unreadCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`} onClick={() => openConversation(conv)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${conv.unreadCount > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}><MessageSquare className="h-5 w-5" /></div>
                            <div>
                              <div className="flex items-center gap-2"><h3 className="font-semibold">{conv.subject}</h3>{conv.unreadCount > 0 && <Badge className="bg-yellow-500 text-black">{conv.unreadCount} new</Badge>}</div>
                              {conv.otherPerson && <p className="text-xs text-muted-foreground flex items-center gap-1">with {conv.otherPerson.name}{getUserBadge(conv.otherPerson)}</p>}
                              <p className="text-sm text-muted-foreground line-clamp-1">{conv.lastMessage.content}</p>
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
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />New Message</DialogTitle><DialogDescription>Send a message to any user.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>To</Label>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-10" /></div>
              {newMessage.userId && <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200"><span className="text-sm">To: <strong>{allUsers.find(u => u.id === newMessage.userId)?.name}</strong></span><button onClick={() => setNewMessage({ ...newMessage, userId: "" })} className="ml-auto"><X className="h-4 w-4" /></button></div>}
              {!newMessage.userId && userSearch && (
                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  {filteredUsers.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No users found</p> : filteredUsers.slice(0, 10).map((u) => (
                    <div key={u.id} className="p-2 hover:bg-muted cursor-pointer flex items-center justify-between" onClick={() => { setNewMessage({ ...newMessage, userId: u.id }); setUserSearch(""); }}>
                      <div><p className="font-medium text-sm">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>{getUserBadge(u)}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2"><Label>Subject</Label><Input placeholder="Subject..." value={newMessage.subject} onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })} /></div>
            <div className="space-y-2"><Label>Message</Label><textarea className="w-full border rounded-md p-3 min-h-[120px]" placeholder="Write your message..." value={newMessage.content} onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowNewMessage(false)}>Cancel</Button><Button onClick={sendNewMessage} disabled={isSending || !newMessage.userId || !newMessage.subject.trim() || !newMessage.content.trim()} className="bg-yellow-500 text-black"><Send className="h-4 w-4 mr-2" />{isSending ? "Sending..." : "Send"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}