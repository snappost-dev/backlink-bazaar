"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, DollarSign, ExternalLink, Zap } from "lucide-react";
import { classifyPageType, getPageTypeColor, getPageTypeIcon, type PageType } from "@/lib/utils/page-classifier";
import { PageDetailModal } from "./PageDetailModal";

interface PageLevelAnalysisPanelProps {
  relevantPages: any[] | null;
  agencyId: string;
  agencyCredits: number;
}

export function PageLevelAnalysisPanel({
  relevantPages,
  agencyId,
  agencyCredits,
}: PageLevelAnalysisPanelProps) {
  const [selectedPageUrl, setSelectedPageUrl] = useState<string | null>(null);
  const [showPageDetail, setShowPageDetail] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'BLOG' | 'CONTENT' | 'PRODUCT' | 'OTHER'>('ALL');

  if (!relevantPages || relevantPages.length === 0) {
    return (
      <Card className="border-2 border-dashed border-green-300 bg-green-50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-green-400 mb-3" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">Sayfa Verisi Yok</h3>
          <p className="text-sm text-green-700 text-center max-w-md">
            relevant_pages API'den henüz veri çekilmedi. Phase 1 aktivasyonu sonrası burada görüntülenecek.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Classify pages
  const classifiedPages = relevantPages.map((item: any) => {
    const pageUrl = item.page || item.url || item.target || '';
    const pageType = classifyPageType(pageUrl);
    return {
      ...item,
      pageUrl,
      pageType,
    };
  });

  // Filter pages by type
  const filteredPages = selectedFilter === 'ALL'
    ? classifiedPages
    : classifiedPages.filter((p: any) => p.pageType === selectedFilter);

  // Group pages by type for statistics
  const pageStats = {
    ALL: classifiedPages.length,
    BLOG: classifiedPages.filter((p: any) => p.pageType === 'BLOG').length,
    CONTENT: classifiedPages.filter((p: any) => p.pageType === 'CONTENT').length,
    PRODUCT: classifiedPages.filter((p: any) => p.pageType === 'PRODUCT').length,
    OTHER: classifiedPages.filter((p: any) => p.pageType === 'OTHER').length,
  };

  const handlePageDetailClick = (pageUrl: string) => {
    setSelectedPageUrl(pageUrl);
    setShowPageDetail(true);
  };

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-green-900">Sayfa Bazlı Analiz</CardTitle>
              <CardDescription className="text-green-700">
                relevant_pages API - Top {relevantPages.length} trafik canavarı sayfa
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            {relevantPages.length} Sayfa
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Page Type Tabs */}
        <Tabs value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as any)}>
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white">
            <TabsTrigger value="ALL" className="rounded-[2.5rem]">
              Tümü ({pageStats.ALL})
            </TabsTrigger>
            <TabsTrigger value="BLOG" className="rounded-[2.5rem]">
              Blog ({pageStats.BLOG})
            </TabsTrigger>
            <TabsTrigger value="CONTENT" className="rounded-[2.5rem]">
              Content ({pageStats.CONTENT})
            </TabsTrigger>
            <TabsTrigger value="PRODUCT" className="rounded-[2.5rem]">
              Product ({pageStats.PRODUCT})
            </TabsTrigger>
            <TabsTrigger value="OTHER" className="rounded-[2.5rem]">
              Diğer ({pageStats.OTHER})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedFilter} className="mt-0">
            <div className="space-y-3">
              {filteredPages.map((item: any, index: number) => {
                const pageUrl = item.pageUrl;
                const pageType = item.pageType as PageType;
                const traffic = item.rank_group || item.estimated_traffic || 0;
                const cost = item.estimated_paid_traffic_cost || 0;
                const pageTypeColor = getPageTypeColor(pageType);
                const pageTypeIcon = getPageTypeIcon(pageType);

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{pageTypeIcon}</span>
                        <span className="text-sm font-medium text-slate-900 truncate flex-1">
                          {pageUrl}
                        </span>
                        <Badge variant="outline" className={pageTypeColor}>
                          {pageType}
                        </Badge>
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
                    <div className="ml-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-[2.5rem]"
                        onClick={() => handlePageDetailClick(pageUrl)}
                        disabled={agencyCredits < 1}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Detaylı Analiz
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-[2.5rem]">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Page Detail Modal */}
        {showPageDetail && selectedPageUrl && (
          <PageDetailModal
            pageUrl={selectedPageUrl}
            agencyId={agencyId}
            agencyCredits={agencyCredits}
            onClose={() => {
              setShowPageDetail(false);
              setSelectedPageUrl(null);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

