"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, DollarSign, Shield } from "lucide-react";
import type { SiteInsights } from "@/lib/types/seo";

interface AIAnalysisPanelProps {
  aiInsights: SiteInsights | null;
}

export function AIAnalysisPanel({ aiInsights }: AIAnalysisPanelProps) {
  if (!aiInsights) {
    return (
      <Card className="border-2 border-dashed border-amber-300 bg-amber-50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sparkles className="w-12 h-12 text-amber-400 mb-3" />
          <h3 className="text-lg font-semibold text-amber-900 mb-2">AI Analizi Henüz Yok</h3>
          <p className="text-sm text-amber-700 text-center max-w-md">
            Gemini AI analizi Phase 1 aktivasyonu sonrası otomatik olarak oluşturulacak.
          </p>
        </CardContent>
      </Card>
    );
  }

  const riskColor = {
    Low: 'bg-green-100 text-green-700 border-green-300',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    High: 'bg-red-100 text-red-700 border-red-300',
  }[aiInsights.riskLevel];

  const riskIcon = {
    Low: <CheckCircle2 className="w-4 h-4" />,
    Medium: <AlertTriangle className="w-4 h-4" />,
    High: <AlertTriangle className="w-4 h-4" />,
  }[aiInsights.riskLevel];

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-amber-900">AI-Powered Analysis</CardTitle>
              <CardDescription className="text-amber-700">
                Gemini 1.5 Flash - Yatırım Danışmanı Analizi
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
            AI Insights
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Site Category & Risk Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-semibold text-slate-700">Site Category</span>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-base px-3 py-1">
              {aiInsights.siteCategory}
            </Badge>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              {riskIcon}
              <span className="text-sm font-semibold text-slate-700">Risk Level</span>
            </div>
            <Badge variant="outline" className={`${riskColor} text-base px-3 py-1`}>
              {aiInsights.riskLevel}
            </Badge>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white rounded-lg p-6 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h4 className="text-base font-semibold text-slate-900">Executive Summary</h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {aiInsights.executiveSummary}
          </p>
        </div>

        {/* Estimated Market Price */}
        <div className="bg-white rounded-lg p-6 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <h4 className="text-base font-semibold text-slate-900">Estimated Market Price</h4>
          </div>
          <p className="text-2xl font-bold text-amber-700">
            {aiInsights.estimatedMarketPrice}
          </p>
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pros */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="text-base font-semibold text-green-900">Advantages</h4>
            </div>
            <ul className="space-y-2">
              {aiInsights.pros.map((pro, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="text-base font-semibold text-red-900">Concerns</h4>
            </div>
            <ul className="space-y-2">
              {aiInsights.cons.map((con, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-red-800">
                  <span className="text-red-600 mt-0.5">⚠</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

