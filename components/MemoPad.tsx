"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Trash2, StickyNote, Plus, X } from "lucide-react";

interface MemoItem {
    id: string;
    text: string;
    checked: boolean;
}

export function MemoPad() {
    const [items, setItems] = useState<MemoItem[]>([]);
    const [newItemText, setNewItemText] = useState("");
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        // Fetch memos from backend
        fetch('/api/memos/?uid=default_user')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setItems(data);
                }
            })
            .catch(err => console.error("Failed to fetch memos", err));
    }, []);

    const saveItems = (newItems: MemoItem[]) => {
        setItems(newItems);
        // Save to backend
        fetch('/api/memos/?uid=default_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: newItems })
        })
            .then(res => {
                if (res.ok) {
                    setIsSaved(true);
                    setTimeout(() => setIsSaved(false), 2000);
                }
            })
            .catch(err => console.error("Failed to save memos", err));
    };

    const handleAddItem = () => {
        if (!newItemText.trim()) return;
        const newItem: MemoItem = {
            id: Date.now().toString(),
            text: newItemText.trim(),
            checked: false,
        };
        saveItems([...items, newItem]);
        setNewItemText("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleAddItem();
        }
    };

    const toggleCheck = (id: string, checked: boolean) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, checked } : item
        );
        saveItems(newItems);
    };

    const deleteItem = (id: string) => {
        const newItems = items.filter(item => item.id !== id);
        saveItems(newItems);
    };

    const handleClear = () => {
        if (confirm("모든 메모를 삭제하시겠습니까?")) {
            saveItems([]);
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    간편 메모 (체크리스트)
                </CardTitle>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={handleClear} className="h-8 w-8 text-muted-foreground hover:text-destructive" title="모두 삭제">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col gap-2 p-3">

                {/* Input Area */}
                <div className="flex gap-2">
                    <Input
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="메모 입력 후 엔터..."
                        className="h-8 text-sm"
                    />
                    <Button size="sm" onClick={handleAddItem} className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* List Area */}
                <div className="flex-1 overflow-y-auto space-y-2 mt-2">
                    {items.length === 0 ? (
                        <div className="text-center text-xs text-muted-foreground py-4">
                            메모가 없습니다.
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 group hover:bg-muted/50 p-1.5 rounded-md transition-colors">
                                <Checkbox
                                    id={item.id}
                                    checked={item.checked}
                                    onCheckedChange={(checked) => toggleCheck(item.id, checked as boolean)}
                                />
                                <label
                                    htmlFor={item.id}
                                    className={`flex-1 text-sm cursor-pointer ${item.checked ? "text-muted-foreground line-through" : ""}`}
                                >
                                    {item.text}
                                </label>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteItem(item.id)}
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
            {isSaved && (
                <div className="absolute bottom-2 right-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded animate-fade-in pointer-events-none">
                    저장됨!
                </div>
            )}
        </Card>
    );
}
