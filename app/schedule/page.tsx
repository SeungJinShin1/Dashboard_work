"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Upload, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadSchedule, getEvents } from "@/lib/api";

interface Event {
    id?: string;
    title: string;
    date: string;
    type: "official" | "trip" | "personal";
    description?: string;
    time?: string;
    location?: string;
    participants?: string;
    manager?: string;
    note?: string;
}

export default function SchedulePage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isUploading, setIsUploading] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const data = await getEvents();
            setEvents(data);

            // UX Enhancement: If there are events, but none in current view, jump to the nearest event
            if (data && data.length > 0) {
                const hasEventInCurrentMonth = data.some((e: Event) => isSameMonth(new Date(e.date), currentDate));
                if (!hasEventInCurrentMonth) {
                    // Sort events by date
                    const sorted = [...data].sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    // Find first event after today, or just first event
                    const today = new Date();
                    const futureEvent = sorted.find((e: Event) => new Date(e.date) >= today);
                    const targetEvent = futureEvent || sorted[sorted.length - 1]; // Closest future, or last past

                    if (targetEvent) {
                        setCurrentDate(new Date(targetEvent.date));
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch events:", error);
        }
    };

    // Calendar Generation Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const data = await uploadSchedule(file);
            alert("일정이 성공적으로 업로드되었습니다.");

            // Demo Mode support: Use returned events directly if available
            if (data.events && Array.isArray(data.events) && data.events.length > 0) {
                setEvents(data.events);
                // Jump to the month of the first event
                const firstEventDate = new Date(data.events[0].date);
                if (!isNaN(firstEventDate.getTime())) {
                    setCurrentDate(firstEventDate);
                }
            } else {
                fetchEvents(); // Fallback to DB fetch
            }
        } catch (error) {
            console.error("Upload failed:", error);
            alert("일정 업로드에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsUploading(false);
            e.target.value = ""; // Reset input
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm("이 일정을 삭제하시겠습니까? (삭제 시 복구할 수 없습니다)")) return;

        try {
            // Using ID if available, otherwise we might have issues if ID is missing in old data
            if (!eventId) {
                alert("이벤트 ID가 없어 삭제할 수 없습니다.");
                return;
            }

            const res = await fetch(`/api/schedule/${eventId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Remove from state directly for immediate feedback
                setEvents(prev => prev.filter(e => e['id'] !== eventId && e.id !== eventId)); // Handle potential type mismatch if field checks
                alert("일정이 삭제되었습니다.");
            } else {
                alert("삭제 실패");
            }
        } catch (e) {
            console.error("Delete failed", e);
            alert("서버 오류로 삭제하지 못했습니다.");
        }
    };

    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(new Date(event.date), day));
    };

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case "official": return "bg-primary/10 text-primary";
            case "trip": return "bg-orange-100 text-orange-800";
            case "personal": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">일정 관리</h1>
                    <p className="text-muted-foreground">학교 학사일정 및 개인 일정을 관리합니다.</p>
                </div>

                {/* Excel Upload Button */}
                <div className="relative">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="excel-upload"
                        disabled={isUploading}
                    />
                    <label htmlFor="excel-upload">
                        <Button variant="outline" className="cursor-pointer bg-white" asChild disabled={isUploading}>
                            <span>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                엑셀 일정 업로드
                            </span>
                        </Button>
                    </label>
                </div>
            </div>

            {/* Calendar Control */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
                <Button variant="ghost" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-semibold">
                    {format(currentDate, "yyyy년 M월", { locale: ko })}
                </h2>
                <Button variant="ghost" onClick={handleNextMonth}>
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <Card className="bg-white">
                <CardContent className="p-0">
                    <div className="grid grid-cols-7 border-b">
                        {weekDays.map((day) => (
                            <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0 bg-muted/30">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-[120px]">
                        {calendarDays.map((day, dayIdx) => {
                            const dayEvents = getEventsForDay(day);
                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "p-2 border-b border-r last:border-r-0 relative transition-colors hover:bg-muted/10 overflow-y-auto",
                                        !isSameMonth(day, monthStart) && "bg-muted/5 text-muted-foreground/50",
                                        isToday(day) && "bg-secondary/10"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <span
                                            className={cn(
                                                "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                                                isToday(day) && "bg-secondary text-secondary-foreground"
                                            )}
                                        >
                                            {format(day, "d")}
                                        </span>
                                    </div>
                                    <div className="mt-1 space-y-1">
                                        {dayEvents.map((ev, idx) => (
                                            <HoverCard key={idx}>
                                                <HoverCardTrigger asChild>
                                                    <div className={cn("text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80", getEventTypeColor(ev.type))}>
                                                        {ev.title}
                                                    </div>
                                                </HoverCardTrigger>
                                                <HoverCardContent className="w-80 z-50 bg-white shadow-lg border rounded-md p-4">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="text-sm font-semibold mb-2">{ev.title}</h4>
                                                            <div className="text-xs text-muted-foreground grid grid-cols-[60px_1fr] gap-1">
                                                                <span className="font-medium">일시:</span>
                                                                <span>{ev.date} {ev.time && ev.time !== "All Day" ? ev.time : ""}</span>

                                                                {ev.location && (
                                                                    <>
                                                                        <span className="font-medium">장소:</span>
                                                                        <span>{ev.location}</span>
                                                                    </>
                                                                )}
                                                                {ev.participants && (
                                                                    <>
                                                                        <span className="font-medium">대상:</span>
                                                                        <span>{ev.participants}</span>
                                                                    </>
                                                                )}
                                                                {ev.manager && (
                                                                    <>
                                                                        <span className="font-medium">담당:</span>
                                                                        <span>{ev.manager}</span>
                                                                    </>
                                                                )}
                                                                {ev.note && (
                                                                    <>
                                                                        <span className="font-medium">비고:</span>
                                                                        <span>{ev.note}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="pt-2 border-t flex justify-end">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() => {
                                                                    if (ev.id) handleDeleteEvent(ev.id);
                                                                    else alert("ID가 없어 삭제할 수 없습니다.");
                                                                }}
                                                            >
                                                                <Trash2 className="h-3 w-3 mr-1" />
                                                                삭제
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </HoverCardContent>
                                            </HoverCard>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
