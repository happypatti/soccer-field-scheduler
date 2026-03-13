"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send, Users, User, UserCheck, MessageSquare, Inbox, ArrowLeft, 
  RefreshCw, CheckCheck, Eye, ChevronRight, Megaphone 
} from "lucide-react";
import { toast } from "sonner";

interface UserOption {
  id: string;
  name: string;
  email: string;
  tier: string;
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
    tier?: string;
  };
  receiver?: {
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

export default function AdminMessagesPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"inbox" | "broadcast">("inbox");
  
  // Broadcast message form
  const [messageData, setMessageData] = useState({
    title: "",
    message: "",
    recipientType: "all", // "all", "tier", "single"
    selectedTier: "",
    selectedUserId: "",
  });

  // Reply form
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchMessages();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data.filter((u: any) => u.role === "user") : []);
    } catch (e) {
      console.error(e);
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

  const sendBroadcast = async () => {
    if (!messageData.title.trim() || !messageData.message.trim()) {
      toast.error("Please enter a title and message");
      return;
    }

    if (messageData.recipientType === "tier" && !messageData.selectedTier) {
      toast.error("Please select a tier");
      return;
    }

    if (messageData.recipientType === "single" && !messageData.selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      toast.success(`Message sent to ${data.recipientCount} user(s)!`);
      setMessageData({
        title: "",
        message: "",
        recipientType: "all",
        selectedTier: "",
        selectedUserId: "",
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const openConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Mark messages as read
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

  const sendReply = async (conversationId: string, receiverId: string) => {
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
          receiverId,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to send");
      
      toast.success("Reply sent");
      setReplyContent("");
      fetchMessages();
      
      // Update selected conversation
      const updatedRes = await fetch(`/api/messages?conversationId=${conversationId}`);
      const updatedMessages = await updatedRes.json();
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: Array.isArray(updatedMessages) ? updatedMessages : []
      } : null);
    } catch (e) {
      toast.error("Failed to send reply");
    } finally {
      setIsSending(false);
    }
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

  const getRecipientCount = () => {
    if (messageData.recipientType === "all") {
      return users.length;
    }
    if (messageData.recipientType === "tier") {
      return users.filter(u => u.tier === messageData.selectedTier).length;
    }
    if (messageData.recipientType === "single") {
      return messageData.selectedUserId ? 1 : 0;
    }
    return 0;
  };

  const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Find the user who started the conversation
  const getConversationUser = (conv: Conversation) => {
    const firstUserMessage = conv.messages.find(m => !m.isFromAdmin);
    return firstUserMessage?.sender || null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold">Messages</h1></div>
        <Card><CardContent className="p-12 text-center">Loading...</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Messages
        </h1>
        <p className="text-muted-foreground">
          View user messages and send announcements
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-red-500">{unreadCount} unread</Badge>
          )}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="inbox" className="relative">
            <Inbox className="h-4 w-4 mr-2" />
            Inbox
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="broadcast">
            <Megaphone className="h-4 w-4 mr-2" />
            Broadcast
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          {selectedConversation ? (
            // Conversation View
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div>
                    <CardTitle>{selectedConversation.subject}</CardTitle>
                    <CardDescription>
                      {(() => {
                        const user = getConversationUser(selectedConversation);
                        return user ? `Conversation with ${user.name} (${user.email})` : 'Conversation';
                      })()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Messages */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
                  {selectedConversation.messages
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex ${msg.isFromAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.isFromAdmin 
                              ? 'bg-yellow-500 text-black' 
                              : 'bg-white border'
                          }`}
                        >
                          {!msg.isFromAdmin && msg.sender && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{msg.sender.name}</span>
                              {msg.sender.tier && (
                                <Badge variant="outline" className="text-[10px] py-0">
                                  {msg.sender.tier}
                                </Badge>
                              )}
                            </div>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs opacity-70">
                              {formatDate(msg.createdAt)}
                            </span>
                            {msg.isFromAdmin && msg.isRead && msg.readAt && (
                              <span className="flex items-center gap-1 text-xs text-blue-600">
                                <CheckCheck className="h-3 w-3" />
                                Read {formatDate(msg.readAt)}
                              </span>
                            )}
                            {msg.isFromAdmin && !msg.isRead && (
                              <span className="text-xs text-muted-foreground">Sent</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Reply */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        const user = getConversationUser(selectedConversation);
                        if (user) {
                          sendReply(selectedConversation.conversationId, user.id);
                        }
                      }
                    }}
                  />
                  <Button 
                    onClick={() => {
                      const user = getConversationUser(selectedConversation);
                      if (user) {
                        sendReply(selectedConversation.conversationId, user.id);
                      }
                    }}
                    disabled={isSending || !replyContent.trim()}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Conversations List
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
                <Button variant="outline" size="sm" onClick={fetchMessages}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {conversations.length === 0 ? (
                <Card className="p-12 text-center">
                  <Inbox className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
                  <p className="text-muted-foreground">
                    When users send you messages, they'll appear here.
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => {
                    const user = getConversationUser(conv);
                    return (
                      <Card 
                        key={conv.conversationId}
                        className={`transition-all cursor-pointer hover:shadow-md ${
                          conv.unreadCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
                        }`}
                        onClick={() => openConversation(conv)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${conv.unreadCount > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                                <MessageSquare className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{conv.subject}</h3>
                                  {conv.unreadCount > 0 && (
                                    <Badge className="bg-red-500">{conv.unreadCount} new</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {conv.lastMessage.content}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {user && (
                                    <>
                                      <span className="text-xs font-medium">{user.name}</span>
                                      {user.tier && (
                                        <Badge variant="outline" className="text-[10px] py-0">
                                          {user.tier}
                                        </Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground">•</span>
                                    </>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(conv.lastMessage.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Broadcast Tab */}
        <TabsContent value="broadcast">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Message Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Send Announcement</CardTitle>
                  <CardDescription>This will appear in users' notification inbox</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Subject/Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Important: Field Maintenance Notice"
                      value={messageData.title}
                      onChange={(e) => setMessageData({ ...messageData, title: e.target.value })}
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <textarea
                      id="message"
                      className="w-full border rounded-md p-3 min-h-[150px]"
                      placeholder="Write your message here..."
                      value={messageData.message}
                      onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                    />
                  </div>

                  {/* Recipient Type */}
                  <div className="space-y-3">
                    <Label>Send To</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setMessageData({ ...messageData, recipientType: "all" })}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          messageData.recipientType === "all" 
                            ? "border-yellow-500 bg-yellow-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Users className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">All Coaches</p>
                        <p className="text-xs text-muted-foreground">{users.length} users</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMessageData({ ...messageData, recipientType: "tier" })}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          messageData.recipientType === "tier" 
                            ? "border-yellow-500 bg-yellow-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <UserCheck className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">By Tier</p>
                        <p className="text-xs text-muted-foreground">Gold/Silver/Bronze</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMessageData({ ...messageData, recipientType: "single" })}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          messageData.recipientType === "single" 
                            ? "border-yellow-500 bg-yellow-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <User className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-medium">Single User</p>
                        <p className="text-xs text-muted-foreground">Select one</p>
                      </button>
                    </div>
                  </div>

                  {/* Tier Selection */}
                  {messageData.recipientType === "tier" && (
                    <div className="space-y-2">
                      <Label>Select Tier</Label>
                      <div className="flex gap-3">
                        {["gold", "silver", "bronze"].map((tier) => {
                          const count = users.filter(u => u.tier === tier).length;
                          return (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => setMessageData({ ...messageData, selectedTier: tier })}
                              className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                                messageData.selectedTier === tier 
                                  ? "border-yellow-500 bg-yellow-50" 
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <Badge 
                                className={
                                  tier === "gold" ? "bg-yellow-500" : 
                                  tier === "silver" ? "bg-gray-400" : "bg-amber-700"
                                }
                              >
                                {tier.charAt(0).toUpperCase() + tier.slice(1)}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{count} coaches</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Single User Selection */}
                  {messageData.recipientType === "single" && (
                    <div className="space-y-2">
                      <Label>Select User</Label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={messageData.selectedUserId}
                        onChange={(e) => setMessageData({ ...messageData, selectedUserId: e.target.value })}
                      >
                        <option value="">Choose a user...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email}) - {user.tier}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Send Button */}
                  <Button 
                    onClick={sendBroadcast} 
                    disabled={isSending || !messageData.title.trim() || !messageData.message.trim()}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? "Sending..." : `Send to ${getRecipientCount()} user(s)`}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>How it will appear in inbox</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-yellow-100">
                        <Megaphone className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">
                            {messageData.title || "Message Title"}
                          </h4>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                            📢 Announcement
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {messageData.message || "Your message will appear here..."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">Just now</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4 bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Tips</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Keep messages clear and concise</li>
                    <li>• Use for announcements, updates, reminders</li>
                    <li>• Messages appear instantly in user inbox</li>
                    <li>• Users can delete messages after reading</li>
                    <li>• Read receipts show when messages are read</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}