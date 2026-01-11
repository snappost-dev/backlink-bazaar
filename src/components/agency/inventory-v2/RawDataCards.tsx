"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Users, 
  FileText, 
  Link2, 
  TrendingUp, 
  Download,
  ExternalLink,
  DollarSign,
  Target,
  AlertCircle
} from "lucide-react";

interface RawDataCardsProps {
  rankedKeywords: any[] | null;
  serpCompetitors: any[] | null;
  relevantPages: any[] | null;
  backlinkSummary: any | null;
}

export function RawDataCards({
  rankedKeywords,
  serpCompetitors,
  relevantPages,
  backlinkSummary,
}: RawDataCardsProps) {
  return (
    <div className="space-y-6">
      {/* Ranked Keywords Table */}
      {rankedKeywords && rankedKeywords.length > 0 && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Search className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-purple-900">En Değerli Kelimeler</CardTitle>
                  <CardDescription className="text-purple-700">
                    Top {rankedKeywords.length} sıralı anahtar kelime
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-[2.5rem]">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-purple-900">Keyword</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-purple-900">Rank</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-purple-900">Volume</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-purple-900">CPC</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-purple-900">Intent</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-purple-900">Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {rankedKeywords.slice(0, 10).map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-purple-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-slate-900">
                          {item.keyword || item.se_keyword || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="bg-white">
                          {item.rank_group || item.rank || '-'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-slate-700">
                        {item.search_volume ? item.search_volume.toLocaleString('tr-TR') : '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-slate-700">
                        {item.cpc ? `$${item.cpc.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.keyword_intent ? (
                          <Badge variant="secondary" className="text-xs">
                            {item.keyword_intent}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.keyword_difficulty !== undefined ? (
                          <span className={`text-sm font-semibold ${
                            item.keyword_difficulty >= 70 ? 'text-red-600' :
                            item.keyword_difficulty >= 40 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {item.keyword_difficulty}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SERP Competitors List */}
      {serpCompetitors && serpCompetitors.length > 0 && (
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-indigo-900">Pazar Rakipleri</CardTitle>
                <CardDescription className="text-indigo-700">
                  SERP'te görünen rakip domainler
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serpCompetitors.slice(0, 10).map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-indigo-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {item.domain || item.target || '-'}
                      </span>
                      {item.relevance_score !== undefined && (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                          {Math.round(item.relevance_score * 100)}% Match
                        </Badge>
                      )}
                    </div>
                    {item.common_keywords && item.common_keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.common_keywords.slice(0, 5).map((kw: string, kwIdx: number) => (
                          <Badge key={kwIdx} variant="secondary" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                        {item.common_keywords.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.common_keywords.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="ml-4">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traffic Monster Pages */}
      {relevantPages && relevantPages.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-green-900">Trafik Canavarı Sayfalar</CardTitle>
                <CardDescription className="text-green-700">
                  En çok trafik alan sayfalar
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relevantPages.slice(0, 10).map((item: any, index: number) => {
                const pageUrl = item.page || item.url || item.target || '-';
                const traffic = item.rank_group || item.estimated_traffic || 0;
                const cost = item.estimated_paid_traffic_cost || 0;
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {pageUrl}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                        {traffic > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {traffic.toLocaleString('tr-TR')} trafik
                          </span>
                        )}
                        {cost > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${cost.toFixed(2)}/ay
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-4">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backlink Summary */}
      {backlinkSummary && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-amber-900">Otorite Kartı</CardTitle>
                <CardDescription className="text-amber-700">
                  Backlink özeti ve domain otoritesi
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {backlinkSummary.trust_score !== undefined && (
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-semibold text-slate-700">Trust Score</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700">
                    {Math.round(backlinkSummary.trust_score)}
                  </div>
                </div>
              )}
              {backlinkSummary.total_backlinks !== undefined && (
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-semibold text-slate-700">Total Backlinks</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700">
                    {backlinkSummary.total_backlinks.toLocaleString('tr-TR')}
                  </div>
                </div>
              )}
              {backlinkSummary.referring_domains !== undefined && (
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-semibold text-slate-700">Referring Domains</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700">
                    {backlinkSummary.referring_domains.toLocaleString('tr-TR')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!rankedKeywords && !serpCompetitors && !relevantPages && !backlinkSummary && (
        <Card className="border-2 border-dashed border-purple-300 bg-purple-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-purple-400 mb-3" />
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Phase 1 Verisi Henüz Yok</h3>
            <p className="text-sm text-purple-700 text-center max-w-md">
              Phase 1 aktivasyonu sonrası burada detaylı veriler görüntülenecek.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

