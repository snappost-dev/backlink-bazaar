"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, ExternalLink, Percent } from "lucide-react";
import Link from "next/link";

interface SimilarSitesPanelProps {
  similarSites: Array<{
    site: any;
    similarity: number;
    dna: any;
  }> | null;
}

export function SimilarSitesPanel({ similarSites }: SimilarSitesPanelProps) {
  if (!similarSites || similarSites.length === 0) {
    return (
      <Card className="border-2 border-dashed border-violet-300 bg-violet-50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-violet-400 mb-3" />
          <h3 className="text-lg font-semibold text-violet-900 mb-2">Benzer Site Bulunamadı</h3>
          <p className="text-sm text-violet-700 text-center max-w-md">
            SiteDNA embedding'i henüz oluşturulmadı veya benzer site bulunamadı.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-violet-900">Benzer Siteler</CardTitle>
              <CardDescription className="text-violet-700">
                pgvector Similarity Search - Top {similarSites.length} benzer site
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-violet-100 text-violet-700 border-violet-300">
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {similarSites.map((item, index) => {
            const similarityPercent = Math.round(item.similarity * 100);
            const site = item.site;
            
            return (
              <div
                key={site.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-violet-200 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {site.domain}
                    </span>
                    <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-300">
                      #{index + 1}
                    </Badge>
                  </div>
                  
                  {/* Similarity Score */}
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold text-violet-700">
                      {similarityPercent}% Benzerlik
                    </span>
                    <div className="flex-1 h-2 bg-violet-100 rounded-full overflow-hidden ml-2">
                      <div
                        className="h-full bg-violet-600 transition-all"
                        style={{ width: `${similarityPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Top Keywords Overlap */}
                  {item.dna?.topKeywords && item.dna.topKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.dna.topKeywords.slice(0, 5).map((kw: string, kwIdx: number) => (
                        <Badge key={kwIdx} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                      {item.dna.topKeywords.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.dna.topKeywords.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Category & Price */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                    {site.category && (
                      <span className="px-2 py-1 bg-slate-100 rounded-full">
                        {site.category}
                      </span>
                    )}
                    {site.finalPrice && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {site.finalPrice.toLocaleString('tr-TR')} TL
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex flex-col gap-2">
                  <Link href={`/agency/inventory/${site.id}`}>
                    <Button variant="outline" size="sm" className="rounded-[2.5rem]">
                      Detay
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="rounded-[2.5rem]">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

