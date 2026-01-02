import { Globe, Database, ShoppingCart, Wallet, CheckCircle2, Settings, BarChart3, Users, FileText, Shield, ShieldAlert, AlertTriangle } from "lucide-react";

// Rol Konfigürasyonları (Menu yapısı için)
export const ROLE_CONFIGS = {
  PUBLISHER: {
    color: "blue",
    bgColor: "bg-blue-600",
    textColor: "text-blue-600",
    menu: [
      { id: "inventory", label: "Envanter", icon: Globe, path: "/publisher/inventory" },
      { id: "wallet", label: "Cüzdan", icon: Wallet, path: "/publisher/wallet" },
      { id: "verification", label: "Doğrulama Hub", icon: CheckCircle2, path: "/publisher/verification" },
      { id: "analytics", label: "Analitik", icon: BarChart3, path: "/publisher/analytics" },
    ],
  },
  AGENCY: {
    color: "indigo",
    bgColor: "bg-indigo-600",
    textColor: "text-indigo-600",
    menu: [
      { id: "vetting", label: "Vetting Pool", icon: Database, path: "/agency/vetting" },
      { id: "inventory", label: "Özel Portföy", icon: Globe, path: "/agency/inventory" },
      { id: "workroom", label: "Workroom", icon: FileText, path: "/agency/workroom" },
      { id: "whitelabel", label: "Whitelabel Ayarları", icon: Settings, path: "/agency/whitelabel" },
      { id: "analytics", label: "Analitik", icon: BarChart3, path: "/agency/analytics" },
    ],
  },
  BUYER: {
    color: "slate",
    bgColor: "bg-slate-900",
    textColor: "text-slate-900",
    menu: [
      { id: "marketplace", label: "Marketplace", icon: ShoppingCart, path: "/buyer/marketplace" },
      { id: "orders", label: "Siparişler", icon: FileText, path: "/buyer/orders" },
      { id: "analytics", label: "Analitik", icon: BarChart3, path: "/buyer/analytics" },
    ],
  },
  ADMIN: {
    color: "red",
    bgColor: "bg-red-600",
    textColor: "text-red-600",
    menu: [
      { id: "dashboard", label: "Global Dashboard", icon: BarChart3, path: "/admin/dashboard" },
      { id: "vetting", label: "Vetting Denetim", icon: ShieldAlert, path: "/admin/vetting" },
      { id: "disputes", label: "Uyuşmazlıklar", icon: AlertTriangle, path: "/admin/disputes" },
    ],
  },
};

// Mevcut rol (mock - gerçek uygulamada auth'dan gelecek)
export const CURRENT_ROLE: keyof typeof ROLE_CONFIGS = "PUBLISHER";
