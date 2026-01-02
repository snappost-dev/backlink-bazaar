"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, ArrowDown, ArrowUp, DollarSign } from "lucide-react";

export default function WalletPage() {
  const mockBalance = 2450.75;
  const mockTransactions = [
    { id: "1", type: "income", amount: 180, description: "techblog.example.com - Backlink satışı", date: "2024-03-15" },
    { id: "2", type: "income", amount: 240, description: "healthguide.example.com - Backlink satışı", date: "2024-03-10" },
    { id: "3", type: "withdrawal", amount: -500, description: "Para çekme", date: "2024-03-05" },
    { id: "4", type: "income", amount: 360, description: "financehub.example.com - Backlink satışı", date: "2024-03-01" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
          Cüzdan
        </h1>
        <p className="mt-2 text-slate-600">
          Gelirlerinizi takip edin ve para çekin
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
        <CardHeader>
          <CardDescription className="text-blue-100">Toplam Bakiye</CardDescription>
          <CardTitle className="text-4xl font-black mt-2">
            ${mockBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowDown className="w-4 h-4 mr-2" />
              Para Çek
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <TrendingUp className="w-4 h-4 mr-2" />
              İstatistikler
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Bu Ay Gelir</CardDescription>
              <ArrowUp className="w-5 h-5 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              ${mockTransactions
                .filter((t) => t.type === "income" && new Date(t.date).getMonth() === new Date().getMonth())
                .reduce((acc, t) => acc + t.amount, 0)
                .toLocaleString("tr-TR")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Toplam Gelir</CardDescription>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">
              ${mockTransactions
                .filter((t) => t.type === "income")
                .reduce((acc, t) => acc + t.amount, 0)
                .toLocaleString("tr-TR")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Toplam Çekilen</CardDescription>
              <ArrowDown className="w-5 h-5 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">
              ${Math.abs(
                mockTransactions
                  .filter((t) => t.type === "withdrawal")
                  .reduce((acc, t) => acc + t.amount, 0)
              ).toLocaleString("tr-TR")}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
          <CardDescription>Son işlemlerinizin listesi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-[2.5rem] bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === "income"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? (
                      <ArrowUp className="w-5 h-5" />
                    ) : (
                      <ArrowDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{transaction.description}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(transaction.date).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${
                    transaction.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {transaction.type === "income" ? "+" : ""}${transaction.amount.toLocaleString("tr-TR")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

