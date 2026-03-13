"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, Users, User, UserCheck, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface UserOption {
  id: string;
  name: string;
  email: string;
  tier: string;
}

export default function AdminMessagesPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [messageData, setMessageData] = useState({
    title: "",
    message: "",
    recipientType: "all", // "all", "tier", "single"
    selectedTier: "",
    selectedUserId: "",
  });

  useEffect(() => {
    fetchUsers();
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

  const sendMessage = async () => {
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold">Send Message</h1></div>
        <Card><CardContent className="p-12 text-center">Loading...</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Send Message
        </h1>
        <p className="text-muted-foreground">Send announcements or messages to coaches</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Message Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
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
                onClick={sendMessage} 
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
                    <MessageSquare className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        {messageData.title || "Message Title"}
                      </h4>
                      <Badge>Announcement</Badge>
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
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}