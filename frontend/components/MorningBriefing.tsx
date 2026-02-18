"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBriefing } from "@/lib/api";
import { Sparkles, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MorningBriefing() {
    const [briefing, setBriefing] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchBriefing = async (force: boolean = false) => {
        setLoading(true);
        try {
            const data = await getBriefing(force);
            setBriefing(data.briefing);
        } catch (error) {
            console.error("Failed to fetch briefing:", error);
            setBriefing("Failed to load briefing. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load (uses cache if available)
        fetchBriefing(false);
    }, []);

    const handleRefresh = () => {
        fetchBriefing(true);
    };

    return (
        <Card className="bg-secondary/20 border-secondary">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5 text-secondary-foreground" />
                    오늘의 브리핑
                </CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={handleRefresh}
                    disabled={loading}
                    title="브리핑 새로고침"
                >
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {!briefing && !loading && (
                    <div className="flex flex-col items-center justify-center py-6 space-y-3 text-center">
                        <p className="text-muted-foreground text-sm">
                            오늘의 일정을 요약하고 중점 사항을 확인하세요.
                        </p>
                        <Button onClick={() => fetchBriefing(true)} className="bg-primary text-primary-foreground">
                            <Sparkles className="mr-2 h-4 w-4" />
                            브리핑 생성 시작
                        </Button>
                    </div>
                )}

                {loading && !briefing && (
                    <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>오늘의 브리핑을 생성하고 있습니다...</span>
                    </div>
                )}

                {briefing && (
                    <div className="relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-sm rounded">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        )}
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                            {briefing}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
