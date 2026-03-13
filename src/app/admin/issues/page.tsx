"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Clock, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface FieldIssue {
  id: string;
  issueType: string;
  description: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  field: { id: string; name: string };
  reporter: { id: string; name: string; email: string };
}

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean; issue: FieldIssue | null; notes: string }>({
    open: false, issue: null, notes: ""
  });

  useEffect(() => { fetchIssues(); }, []);

  const fetchIssues = async () => {
    try {
      const res = await fetch("/api/field-issues");
      const data = await res.json();
      setIssues(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const updateIssueStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      const res = await fetch(`/api/field-issues/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Issue marked as ${status}`);
      fetchIssues();
      setResolveDialog({ open: false, issue: null, notes: "" });
    } catch { toast.error("Failed to update issue"); }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: any }> = {
      open: { bg: "bg-red-100 text-red-800", icon: AlertTriangle },
      in_progress: { bg: "bg-yellow-100 text-yellow-800", icon: Clock },
      resolved: { bg: "bg-green-100 text-green-800", icon: CheckCircle },
    };
    const { bg, icon: Icon } = styles[status] || styles.open;
    return (
      <Badge className={bg}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getIssueTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      lights: "bg-yellow-100 text-yellow-800",
      safety: "bg-red-100 text-red-800",
      equipment: "bg-blue-100 text-blue-800",
      weather: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[type] || colors.other}>{type}</Badge>;
  };

  const filtered = issues.filter(i => {
    const matchesSearch = i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         i.field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         i.reporter.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <div className="animate-pulse h-96 bg-white rounded-lg"></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Field Issues</h1>
        <p className="text-muted-foreground">Manage reported problems with fields</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{issues.filter(i => i.status === "open").length}</p>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{issues.filter(i => i.status === "in_progress").length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{issues.filter(i => i.status === "resolved").length}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search issues..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select className="border rounded-md px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No issues found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.field.name}</TableCell>
                    <TableCell>{getIssueTypeBadge(issue.issueType)}</TableCell>
                    <TableCell className="max-w-xs truncate">{issue.description}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{issue.reporter.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(issue.createdAt).toLocaleDateString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(issue.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {issue.status === "open" && (
                          <Button size="sm" variant="outline" onClick={() => updateIssueStatus(issue.id, "in_progress")}>
                            Start
                          </Button>
                        )}
                        {issue.status !== "resolved" && (
                          <Button size="sm" onClick={() => setResolveDialog({ open: true, issue, notes: "" })}>
                            Resolve
                          </Button>
                        )}
                        {issue.status === "resolved" && (
                          <Button size="sm" variant="outline" onClick={() => updateIssueStatus(issue.id, "open")}>
                            Reopen
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog.open} onOpenChange={(o) => setResolveDialog({ ...resolveDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve Issue</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{resolveDialog.issue?.field.name}</p>
              <p className="text-sm text-muted-foreground">{resolveDialog.issue?.description}</p>
            </div>
            <div className="space-y-2">
              <Label>Resolution Notes (optional)</Label>
              <textarea 
                className="w-full border rounded-md p-2 min-h-[80px]" 
                value={resolveDialog.notes} 
                onChange={(e) => setResolveDialog({ ...resolveDialog, notes: e.target.value })}
                placeholder="What was done to resolve this issue?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog({ open: false, issue: null, notes: "" })}>Cancel</Button>
            <Button onClick={() => resolveDialog.issue && updateIssueStatus(resolveDialog.issue.id, "resolved", resolveDialog.notes)}>
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}