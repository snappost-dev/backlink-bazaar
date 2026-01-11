"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Cell } from "recharts";
import { AlertCircle, CheckCircle2, XCircle, TrendingUp, Shield, Zap, Link2, Code, DollarSign, User, RefreshCw, Share2, Monitor, Globe } from "lucide-react";
import type { SeoFix, ScoringMetrics } from "@/lib/types/seo";

interface HealthCheckPanelProps {
  scores: {
    s_tech: number | null;
    s_sem: number | null;
    s_link: number | null;
    s_schema: number | null;
    s_mon: number | null;
    s_eeat: number | null;
    s_fresh: number | null;
    s_viral: number | null;
    s_ux: number | null;
    s_global: number | null;
  };
  seoFixes: SeoFix[];
}

// Skor rengi hesaplama
function getScoreColor(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-indigo-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBgColor(score: number | null): string {
  if (score === null) return 'bg-slate-50 border-slate-200';
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-indigo-50 border-indigo-200';
  if (score >= 40) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

function getPriorityIcon(priority: string) {
  if (priority === 'HIGH') return <AlertCircle className="w-4 h-4 text-red-600" />;
  if (priority === 'MEDIUM') return <AlertCircle className="w-4 h-4 text-yellow-600" />;
  return <AlertCircle className="w-4 h-4 text-slate-600" />;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'TECHNICAL':
      return <Code className="w-4 h-4" />;
    case 'PERFORMANCE':
      return <Zap className="w-4 h-4" />;
    case 'SCHEMA':
      return <Shield className="w-4 h-4" />;
    case 'SEMANTIC':
      return <TrendingUp className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
}

export function HealthCheckPanel({ scores, seoFixes }: HealthCheckPanelProps) {
  // Radar Chart data (10 skor - s_global hariç)
  const radarData = [
    { name: 'Technical', value: scores.s_tech || 0, fullMark: 100 },
    { name: 'Semantic', value: scores.s_sem || 0, fullMark: 100 },
    { name: 'Link', value: scores.s_link || 0, fullMark: 100 },
    { name: 'Schema', value: scores.s_schema || 0, fullMark: 100 },
    { name: 'Monetization', value: scores.s_mon || 0, fullMark: 100 },
    { name: 'E-EAT', value: scores.s_eeat || 0, fullMark: 100 },
    { name: 'Freshness', value: scores.s_fresh || 0, fullMark: 100 },
    { name: 'Viral', value: scores.s_viral || 0, fullMark: 100 },
    { name: 'UX', value: scores.s_ux || 0, fullMark: 100 },
  ];

  // Skor kartları için label ve icon mapping
  const scoreLabels: Record<string, { label: string; icon: any; description: string }> = {
    s_tech: { label: 'Technical', icon: Code, description: 'Teknik SEO (H1, SSL, Canonical)' },
    s_sem: { label: 'Semantic', icon: TrendingUp, description: 'Semantik SEO (Keywords, Rankings)' },
    s_link: { label: 'Link Equity', icon: Link2, description: 'Backlink Gücü' },
    s_schema: { label: 'Schema', icon: Shield, description: 'Schema.org Yapılandırması' },
    s_mon: { label: 'Monetization', icon: DollarSign, description: 'Yüksek CPC Kelimeler' },
    s_eeat: { label: 'E-EAT', icon: User, description: 'Trust Rank (Yazar, About)' },
    s_fresh: { label: 'Freshness', icon: RefreshCw, description: 'İçerik Güncelliği' },
    s_viral: { label: 'Viral', icon: Share2, description: 'Sosyal Medya Optimizasyonu' },
    s_ux: { label: 'UX Flow', icon: Monitor, description: 'Kullanıcı Deneyimi (LCP, TTFB)' },
    s_global: { label: 'Global Score', icon: Globe, description: 'Ağırlıklı Ortalama' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] p-6 border-2 border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🏥</span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Health Check Panel</h3>
            <p className="text-xs text-slate-600">10 Boyutlu SEO Skorlama Sistemi</p>
          </div>
          {scores.s_global !== null && (
            <div className="ml-auto text-right">
              <div className={`text-3xl font-black ${getScoreColor(scores.s_global)}`}>
                {scores.s_global}
              </div>
              <div className="text-xs text-slate-500">Global Score</div>
            </div>
          )}
        </div>
      </div>

      {/* Radar Chart */}
      {scores.s_tech !== null && (
        <div className="bg-white rounded-[2.5rem] border-2 border-indigo-200 overflow-hidden">
          <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
            <h4 className="text-base font-semibold text-indigo-900">SEO Skor Dağılımı</h4>
            <p className="text-xs text-indigo-600 mt-1">10 boyutlu skor analizi (Radar Chart)</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis 
                  dataKey="name" 
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  className="text-xs"
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Radar
                  name="Skor"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Skor Kartları Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(scores).map(([key, value]) => {
          if (key === 's_global') return null; // Global score'u ayrı gösterdik
          
          const config = scoreLabels[key];
          if (!config) return null;
          
          const Icon = config.icon;
          const score = value !== null ? value : 0;
          
          return (
            <div
              key={key}
              className={`rounded-[2.5rem] border-2 p-4 ${getScoreBgColor(value)} transition-all hover:shadow-lg`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${getScoreColor(value)}`} />
                {value !== null && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    score >= 80 ? 'bg-green-100 text-green-700' :
                    score >= 60 ? 'bg-indigo-100 text-indigo-700' :
                    score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {score}/100
                  </span>
                )}
              </div>
              <div className={`text-2xl font-black mb-1 ${getScoreColor(value)}`}>
                {value !== null ? value : '-'}
              </div>
              <div className="text-xs font-medium text-slate-700 mb-1">
                {config.label}
              </div>
              <div className="text-[10px] text-slate-500 line-clamp-2">
                {config.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Score Card (Ayrı) */}
      {scores.s_global !== null && (
        <div className={`rounded-[2.5rem] border-2 p-6 ${getScoreBgColor(scores.s_global)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className={`w-8 h-8 ${getScoreColor(scores.s_global)}`} />
              <div>
                <h4 className="text-base font-semibold text-slate-900">Global Score</h4>
                <p className="text-xs text-slate-600">Ağırlıklı Ortalama (10 Boyutlu)</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-black ${getScoreColor(scores.s_global)}`}>
                {scores.s_global}
              </div>
              <div className="text-xs text-slate-500">/ 100</div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Fixes Listesi */}
      {seoFixes && seoFixes.length > 0 && (
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
            <h4 className="text-base font-semibold text-amber-900">SEO Fix Listesi</h4>
            <p className="text-xs text-amber-600 mt-1">Önceliklendirilmiş yapılacaklar listesi</p>
          </div>
          <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
            {seoFixes.map((fix, index) => (
              <div
                key={index}
                className={`px-6 py-4 hover:bg-slate-50 transition-colors ${
                  fix.priority === 'HIGH' ? 'bg-red-50/50' :
                  fix.priority === 'MEDIUM' ? 'bg-yellow-50/50' :
                  'bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${
                    fix.priority === 'HIGH' ? 'text-red-600' :
                    fix.priority === 'MEDIUM' ? 'text-yellow-600' :
                    'text-slate-600'
                  }`}>
                    {getPriorityIcon(fix.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">{fix.message}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        fix.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                        fix.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {fix.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono">{fix.code}</span>
                      {fix.scoreImpact && (
                        <>
                          <span>•</span>
                          <span>Skor Etkisi: -{fix.scoreImpact}</span>
                        </>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        {getCategoryIcon(fix.category)}
                        <span>{fix.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fix Listesi Boş */}
      {(!seoFixes || seoFixes.length === 0) && (
        <div className="bg-green-50 rounded-[2.5rem] border-2 border-green-200 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Harika! Kritik hata bulunamadı</p>
              <p className="text-xs text-green-700 mt-1">
                Local Audit sonuçlarına göre kritik SEO hatası bulunmuyor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

