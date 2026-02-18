"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { analyzeTask, createTask, getTasks, updateTask } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Task {
    id: string;
    content: string;
    due_date?: string;
    priority: "High" | "Medium" | "Low";
    is_completed: boolean;
}

export function TodoList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isanalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const data = await getTasks();
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!inputValue.trim()) return;
        setIsAnalyzing(true);
        try {
            // 1. Analyze with AI
            const analysis = await analyzeTask(inputValue);

            // 2. Create Task in DB
            const newTask = await createTask(analysis);

            // 3. Update UI
            setTasks([newTask, ...tasks]);
            setInputValue("");
        } catch (error) {
            console.error("Error adding task:", error);
            alert("Failed to add task. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleAdd();
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        // Optimistic Update
        setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));

        try {
            await updateTask(id, { is_completed: !currentStatus });
        } catch (error) {
            console.error("Failed to toggle task:", error);
            // Revert on error
            setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: currentStatus } : t));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("이 할 일을 삭제하시겠습니까?")) return;

        // Optimistic Update
        setTasks(tasks.filter(t => t.id !== id));

        try {
            await updateTask(id, { is_deleted: true });
        } catch (error) {
            console.error("Failed to delete task:", error);
            fetchTasks(); // Reload to sync
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "High": return "bg-red-100 text-red-800 border-red-200";
            case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "Low": return "bg-green-100 text-green-800 border-green-200";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-primary">스마트 할 일 목록</h2>
                <p className="text-muted-foreground">자연어로 입력하세요 – AI가 날짜와 중요도를 자동으로 추출합니다.</p>
            </div>

            <div className="flex gap-2">
                <Input
                    placeholder="예: '이번 주 금요일까지 교육청 보고서 제출 긴급'"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isanalyzing}
                    className="bg-white"
                />
                <Button onClick={handleAdd} disabled={isanalyzing || !inputValue.trim()}>
                    {isanalyzing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            AI 분석 중...
                        </>
                    ) : (
                        <>
                            <Plus className="mr-2 h-4 w-4" />
                            할 일 추가
                        </>
                    )}
                </Button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-10 text-muted-foreground">할 일을 불러오는 중...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-dashed border-2 rounded-lg">
                        아직 할 일이 없습니다. 위에서 새로운 할 일을 추가해보세요!
                    </div>
                ) : (
                    tasks.map((task) => (
                        <Card key={task.id} className={cn("transition-all", task.is_completed ? "opacity-60 bg-muted/50" : "bg-white")}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <Checkbox
                                    checked={task.is_completed}
                                    onCheckedChange={() => handleToggle(task.id, task.is_completed)}
                                />

                                <div className="flex-1 min-w-0">
                                    <p className={cn("font-medium truncate", task.is_completed && "line-through text-muted-foreground")}>
                                        {task.content}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        {task.due_date && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {task.due_date}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => {
                                                const priorities = ["High", "Medium", "Low"];
                                                const currentIdx = priorities.indexOf(task.priority);
                                                const nextPriority = priorities[(currentIdx + 1) % 3] as "High" | "Medium" | "Low";

                                                // Optimistic update
                                                setTasks(tasks.map(t => t.id === task.id ? { ...t, priority: nextPriority } : t));
                                                updateTask(task.id, { priority: nextPriority }).catch(err => {
                                                    console.error("Failed to update priority", err);
                                                    setTasks(tasks); // Revert? Ideally fetchTasks()
                                                });
                                            }}
                                            className={cn("px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-colors hover:opacity-80 cursor-pointer", getPriorityColor(task.priority))}
                                        >
                                            {task.priority}
                                        </button>
                                    </div>
                                </div>

                                <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
