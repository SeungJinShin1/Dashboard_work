"use client";

import { MorningBriefing } from "@/components/MorningBriefing";
import { MemoPad } from "@/components/MemoPad";
import { TodoList } from "@/components/TodoList";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">대시보드</h1>
        <p className="text-muted-foreground">환영합니다, 교무부장님.</p>
      </div>

      {/* Feature 4: Morning Briefing & Memo */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <MorningBriefing />
        </div>
        <div className="h-full">
          <MemoPad />
        </div>
      </section>

      {/* Feature 1: Quick Task Entry */}
      <section className="space-y-4">
        <TodoList />
      </section>
    </div>
  );
}
