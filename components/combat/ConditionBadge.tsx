"use client";

import React, { useState } from 'react';
import { getConditionData } from '@/lib/data/conditions';

interface ConditionBadgeProps {
    condition: string | { id?: number; name?: string; description?: string };
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    className?: string;
}

export function ConditionBadge({
    condition,
    size = 'sm',
    showIcon = true,
    className = '',
}: ConditionBadgeProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const data = getConditionData(condition);

    const sizeStyles = {
        sm: 'text-[10px] px-2 py-0.5 gap-1',
        md: 'text-xs px-2.5 py-1 gap-1.5',
        lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
    };

    const severityBadgeStyles = {
        incapacitating: 'bg-red-950/70 text-red-200 border-red-600/70 shadow-[0_0_8px_rgba(220,38,38,0.25)]',
        debuff: 'bg-purple-950/60 text-purple-200 border-purple-700/60 shadow-[0_0_8px_rgba(147,51,234,0.2)]',
        buff: 'bg-emerald-950/60 text-emerald-200 border-emerald-600/60 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
    };

    const tooltipBorderColors = {
        incapacitating: 'border-red-600',
        debuff: 'border-[#a63a3a]',
        buff: 'border-emerald-600',
    };

    return (
        <div
            className="relative inline-block group"
            onClick={(e) => {
                e.stopPropagation();
                setIsMobileOpen(!isMobileOpen);
            }}
            onMouseLeave={() => setIsMobileOpen(false)}
        >
            {/* The Badge Chip */}
            <span
                className={`inline-flex items-center rounded border font-fira-sans font-semibold cursor-help transition-all duration-200 hover:brightness-125 select-none ${sizeStyles[size]} ${severityBadgeStyles[data.severity]} ${className}`}
            >
                {showIcon && <span>{data.icon}</span>}
                <span className="capitalize">{data.name}</span>
            </span>

            {/* Dashboard-Style Hover/Tap Tooltip Card */}
            <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 sm:w-80 bg-[#181a21] bg-[radial-gradient(ellipse_at_top,#1f232e_0%,#15171e_100%)] border ${tooltipBorderColors[data.severity]} rounded-lg p-3.5 font-lora shadow-[0_10px_30px_rgba(0,0,0,0.85)] z-50 text-left transition-all duration-200 ${
                    isMobileOpen
                        ? 'block opacity-100 translate-y-0 pointer-events-auto'
                        : 'hidden md:block md:opacity-0 md:-translate-y-2 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:pointer-events-auto'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Indicator Arrow */}
                <div
                    className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#181a21] border-t border-l ${tooltipBorderColors[data.severity]} rotate-45`}
                />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#c5a059]/20">
                        <div className="flex items-center gap-1.5">
                            <span className="text-base">{data.icon}</span>
                            <h4 className="font-cinzel-decorative font-bold text-xs tracking-wider text-[#c5a059]">
                                {data.header}
                            </h4>
                        </div>
                        <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold font-fira-sans ${
                                data.severity === 'incapacitating'
                                    ? 'bg-red-950 text-red-300 border border-red-800'
                                    : data.severity === 'buff'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-purple-950 text-purple-300 border border-purple-800'
                            }`}
                        >
                            {data.severity === 'incapacitating' ? 'Action Lock' : data.severity}
                        </span>
                    </div>

                    {/* Official Description */}
                    <p className="text-xs text-[#d1cdb8] leading-relaxed mb-2.5">
                        {data.description}
                    </p>

                    {/* Mechanical Rules Bullets */}
                    {data.rules.length > 0 && (
                        <div className="bg-[#0c0d12]/70 rounded p-2 border border-stone-800/80 space-y-1">
                            <p className="text-[10px] uppercase font-bold tracking-wider text-[#e0bc75] mb-1 font-cinzel">
                                Mechanical Effects:
                            </p>
                            {data.rules.map((rule, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                                    <span className="text-[#c5a059] font-bold text-[10px] mt-0.5">✦</span>
                                    <span className="leading-snug">{rule}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ConditionBadge;
