"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    CHANGELOG_DATA,
    CATEGORY_LABELS,
    ChangelogCategory,
    ReleaseVersion
} from "@/lib/data/changelog";

const TABS: { id: string; label: string; icon: string; category?: ChangelogCategory }[] = [
    { id: "all", label: "All Updates", icon: "📜" },
    { id: "feature", label: "Features", icon: "✨", category: "feature" },
    { id: "combat", label: "Combat", icon: "⚔️", category: "combat" },
    { id: "character", label: "Characters", icon: "👤", category: "character" },
    { id: "spell", label: "Spells", icon: "🔮", category: "spell" },
    { id: "fix", label: "Bug Fixes", icon: "🐛", category: "fix" },
];

export default function ChangelogPage() {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredReleases = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        return CHANGELOG_DATA.map((release) => {
            const filteredItems = release.items.filter((item) => {
                // Category filter
                if (selectedTab !== "all") {
                    const tabObj = TABS.find((t) => t.id === selectedTab);
                    if (tabObj?.category && item.category !== tabObj.category) {
                        return false;
                    }
                }

                // Search query filter
                if (!query) return true;

                const matchTitle = item.title.toLowerCase().includes(query);
                const matchDesc = item.description.toLowerCase().includes(query);
                const matchDetails = item.details?.some((d) => d.toLowerCase().includes(query));
                const matchCategory = item.category.toLowerCase().includes(query);

                return matchTitle || matchDesc || matchDetails || matchCategory;
            });

            return {
                ...release,
                items: filteredItems,
            };
        }).filter((release) => release.items.length > 0);
    }, [selectedTab, searchQuery]);

    const totalUpdatesCount = useMemo(() => {
        return CHANGELOG_DATA.reduce((acc, rel) => acc + rel.items.length, 0);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white py-8 px-4">
            <div className="container mx-auto max-w-5xl">
                {/* Header & Breadcrumb */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                            <button
                                onClick={() => router.push("/")}
                                className="hover:text-white transition-colors"
                            >
                                Home
                            </button>
                            <span>/</span>
                            <span className="text-white font-medium">Updates & Changelog</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            App Updates & Changelog
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm sm:text-base">
                            Track the latest features, combat mechanics improvements, and rule fixes for 5e Campaign Manager.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                        <Button
                            onClick={() => router.push("/characters")}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm"
                        >
                            My Characters
                        </Button>
                        <Button
                            onClick={() => router.push("/combat")}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm"
                        >
                            Combat Simulation
                        </Button>
                    </div>
                </div>

                {/* Release Highlights Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur">
                        <div className="text-xs text-slate-400 font-medium">Current Version</div>
                        <div className="text-xl font-bold text-amber-400 mt-0.5 flex items-center gap-1.5">
                            {CHANGELOG_DATA[0]?.version || "v1.6.0"}
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur">
                        <div className="text-xs text-slate-400 font-medium">Total Releases</div>
                        <div className="text-xl font-bold text-white mt-0.5">{CHANGELOG_DATA.length}</div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur">
                        <div className="text-xs text-slate-400 font-medium">Recorded Updates</div>
                        <div className="text-xl font-bold text-purple-400 mt-0.5">{totalUpdatesCount}</div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur">
                        <div className="text-xs text-slate-400 font-medium">Ruleset Support</div>
                        <div className="text-xl font-bold text-blue-400 mt-0.5">5e SRD 5.1 / 5.2</div>
                    </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 mb-8 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                        {/* Tab pills */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {TABS.map((tab) => {
                                const isActive = selectedTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedTab(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                                            isActive
                                                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                                                : "bg-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white"
                                        }`}
                                    >
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search Input */}
                        <div className="relative sm:w-64">
                            <Input
                                type="text"
                                placeholder="Search updates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-900 border-slate-700 text-white placeholder-slate-400 text-sm pl-8 pr-8"
                            />
                            <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Releases Timeline */}
                {filteredReleases.length === 0 ? (
                    <Card className="bg-slate-800/60 border-slate-700 text-center py-12">
                        <CardHeader>
                            <div className="text-4xl mb-2">🔍</div>
                            <CardTitle className="text-white">No updates found</CardTitle>
                            <CardDescription className="text-slate-400">
                                No release notes match your current search or category filter.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedTab("all");
                                    setSearchQuery("");
                                }}
                                className="border-slate-600 text-slate-300"
                            >
                                Clear Filters
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 sm:before:left-5 before:w-0.5 before:bg-slate-800 before:z-0">
                        {filteredReleases.map((release) => (
                            <div key={release.version} className="relative z-10 pl-9 sm:pl-12">
                                {/* Version timeline dot */}
                                <div className="absolute left-0 top-4 w-7 sm:w-10 h-7 sm:h-10 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center shadow-lg shadow-purple-950">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                                </div>

                                <Card className="bg-slate-800/95 border-slate-700 hover:border-slate-600 transition-all shadow-xl">
                                    <CardHeader className="pb-3 border-b border-slate-700/60">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <h2 className="text-2xl font-bold text-white tracking-wide">
                                                    {release.version}
                                                </h2>
                                                {release.tag && (
                                                    <Badge
                                                        className={
                                                            release.tag === "Latest"
                                                                ? "bg-emerald-900/60 text-emerald-300 border-emerald-600"
                                                                : "bg-purple-900/60 text-purple-300 border-purple-600"
                                                        }
                                                    >
                                                        {release.tag}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {release.date}
                                            </span>
                                        </div>
                                        <div className="text-base font-semibold text-slate-200 mt-1">
                                            {release.title}
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                            {release.summary}
                                        </p>
                                    </CardHeader>

                                    <CardContent className="pt-4 space-y-4">
                                        {release.items.map((item) => {
                                            const catMeta = CATEGORY_LABELS[item.category];
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="bg-slate-900/70 border border-slate-700/70 rounded-lg p-3.5 hover:border-slate-600 transition-colors"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                                        <div className="text-base font-semibold text-white">
                                                            {item.title}
                                                        </div>
                                                        <Badge variant="outline" className={`text-xs ${catMeta.badgeClass}`}>
                                                            <span className="mr-1">{catMeta.icon}</span>
                                                            {catMeta.label}
                                                        </Badge>
                                                    </div>

                                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                                        {item.description}
                                                    </p>

                                                    {item.details && item.details.length > 0 && (
                                                        <ul className="mt-2 space-y-1 text-xs text-slate-400 list-disc list-inside">
                                                            {item.details.map((detail, idx) => (
                                                                <li key={idx} className="leading-normal">
                                                                    {detail}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
