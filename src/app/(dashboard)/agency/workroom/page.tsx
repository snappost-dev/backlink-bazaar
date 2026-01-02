"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle2, Users, DollarSign } from "lucide-react";

export default function WorkroomPage() {
  const mockOrders = [
    {
      id: "order-1",
      site: "techblog.example.com",
      buyer: "Brand Corp",
      status: "in_progress",
      deadline: "2024-03-20",
      price: 180,
      brief: "Teknoloji blogunda yazı içi backlink",
    },
    {
      id: "order-2",
      site: "healthguide.example.com",
      buyer: "Health Inc",
      status: "completed",
      deadline: "2024-03-15",
      price: 240,
      brief: "Sağlık rehberinde doğal link",
    },
    {
      id: "order-3",
      site: "financehub.example.com",
      buyer: "Finance Ltd",
      status: "pending",
      deadline: "2024-03-25",
      price: 360,
      brief: "Finans hub'ında uzman görüşü linki",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
          Workroom
        </h1>
        <p className="mt-2 text-slate-600">
          Aktif siparişleri yönetin ve takip edin
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Sipariş</CardDescription>
            <CardTitle className="text-2xl">{mockOrders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Devam Eden</CardDescription>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-600">
              {mockOrders.filter((o) => o.status === "in_progress").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Tamamlanan</CardDescription>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              {mockOrders.filter((o) => o.status === "completed").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Toplam Gelir</CardDescription>
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">
              ${mockOrders.reduce((acc, o) => acc + o.price, 0).toLocaleString("tr-TR")}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-4">
        {mockOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{order.site}</CardTitle>
                  <CardDescription className="mt-1">
                    Alıcı: {order.buyer} • Deadline: {new Date(order.deadline).toLocaleDateString("tr-TR")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {order.status === "completed" && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-green-100 text-green-700 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Tamamlandı
                    </span>
                  )}
                  {order.status === "in_progress" && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-yellow-100 text-yellow-700 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Devam Ediyor
                    </span>
                  )}
                  {order.status === "pending" && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-blue-100 text-blue-700 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Beklemede
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Brief */}
                <div className="md:col-span-2 space-y-2">
                  <div className="text-sm font-medium text-slate-600">Brief</div>
                  <p className="text-sm text-slate-700 pl-6">{order.brief}</p>
                </div>

                {/* Price & Actions */}
                <div className="flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-600">Fiyat</div>
                    <p className="text-2xl font-bold text-indigo-600 pl-6">${order.price}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      Detaylar
                    </Button>
                    {order.status === "in_progress" && (
                      <Button size="sm" className="flex-1">
                        Tamamla
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

