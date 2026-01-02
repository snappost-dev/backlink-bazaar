"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function OrdersPage() {
  const mockOrders = [
    {
      id: "order-1",
      site: "techblog.example.com",
      status: "completed",
      orderDate: "2024-03-10",
      completedDate: "2024-03-15",
      price: 180,
      link: "https://techblog.example.com/article",
    },
    {
      id: "order-2",
      site: "healthguide.example.com",
      status: "in_progress",
      orderDate: "2024-03-12",
      completedDate: null,
      price: 240,
      link: null,
    },
    {
      id: "order-3",
      site: "financehub.example.com",
      status: "pending",
      orderDate: "2024-03-14",
      completedDate: null,
      price: 360,
      link: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
          Siparişler
        </h1>
        <p className="mt-2 text-slate-600">
          Siparişlerinizi takip edin ve durumlarını görüntüleyin
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
              <CardDescription>Toplam Harcama</CardDescription>
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
                    Sipariş Tarihi: {new Date(order.orderDate).toLocaleDateString("tr-TR")}
                    {order.completedDate && (
                      <> • Tamamlanma: {new Date(order.completedDate).toLocaleDateString("tr-TR")}</>
                    )}
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
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-slate-600">Fiyat: </span>
                    <span className="font-semibold text-slate-900">${order.price}</span>
                  </div>
                  {order.link && (
                    <div className="text-sm">
                      <span className="text-slate-600">Link: </span>
                      <a
                        href={order.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {order.link}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Detaylar
                  </Button>
                  {order.status === "completed" && order.link && (
                    <Button variant="outline" size="sm">
                      Linki Görüntüle
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

