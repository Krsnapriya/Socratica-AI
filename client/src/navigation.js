// Socratica AI — Shared Navigation Config
// Used by SideNavBar and TopNavBar to avoid duplication.

export const NAV_ITEMS = [
  { to: "/", icon: "dashboard", label: "Dashboard" },
  { to: "/modules", icon: "school", label: "Curriculum" },
  { to: "/workspace", icon: "code", label: "Workspace" },
  { to: "/trajectory", icon: "account_tree", label: "Trajectory" },
  { to: "/analytics", icon: "insights", label: "Analytics" },
  { to: "/archive", icon: "archive", label: "Archive" },
];

export const ADMIN_NAV_ITEMS = [
  { to: "/admin", icon: "admin_panel_settings", label: "Admin" },
];

export const WORKSPACE_NAV = [
  { to: "/workspace", icon: "code", label: "Workspace" },
  { to: "/trajectory", icon: "account_tree", label: "Trajectory" },
  { to: "/analytics", icon: "insights", label: "Analytics" },
  { to: "/settings", icon: "settings", label: "Settings" },
];

export const TRAJECTORY_SIDEBAR = [
  { to: "/workspace", icon: "code", label: "Workspace" },
  { to: "/trajectory", icon: "account_tree", label: "Trajectory" },
  { to: "/analytics", icon: "insights", label: "Analytics" },
  { to: "/settings", icon: "settings", label: "Settings" },
];

export const ADMIN_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'users', label: 'Users', icon: 'group' },
  { key: 'courses', label: 'Courses', icon: 'school' },
  { key: 'modules', label: 'Modules', icon: 'layers' },
  { key: 'problems', label: 'Problems', icon: 'code' },
  { key: 'testcases', label: 'Test Cases', icon: 'checklist' },
  { key: 'drivers', label: 'Drivers', icon: 'directions_car' },
  { key: 'compiler', label: 'Compiler', icon: 'terminal' },
  { key: 'ai', label: 'AI Mentor', icon: 'smart_toy' },
  { key: 'audit', label: 'Audit Logs', icon: 'receipt_long' },
  { key: 'security', label: 'Security', icon: 'security' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications' },
  { key: 'permissions', label: 'Permissions', icon: 'manage_accounts' },
  { key: 'module-access', label: 'Module Access', icon: 'admin_panel_settings' },
  { key: 'database', label: 'Database', icon: 'storage' },
];
