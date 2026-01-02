"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Palette, Globe, Save } from "lucide-react";

export default function WhitelabelPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
          Whitelabel Ayarları
        </h1>
        <p className="mt-2 text-slate-600">
          Markanızı özelleştirin ve subdomain yapılandırması yapın
        </p>
      </div>

      {/* Brand Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Marka Ayarları
          </CardTitle>
          <CardDescription>
            Logo, renkler ve marka kimliğinizi özelleştirin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ajans Adı
            </label>
            <input
              type="text"
              defaultValue="My Agency"
              className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ana Renk
            </label>
            <input
              type="color"
              defaultValue="#4f46e5"
              className="w-full h-12 rounded-[2.5rem] border border-slate-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subdomain Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Subdomain Yapılandırması
          </CardTitle>
          <CardDescription>
            Özel subdomain'inizi yapılandırın (örn: ajans.snappost.app)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subdomain
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                defaultValue="myagency"
                className="flex-1 px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-slate-600">.snappost.app</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Subdomain değişikliği DNS yapılandırması gerektirir
            </p>
          </div>
          <div className="p-4 rounded-[2.5rem] bg-indigo-50 border border-indigo-200">
            <p className="text-sm text-indigo-700">
              <strong>Not:</strong> Subdomain aktifleştirildikten sonra, müşterileriniz{" "}
              <code className="bg-white px-2 py-1 rounded">myagency.snappost.app</code> adresinden erişebilir.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            API Ayarları
          </CardTitle>
          <CardDescription>
            API anahtarlarınızı yönetin ve entegrasyonları yapılandırın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                defaultValue="sk_live_••••••••••••••••"
                readOnly
                className="flex-1 px-4 py-3 rounded-[2.5rem] border border-slate-300 bg-slate-50"
              />
              <Button variant="outline" size="sm">
                Yenile
              </Button>
            </div>
          </div>
          <div className="p-4 rounded-[2.5rem] bg-yellow-50 border border-yellow-200">
            <p className="text-sm text-yellow-700">
              <strong>Güvenlik:</strong> API anahtarınızı asla paylaşmayın. Sadece güvenli ortamlarda kullanın.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" className="rounded-[2.5rem]">
          <Save className="w-5 h-5 mr-2" />
          Değişiklikleri Kaydet
        </Button>
      </div>
    </div>
  );
}

