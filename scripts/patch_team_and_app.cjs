const fs = require('fs');
const path = require('path');

// 1. Patch TeamMemberProfilePage.jsx
const profilePath = path.join(__dirname, '..', 'src', 'dashboard', 'admin', 'TeamMemberProfilePage.jsx');
if (fs.existsSync(profilePath)) {
  let code = fs.readFileSync(profilePath, 'utf8');

  if (!code.includes('TeamPerformanceCard')) {
    code = code.replace(
      "import { toast } from 'react-hot-toast';",
      "import { toast } from 'react-hot-toast';\nimport TeamPerformanceCard from '../../components/TeamPerformanceCard';\nimport UserPresenceBadge from '../../components/UserPresenceBadge';"
    );
  }

  if (!code.includes('<UserPresenceBadge')) {
    code = code.replace(
      `<div className="text-xl" title={t('health_status', 'Health Status')}>`,
      `<UserPresenceBadge userId={member?.id} initialOnline={member?.isOnline} initialLastActive={member?.lastActiveAt} />\n                  <div className="text-xl" title={t('health_status', 'Health Status')}>`
    );
  }

  if (!code.includes('<TeamPerformanceCard')) {
    code = code.replace(
      "{/* Financial Hassala Stats & Performance */}",
      `{/* Team Member Commitment & Performance */}\n      <TeamPerformanceCard performance={member?.performance} memberName={\`\${member?.firstName || ''} \${member?.lastName || ''}\`} position={member?.position} />\n\n      {/* Financial Hassala Stats & Performance */}`
    );
  }

  fs.writeFileSync(profilePath, code, 'utf8');
  console.log('[+] TeamMemberProfilePage.jsx patched successfully!');
}

// 2. Patch TeamPage.jsx
const teamPath = path.join(__dirname, '..', 'src', 'dashboard', 'admin', 'TeamPage.jsx');
if (fs.existsSync(teamPath)) {
  let code = fs.readFileSync(teamPath, 'utf8');

  if (!code.includes('UserPresenceBadge')) {
    code = code.replace(
      "import { toast } from 'react-hot-toast';",
      "import { toast } from 'react-hot-toast';\nimport UserPresenceBadge from '../../components/UserPresenceBadge';"
    );
  }

  if (!code.includes('<UserPresenceBadge')) {
    code = code.replace(
      `<div className="w-24 h-24 rounded-[2rem]`,
      `<div className="absolute top-6 left-6 z-10">\n                  <UserPresenceBadge userId={m.id} initialOnline={m.isOnline} initialLastActive={m.lastActiveAt} variant="dot" />\n                </div>\n                <div className="w-24 h-24 rounded-[2rem]`
    );
  }

  if (!code.includes('مؤشر الالتزام')) {
    code = code.replace(
      "{/* Finance Tracker */}",
      `{/* Performance Commitment Badge */}\n              {m.performance && (\n                <div className="w-full flex items-center justify-between px-4 py-2 bg-brand-500/5 rounded-2xl border border-brand-500/10 text-[10px] font-black mb-3">\n                  <span className="text-slate-400">مؤشر الالتزام:</span>\n                  <span className="text-brand-500">{m.performance.commitmentScore}% ({m.performance.rating})</span>\n                </div>\n              )}\n\n              {/* Finance Tracker */}`
    );
  }

  fs.writeFileSync(teamPath, code, 'utf8');
  console.log('[+] TeamPage.jsx patched successfully!');
}

// 3. Patch App.jsx
const appPath = path.join(__dirname, '..', 'src', 'App.jsx');
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  if (!code.includes('SalesPage')) {
    code = code.replace(
      "import ContractsPage from './dashboard/admin/ContractsPage';",
      "import ContractsPage from './dashboard/admin/ContractsPage';\nimport SalesPage from './dashboard/admin/SalesPage';\nimport usePresenceStore from './store/presenceStore';"
    );
  }

  if (!code.includes('fetchPresence')) {
    code = code.replace(
      "const fetchProfile = useAuthStore(state => state.fetchProfile);",
      "const fetchProfile = useAuthStore(state => state.fetchProfile);\n  const fetchPresence = usePresenceStore(state => state.fetchPresence);"
    );
  }

  if (!code.includes('user_presence_change')) {
    code = code.replace(
      "socket.on('broadcast_updated', handleBroadcastUpdated);",
      "socket.on('broadcast_updated', handleBroadcastUpdated);\n    const handlePresenceChange = ({ userId, isOnline, lastActiveAt }) => usePresenceStore.getState().updatePresence(userId, isOnline, lastActiveAt);\n    socket.on('user_presence_change', handlePresenceChange);"
    );
    code = code.replace(
      "socket.off('broadcast_updated', handleBroadcastUpdated);",
      "socket.off('broadcast_updated', handleBroadcastUpdated);\n      socket.off('user_presence_change', handlePresenceChange);"
    );
  }

  if (!code.includes('fetchPresence();')) {
    code = code.replace(
      "if (token) {\n      fetchProfile();",
      "if (token) {\n      fetchProfile();\n      fetchPresence();"
    );
    if (!code.includes('fetchPresence();')) {
      code = code.replace(
        "if (token) {\r\n      fetchProfile();",
        "if (token) {\r\n      fetchProfile();\r\n      fetchPresence();"
      );
    }
  }

  if (!code.includes('path="sales"')) {
    code = code.replace(
      `<Route path="notifications" element={<NotificationsPage />} />\n            </Route>`,
      `<Route path="sales" element={<SalesPage />} />\n              <Route path="notifications" element={<NotificationsPage />} />\n            </Route>`
    );
    if (!code.includes('path="sales"')) {
      code = code.replace(
        `<Route path="notifications" element={<NotificationsPage />} />\r\n            </Route>`,
        `<Route path="sales" element={<SalesPage />} />\r\n              <Route path="notifications" element={<NotificationsPage />} />\r\n            </Route>`
      );
    }
  }

  fs.writeFileSync(appPath, code, 'utf8');
  console.log('[+] App.jsx patched successfully!');
}

// 4. Patch Sidebar.jsx
const sidebarPath = path.join(__dirname, '..', 'src', 'components', 'Sidebar.jsx');
if (fs.existsSync(sidebarPath)) {
  let code = fs.readFileSync(sidebarPath, 'utf8');

  if (!code.includes('TrendingUp')) {
    code = code.replace(
      "BarChart3,",
      "BarChart3,\n  TrendingUp,"
    );
  }

  if (!code.includes("to: '/admin/sales'")) {
    code = code.replace(
      "{ to: '/admin/finance', icon: BarChart3, labelKey: 'finance_hub' },",
      "{ to: '/admin/sales', icon: TrendingUp, labelKey: 'sales_crm' },\n  { to: '/admin/finance', icon: BarChart3, labelKey: 'finance_hub' },"
    );
    code = code.replace(
      "{ to: '/team/contracts', icon: FileBadge, labelKey: 'contracts' },",
      "{ to: '/team/sales', icon: TrendingUp, labelKey: 'sales_crm' },\n  { to: '/team/contracts', icon: FileBadge, labelKey: 'contracts' },"
    );
  }

  fs.writeFileSync(sidebarPath, code, 'utf8');
  console.log('[+] Sidebar.jsx patched successfully!');
}
