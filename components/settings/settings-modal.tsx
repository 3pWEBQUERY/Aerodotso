"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Bell,
  Download,
  Building2,
  CreditCard,
  HardDrive,
  Sparkles,
  Plus,
  Trash2,
  Camera,
  Pencil,
  Info,
  Upload,
  FolderPlus,
  FolderMinus,
  FileX,
  Check,
  CheckCheck,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
}

type SettingsTab = "account" | "notifications" | "import" | "workspace" | "billing";

interface WorkspaceData {
  id: string;
  name: string;
  avatar_url?: string;
  storageUsed?: number;
  storageLimit?: number;
  aiRequestsUsed?: number;
  aiRequestsLimit?: number;
}

interface Member {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  joined_at: string | null;
  isYou: boolean;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  action_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function SettingsModal({ open, onOpenChange, workspaceId }: SettingsModalProps) {
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>("workspace");
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  
  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin" | "viewer">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  
  // Delete workspace state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Support access state
  const [supportAccess, setSupportAccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  
  // User profile states
  const [userName, setUserName] = useState(session?.user?.name || "");
  const [userAvatar, setUserAvatar] = useState(session?.user?.image || "");
  const [isEditingUserName, setIsEditingUserName] = useState(false);
  const [editUserName, setEditUserName] = useState("");
  const [isUploadingUserAvatar, setIsUploadingUserAvatar] = useState(false);
  
  // Workspace states
  const [isUploadingWorkspaceAvatar, setIsUploadingWorkspaceAvatar] = useState(false);
  
  // File input refs
  const userAvatarInputRef = useRef<HTMLInputElement>(null);
  const workspaceAvatarInputRef = useRef<HTMLInputElement>(null);
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.user) {
        setUserName(data.user.name || "");
        setUserAvatar(data.user.avatar_url || "");
        setUserEmail(data.user.email || "");
        setSupportAccess(data.user.support_access || false);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }, []);

  const fetchWorkspaceData = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const data = await res.json();
      if (data.workspace) {
        setWorkspace({
          id: data.workspace.id,
          name: data.workspace.name || "Workspace",
          avatar_url: data.workspace.avatar_url,
          storageUsed: 0,
          storageLimit: 15 * 1024 * 1024 * 1024, // 15GB
          aiRequestsUsed: 0,
          aiRequestsLimit: 15,
        });
      }
    } catch (error) {
      console.error("Failed to fetch workspace:", error);
    }
  }, [workspaceId]);

  // Fetch workspace members
  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      const data = await res.json();
      if (data.members) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  }, [workspaceId]);

  // Fetch invitations
  const fetchInvitations = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`);
      const data = await res.json();
      if (data.invitations) {
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
    }
  }, [workspaceId]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!workspaceId) return;
    
    setIsLoadingNotifications(true);
    try {
      const res = await fetch(`/api/notifications?workspaceId=${workspaceId}&showAll=true&limit=50`);
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [workspaceId]);

  // Mark notification as read
  const markNotificationRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchWorkspaceData();
      fetchUserProfile();
      fetchMembers();
      fetchInvitations();
      fetchNotifications();
    }
  }, [open, fetchWorkspaceData, fetchUserProfile, fetchMembers, fetchInvitations, fetchNotifications]);

  // Invite member
  const handleInvite = async () => {
    if (!inviteEmail || !workspaceId) return;
    
    setIsInviting(true);
    setInviteError("");
    
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setInviteError(data.error || "Failed to send invitation");
        return;
      }
      
      setInviteEmail("");
      setShowInviteModal(false);
      fetchInvitations();
    } catch (error) {
      setInviteError("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    if (!workspaceId) return;
    
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      
      if (res.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invitationId: string) => {
    if (!workspaceId) return;
    
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      
      if (res.ok) {
        fetchInvitations();
      }
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
    }
  };

  // Delete workspace
  const handleDeleteWorkspace = async () => {
    if (!workspaceId || deleteConfirmText !== workspace?.name) return;
    
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setShowDeleteModal(false);
        onOpenChange(false);
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Failed to delete workspace:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Upload user avatar
  const handleUserAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingUserAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.avatarUrl) {
        setUserAvatar(data.avatarUrl);
        await updateSession();
        window.dispatchEvent(new Event("profile-updated"));
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    } finally {
      setIsUploadingUserAvatar(false);
    }
  };

  // Upload workspace avatar
  const handleWorkspaceAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceId) return;

    setIsUploadingWorkspaceAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", workspaceId);

    try {
      const res = await fetch("/api/workspaces/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.avatarUrl && workspace) {
        setWorkspace({ ...workspace, avatar_url: data.avatarUrl });
      }
    } catch (error) {
      console.error("Failed to upload workspace avatar:", error);
    } finally {
      setIsUploadingWorkspaceAvatar(false);
    }
  };

  // Save user name
  const saveUserName = async () => {
    if (!editUserName.trim() || editUserName === userName) {
      setIsEditingUserName(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editUserName.trim() }),
      });

      if (res.ok) {
        setUserName(editUserName.trim());
        await updateSession();
        window.dispatchEvent(new Event("profile-updated"));
      }
    } catch (error) {
      console.error("Failed to update name:", error);
    } finally {
      setIsEditingUserName(false);
    }
  };

  const startEditingUserName = () => {
    setEditUserName(userName);
    setIsEditingUserName(true);
  };

  const menuItems = [
    {
      section: "Account",
      items: [
        { id: "account" as const, label: "Account", icon: User },
        { id: "notifications" as const, label: "Notifications", icon: Bell },
        { id: "import" as const, label: "Import", icon: Download },
      ],
    },
    {
      section: "Workspace",
      items: [
        { id: "workspace" as const, label: "Workspace", icon: Building2 },
        { id: "billing" as const, label: "Billing", icon: CreditCard },
      ],
    },
  ];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[850px] w-[90vw] h-[85vh] max-h-[700px] p-0 gap-0 overflow-hidden sm:!max-w-[850px] bg-[#f5f5f4]">
        <div className="flex h-full min-h-0">
          {/* Sidebar */}
          <div className="w-[180px] min-w-[180px] p-4 flex flex-col">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-base font-semibold">Settings</DialogTitle>
            </DialogHeader>

            <nav className="space-y-6 flex-1">
              {menuItems.map((section) => (
                <div key={section.section}>
                  <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {section.section}
                  </h3>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          className={cn(
                            "flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors",
                            activeTab === item.id
                              ? "bg-emerald-100 text-emerald-900 font-medium"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 m-2 ml-0 bg-white rounded-xl overflow-y-auto min-h-0 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="p-8 min-h-full">
            {activeTab === "workspace" && workspace && (
              <div className="space-y-8 max-w-[520px] pb-8">
                <h2 className="text-xl font-semibold">Current workspace</h2>

                {/* Name & Icon */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <h3 className="text-xs text-muted-foreground">Name & Icon</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground hover:text-foreground">
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs">Klicke auf das Icon, um ein Workspace-Bild hochzuladen</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Workspace Avatar - clickable */}
                      <button
                        type="button"
                        onClick={() => workspaceAvatarInputRef.current?.click()}
                        className="relative h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-medium text-sm overflow-hidden group cursor-pointer"
                        disabled={isUploadingWorkspaceAvatar}
                      >
                        {workspace.avatar_url ? (
                          <img
                            src={workspace.avatar_url}
                            alt="Workspace"
                            className="absolute inset-0 w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          workspace.name.charAt(0).toUpperCase()
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="h-4 w-4 text-white" />
                        </div>
                        {isUploadingWorkspaceAvatar && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </button>
                      <input
                        ref={workspaceAvatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleWorkspaceAvatarUpload}
                      />
                      <span className="font-medium text-sm">{workspace.name}</span>
                    </div>
                    <span className="px-3 py-1 text-xs border border-emerald-300 text-emerald-700 rounded-full bg-emerald-50">
                      Free plan
                    </span>
                  </div>
                </div>

                {/* Usage */}
                <div>
                  <h3 className="text-xs text-muted-foreground mb-3">Usage</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">Storage Used</span>
                      </div>
                      <div className="text-base font-semibold mt-2">
                        0 KB / 15GB
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        Total size of all files and data in this workspace
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-3">
                        Usage unavailable
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">AI Requests</span>
                      </div>
                      <div className="text-base font-semibold mt-2">
                        15 <span className="text-sm font-normal text-muted-foreground">available</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        Requests remaining for AI chat messages
                      </p>
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div>
                  <h3 className="text-xs text-muted-foreground mb-3">Members ({members.length})</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">User</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Role</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Email</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Joined</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr key={member.id} className="border-t">
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-medium overflow-hidden">
                                  {member.avatar_url ? (
                                    <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    member.name?.charAt(0).toUpperCase() || "?"
                                  )}
                                </div>
                                <span>{member.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 capitalize">{member.role}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">{member.email}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">
                              {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-3 py-2.5">
                              {member.isYou ? (
                                <span className="text-muted-foreground">You</span>
                              ) : member.role !== "owner" ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pending Invitations */}
                  {invitations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs text-muted-foreground mb-2">Pending Invitations ({invitations.length})</h4>
                      <div className="border rounded-lg divide-y">
                        {invitations.map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between px-3 py-2 text-xs">
                            <div>
                              <span className="font-medium">{inv.email}</span>
                              <span className="text-muted-foreground ml-2 capitalize">({inv.role})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCancelInvitation(inv.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invite Modal */}
                  {showInviteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-xl p-6 w-[400px] shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">Invite team member</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1.5">Email address</label>
                            <input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="colleague@company.com"
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1.5">Role</label>
                            <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as any)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">Viewer</span>
                                    <span className="text-xs text-muted-foreground">Can view content</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="member">
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">Member</span>
                                    <span className="text-xs text-muted-foreground">Can edit content</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">Admin</span>
                                    <span className="text-xs text-muted-foreground">Can manage members</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {inviteError && (
                            <p className="text-xs text-red-500">{inviteError}</p>
                          )}
                        </div>

                        <div className="flex gap-2 mt-6">
                          <button
                            type="button"
                            onClick={() => {
                              setShowInviteModal(false);
                              setInviteEmail("");
                              setInviteError("");
                            }}
                            className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-muted"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleInvite}
                            disabled={isInviting || !inviteEmail}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isInviting ? "Sending..." : "Send invitation"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                    className="mt-3 w-full py-2.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 flex items-center justify-center gap-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add member
                  </button>

                  <p className="text-[11px] text-muted-foreground mt-3">
                    Each additional seat cost $17/month
                  </p>
                </div>

                {/* Danger Zone */}
                <div>
                  <h3 className="text-xs text-muted-foreground mb-3">Danger zone</h3>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete workspace
                  </button>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-[400px] shadow-xl">
                      <h3 className="text-lg font-semibold text-red-600 mb-2">Delete workspace</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This action cannot be undone. This will permanently delete the workspace
                        <span className="font-semibold text-foreground"> {workspace.name}</span> and all of its data.
                      </p>
                      
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground block mb-1.5">
                          Type <span className="font-semibold text-foreground">{workspace.name}</span> to confirm
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder={workspace.name}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteModal(false);
                            setDeleteConfirmText("");
                          }}
                          className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-muted"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteWorkspace}
                          disabled={isDeleting || deleteConfirmText !== workspace.name}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting..." : "Delete workspace"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-0 max-w-[520px]">
                <h2 className="text-xl font-semibold mb-8">Account</h2>
                
                {/* Name Section */}
                <div className="flex items-center gap-6 py-6 border-b">
                  {/* User Avatar - clickable */}
                  <button
                    type="button"
                    onClick={() => userAvatarInputRef.current?.click()}
                    className="relative h-14 w-14 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xl font-medium overflow-hidden group cursor-pointer flex-shrink-0"
                    disabled={isUploadingUserAvatar}
                  >
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt="Profile"
                        className="absolute inset-0 w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      userName?.charAt(0).toUpperCase() || "U"
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    {isUploadingUserAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                  <input
                    ref={userAvatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUserAvatarUpload}
                  />
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Name</p>
                    {/* User Name - editable */}
                    {isEditingUserName ? (
                      <input
                        type="text"
                        value={editUserName}
                        onChange={(e) => setEditUserName(e.target.value)}
                        onBlur={saveUserName}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveUserName();
                          if (e.key === "Escape") setIsEditingUserName(false);
                        }}
                        autoFocus
                        className="font-medium bg-transparent border-b border-emerald-500 outline-none text-sm"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={startEditingUserName}
                        className="font-medium hover:text-emerald-700 flex items-center gap-1 group cursor-pointer text-sm"
                      >
                        <span>{userName || "User"}</span>
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Email Section */}
                <div className="py-6 border-b">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm">{userEmail || session?.user?.email}</p>
                </div>

                {/* Support Access Section */}
                <div className="py-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Support access</p>
                    <p className="text-xs text-muted-foreground">Allow our support team to help troubleshoot issues in your workspace.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = !supportAccess;
                      setSupportAccess(newValue);
                      // Save to database
                      fetch("/api/user/profile", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ support_access: newValue }),
                      });
                    }}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors",
                      supportAccess ? "bg-emerald-600" : "bg-gray-200"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                        supportAccess ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Activity</h2>
                    <p className="text-muted-foreground text-sm">All activities in this workspace</p>
                  </div>
                  {notifications.some((n) => !n.is_read) && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-md"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark all as read
                    </button>
                  )}
                </div>

                {isLoadingNotifications ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-muted-foreground">No activities yet</p>
                    <p className="text-sm text-muted-foreground">Activities like uploads and folder changes will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {notifications.map((notification) => {
                      const getIcon = () => {
                        switch (notification.action_type) {
                          case "upload":
                            return <Upload className="h-4 w-4 text-emerald-600" />;
                          case "folder_create":
                            return <FolderPlus className="h-4 w-4 text-blue-600" />;
                          case "folder_delete":
                            return <FolderMinus className="h-4 w-4 text-red-500" />;
                          case "folder_rename":
                            return <Pencil className="h-4 w-4 text-orange-500" />;
                          case "document_delete":
                            return <FileX className="h-4 w-4 text-red-500" />;
                          default:
                            return <Info className="h-4 w-4 text-gray-500" />;
                        }
                      };

                      const formatTime = (dateStr: string) => {
                        const date = new Date(dateStr);
                        const now = new Date();
                        const diff = now.getTime() - date.getTime();
                        const minutes = Math.floor(diff / 60000);
                        const hours = Math.floor(diff / 3600000);
                        const days = Math.floor(diff / 86400000);

                        if (minutes < 1) return "Just now";
                        if (minutes < 60) return `${minutes}m ago`;
                        if (hours < 24) return `${hours}h ago`;
                        if (days < 7) return `${days}d ago`;
                        return date.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
                      };

                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                            notification.is_read
                              ? "bg-white border-gray-100"
                              : "bg-emerald-50/50 border-emerald-100"
                          )}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{notification.title}</p>
                              {!notification.is_read && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                              )}
                            </div>
                            {notification.message && (
                              <p className="text-sm text-muted-foreground truncate">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <button
                              type="button"
                              onClick={() => markNotificationRead(notification.id)}
                              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4 text-gray-400" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "import" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Import</h2>
                <p className="text-muted-foreground">Import data from other services.</p>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Billing</h2>
                <p className="text-muted-foreground">Manage your subscription and billing.</p>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Free Plan</p>
                      <p className="text-sm text-muted-foreground">Current plan</p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
                    >
                      Upgrade
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
