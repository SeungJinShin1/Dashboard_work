"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, Calendar, Coffee } from "lucide-react";
import { useState } from "react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const routes = [
        {
            href: "/",
            label: "대시보드",
            icon: LayoutDashboard,
            active: pathname === "/",
        },
        {
            href: "/schedule",
            label: "일정 관리",
            icon: Calendar,
            active: pathname === "/schedule",
        },
    ];

    return (
        <>
            {/* Mobile Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" className="lg:hidden fixed top-4 left-4 z-40">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 bg-sidebar border-sidebar-border w-72">
                    <SidebarContent routes={routes} pathname={pathname} setIsOpen={setIsOpen} />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className={cn("hidden lg:flex h-full w-72 flex-col fixed inset-y-0 z-30", className)}>
                <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
                    <SidebarContent routes={routes} pathname={pathname} />
                </div>
            </div>
        </>
    );
}

function SidebarContent({ routes, pathname, setIsOpen }: { routes: any[], pathname: string, setIsOpen?: (open: boolean) => void }) {
    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-sidebar text-sidebar-foreground">
            <div className="px-6 py-2">
                <h1 className="text-2xl font-bold tracking-tight text-sidebar-primary">
                    HT-Dashboard
                </h1>
                <p className="text-sm text-sidebar-foreground/70">AI 교무 비서</p>
            </div>
            <div className="px-3 py-2 flex-1">
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setIsOpen?.(false)}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                route.active
                                    ? "text-white bg-white/10"
                                    : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.active ? "text-sidebar-primary" : "text-zinc-400 group-hover:text-white")} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-6 py-4 border-t border-sidebar-border">
                <div className="flex items-center gap-x-4">
                    <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
                        교
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-medium text-white">교무부장님</p>
                        <p className="text-xs text-zinc-400">학교 관리자</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
