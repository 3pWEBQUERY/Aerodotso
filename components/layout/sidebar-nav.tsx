"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Search,
  Home,
  MessageCircle,
  StickyNote,
  ImageIcon,
  Link2,
  LayoutTemplate,
  MoreVertical,
  Key,
  Settings,
  Plus,
  Bell,
  UserPlus,
  Building2,
  LogOut,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { SettingsModal } from "@/components/settings/settings-modal";
import { MediaSidebar, SearchSidebar, NotesSidebar, HomeSidebar, LinksSidebar, CanvasSidebar } from "./sidebars";

interface SidebarNavProps {
  workspaceId?: string;
}

const configurableTabIds = ["chat", "notes", "media", "links", "canvas"] as const;
type ConfigurableTabId = (typeof configurableTabIds)[number];

interface Notification {
  id: string;
  title: string;
  message?: string;
  type?: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  workspaceName: string;
  invitedBy: string;
  createdAt: string;
}

interface Workspace {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export function SidebarNav({ workspaceId }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const base = workspaceId ? `/workspace/${workspaceId}` : "/workspace";

  // Real data from API
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [workspaceInvites, setWorkspaceInvites] = useState<WorkspaceInvite[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  // Fetch workspace invites
  const fetchWorkspaceInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace-invites");
      const data = await res.json();
      setWorkspaceInvites(data.invites || []);
    } catch (error) {
      console.error("Failed to fetch workspace invites:", error);
    }
  }, []);

  // Fetch workspaces
  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.user) {
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }, []);

  // Create new workspace
  const createWorkspace = async () => {
    setIsCreatingWorkspace(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Workspace" }),
      });
      const data = await res.json();
      if (data.workspace) {
        await fetchWorkspaces();
        router.push(`/workspace/${data.workspace.id}`);
      }
    } catch (error) {
      console.error("Failed to create workspace:", error);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  // Accept/decline invite
  const handleInvite = async (inviteId: string, action: "accept" | "decline") => {
    try {
      await fetch("/api/workspace-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action }),
      });
      await fetchWorkspaceInvites();
      if (action === "accept") {
        await fetchWorkspaces();
      }
    } catch (error) {
      console.error("Failed to handle invite:", error);
    }
  };

  // Load data on mount and when workspaceId changes
  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      fetchWorkspaceInvites();
      fetchWorkspaces();
      fetchUserProfile();
    }
  }, [session, workspaceId, fetchNotifications, fetchWorkspaceInvites, fetchWorkspaces, fetchUserProfile]);

  // Refresh workspaces when window gets focus or workspace is renamed
  useEffect(() => {
    const handleRefresh = () => {
      if (session?.user) {
        fetchWorkspaces();
      }
    };
    const handleProfileUpdate = () => {
      if (session?.user) {
        fetchUserProfile();
      }
    };
    window.addEventListener("focus", handleRefresh);
    window.addEventListener("workspace-renamed", handleRefresh);
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("workspace-renamed", handleRefresh);
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [session, fetchWorkspaces, fetchUserProfile]);

  // Find current workspace
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);

  const [visibleTabs, setVisibleTabs] = useState<Record<ConfigurableTabId, boolean>>({
    chat: true,
    notes: true,
    media: true,
    links: true,
    canvas: true,
  });
  const [showLabels, setShowLabels] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const primaryTabs = [
    {
      id: "search",
      label: "Search",
      icon: Search,
      href: `${base}/search`,
    },
    {
      id: "home",
      label: "Home",
      icon: Home,
      href: base,
    },
  ] as const;

  const configurableTabs: { id: ConfigurableTabId; label: string; icon: any; href: string }[] = [
    {
      id: "chat",
      label: "Chat",
      icon: MessageCircle,
      href: `${base}/chat`,
    },
    {
      id: "notes",
      label: "Notes",
      icon: StickyNote,
      href: `${base}/notes`,
    },
    {
      id: "media",
      label: "Media",
      icon: ImageIcon,
      href: `${base}/media`,
    },
    {
      id: "links",
      label: "Links",
      icon: Link2,
      href: `${base}/links`,
    },
    {
      id: "canvas",
      label: "Canvas",
      icon: LayoutTemplate,
      href: `${base}/canvas`,
    },
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const toggleTabVisible = (id: ConfigurableTabId) => {
    setVisibleTabs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Determine which secondary sidebar to show based on current route
  const getSecondarySidebar = () => {
    if (!pathname || !workspaceId) return null;
    
    if (pathname.includes("/media")) {
      return <MediaSidebar workspaceId={workspaceId} />;
    }
    if (pathname.includes("/search")) {
      return <SearchSidebar workspaceId={workspaceId} />;
    }
    if (pathname.includes("/notes")) {
      return <NotesSidebar workspaceId={workspaceId} />;
    }
    // Chat page has its own internal sidebar with hover buttons
    if (pathname.includes("/links")) {
      return <LinksSidebar workspaceId={workspaceId} />;
    }
    if (pathname.includes("/canvas")) {
      return <CanvasSidebar workspaceId={workspaceId} />;
    }
    // Home page (workspace root without specific sub-route)
    if (pathname === `/workspace/${workspaceId}` || pathname === `/workspace/${workspaceId}/`) {
      return <HomeSidebar workspaceId={workspaceId} />;
    }
    
    return null;
  };

  const secondarySidebar = getSecondarySidebar();

  return (
    <div className="flex h-full">
      {/* Primary Icon Navigation */}
      <div className="flex h-full w-14 flex-col justify-between bg-background border-r">
        {/* Oben: Create-Button + vertikale Tabs wie bei Eden */}
        <div className="flex flex-col items-center gap-3 pt-2 pb-3 px-1">
        {/* Create */}
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-neutral-50 shadow-lg hover:shadow-xl focus-visible:outline-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(26,61,46), rgb(58,86,73))",
          }}
          aria-label="Create"
        >
          <Plus className="h-4 w-4" />
        </button>

        <div className="flex w-full flex-col items-center gap-0.5">
          {[...primaryTabs, ...configurableTabs].map((tab) => {
            const isConfigurable = (
              configurableTabIds as readonly string[]
            ).includes(tab.id as string);

            if (isConfigurable && !visibleTabs[tab.id as ConfigurableTabId]) {
              return null;
            }

            const Icon = tab.icon;
            const active = isActive(tab.href);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="group relative w-full"
              >
                <div className="flex flex-col items-center gap-0.5 py-0.5">
                  <div
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                      active
                        ? "bg-neutral-200 text-emerald-900"
                        : "text-muted-foreground hover:bg-neutral-100"
                    )}
                  >
                    <Icon className="relative z-10 h-4 w-4 transition-transform group-hover:scale-110 group-focus-visible:scale-110" />
                  </div>
                  {showLabels && (
                    <span
                      className={cn(
                        "text-[9px] leading-tight font-medium",
                        active ? "text-emerald-900" : "text-muted-foreground"
                      )}
                    >
                      {tab.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* More Button direkt nach Canvas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex flex-col items-center gap-0.5 py-0.5 w-full"
                aria-label="More options"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-neutral-100">
                  <MoreVertical className="h-4 w-4" />
                </div>
                {showLabels && (
                  <span className="text-[9px] leading-tight font-medium text-muted-foreground">
                    More
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel>Sidebar Tabs</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {configurableTabs.map((tab) => (
                <DropdownMenuCheckboxItem
                  key={tab.id}
                  checked={visibleTabs[tab.id]}
                  onCheckedChange={() => toggleTabVisible(tab.id)}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showLabels}
                onCheckedChange={(checked) => setShowLabels(Boolean(checked))}
              >
                Show Labels
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Unten: Key, Settings, Profil */}
      <div className="flex flex-col items-center gap-1 pb-3">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-neutral-100"
          aria-label="API Keys"
        >
          <Key className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-neutral-100"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Settings Modal */}
        <SettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          workspaceId={workspaceId}
        />

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-white text-xs font-medium overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              aria-label="Profile menu"
            >
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.name || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                (userProfile?.name || session?.user?.name)?.charAt(0).toUpperCase() || "U"
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-64">
            {/* User Info Header */}
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-white text-sm font-medium overflow-hidden flex-shrink-0">
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (userProfile?.name || session?.user?.name)?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">
                  {userProfile?.name || session?.user?.name || "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {userProfile?.email || session?.user?.email || ""}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />

            {/* Notifications */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span className="ml-auto text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-72">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start gap-1 py-2"
                      >
                        <span className="font-medium">{notification.title}</span>
                        {notification.message && (
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No notifications
                    </div>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {/* Workspace Invites */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <span>Workspace Invites</span>
                {workspaceInvites.length > 0 && (
                  <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                    {workspaceInvites.length}
                  </span>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-64">
                  {workspaceInvites.length > 0 ? (
                    workspaceInvites.map((invite) => (
                      <div key={invite.id} className="px-2 py-2 text-sm">
                        <div className="font-medium">{invite.workspaceName}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          Invited by {invite.invitedBy}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="flex-1 px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            onClick={() => handleInvite(invite.id, "accept")}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="flex-1 px-2 py-1 text-xs border rounded hover:bg-muted"
                            onClick={() => handleInvite(invite.id, "decline")}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No pending invitations
                    </div>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {/* Switch Workspace */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>Switch Workspace</span>
                  <span className="text-xs text-muted-foreground">
                    {currentWorkspace?.name || "Workspace"}
                  </span>
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-56">
                  {workspaces.map((workspace) => {
                    const isActive = workspace.id === workspaceId;
                    return (
                      <DropdownMenuItem
                        key={workspace.id}
                        className="flex items-center gap-2"
                        onClick={() => router.push(`/workspace/${workspace.id}`)}
                      >
                        {isActive && <Check className="h-4 w-4" />}
                        {!isActive && <div className="w-4" />}
                        <span>{workspace.name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    disabled={isCreatingWorkspace}
                    onClick={createWorkspace}
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isCreatingWorkspace ? "Creating..." : "Create new workspace"}</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuItem
              className="flex items-center gap-3 px-3 py-2 text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>

      {/* Secondary Context Sidebar */}
      {secondarySidebar}
    </div>
  );
}
