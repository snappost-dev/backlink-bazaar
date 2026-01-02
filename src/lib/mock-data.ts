import { Globe, Database, ShoppingCart, Wallet, CheckCircle2, Settings, BarChart3, Users, FileText, Shield, ShieldAlert, AlertTriangle } from "lucide-react";

// Mock Site Verileri
export const MOCK_SITES = [
  {
    id: "site-1",
    domain: "techblog.example.com",
    status: "verified",
    category: "Technology",
    basePrice: 150,
    finalPrice: 180,
    traffic: {
      monthly: 45000,
      organic: 38000,
      referral: 7000,
    },
    metrics: {
      da: 45,
      dr: 38,
      spam: 2,
    },
    verifiedAt: "2024-01-15",
  },
  {
    id: "site-2",
    domain: "healthguide.example.com",
    status: "pending",
    category: "Health",
    basePrice: 200,
    finalPrice: 240,
    traffic: {
      monthly: 68000,
      organic: 55000,
      referral: 13000,
    },
    metrics: {
      da: 52,
      dr: 41,
      spam: 1,
    },
    verifiedAt: null,
  },
  {
    id: "site-3",
    domain: "financehub.example.com",
    status: "verified",
    category: "Finance",
    basePrice: 300,
    finalPrice: 360,
    traffic: {
      monthly: 92000,
      organic: 78000,
      referral: 14000,
    },
    metrics: {
      da: 58,
      dr: 45,
      spam: 0,
    },
    verifiedAt: "2024-02-01",
  },
];

// Traffic Data
export const TRAFFIC_DATA = {
  monthly: 205000,
  organic: 171000,
  referral: 34000,
  growth: 12.5,
};

// Rol Konfigürasyonları
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

