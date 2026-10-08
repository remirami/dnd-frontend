"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
    const [isHovered, setIsHovered] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState<{
        top: number;
        left: number;
        arrowLeft: number;
        placement: 'bottom' | 'top';
        width: number;
    } | null>(null);

    const badgeRef = useRef<HTMLSpanElement>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    useEffect(() => {
        setMounted(true);
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    const updatePosition = useCallback(() => {
        if (!badgeRef.current) return;
        const rect = badgeRef.current.getBoundingClientRect();

        // If badge is off screen, hide tooltip
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
            setCoords(null);
            return;
        }

        const tooltipWidth = Math.min(320, window.innerWidth - 24);
        const tooltipEstHeight = 220;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        let placement: 'bottom' | 'top' = 'bottom';
        let top = rect.bottom + 8;

        if (spaceBelow < tooltipEstHeight + 16 && spaceAbove > spaceBelow) {
            placement = 'top';
            top = rect.top - 8;
        }

        const badgeCenter = rect.left + rect.width / 2;
        let left = badgeCenter - tooltipWidth / 2;
        const minLeft = 12;
        const maxLeft = window.innerWidth - tooltipWidth - 12;
        left = Math.max(minLeft, Math.min(left, maxLeft));

        const arrowLeft = Math.max(16, Math.min(badgeCenter - left, tooltipWidth - 16));

        setCoords({
            top,
            left,
            arrowLeft,
            placement,
            width: tooltipWidth,
        });
    }, []);

    const isOpen = isHovered || isMobileOpen;

    useEffect(() => {
        if (!isOpen) return;
        updatePosition();

        const handleScroll = () => updatePosition();
        const handleResize = () => updatePosition();

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen, updatePosition]);

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 120);
    };

    const handleBadgeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMobileOpen((prev) => !prev);
    };

    return (
        <div className="relative inline-block">
            {/* The Badge Chip */}
            <span
                ref={badgeRef}
                onClick={handleBadgeClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`inline-flex items-center rounded border font-fira-sans font-semibold cursor-help transition-all duration-200 hover:brightness-125 select-none ${sizeStyles[size]} ${severityBadgeStyles[data.severity]} ${className}`}
            >
                {showIcon && <span>{data.icon}</span>}
                <span className="capitalize">{data.name}</span>
            </span>

            {/* Portal-Rendered Tooltip: Immune to overflow clipping */}
            {mounted && isOpen && coords && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        transform: coords.placement === 'top' ? 'translateY(-100%)' : 'none',
                        zIndex: 99999,
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => e.stopPropagation()}
                    className={`bg-[#181a21] bg-[radial-gradient(ellipse_at_top,#1f232e_0%,#15171e_100%)] border ${tooltipBorderColors[data.severity]} rounded-lg p-3.5 font-lora shadow-[0_12px_40px_rgba(0,0,0,0.95)] text-left animate-in fade-in zoom-in-95 duration-150 select-none`}
                >
                    {/* Indicator Arrow */}
                    <div
                        style={{ left: coords.arrowLeft }}
                        className={`absolute w-3 h-3 bg-[#181a21] ${
                            coords.placement === 'top'
                                ? `-bottom-1.5 border-b border-r ${tooltipBorderColors[data.severity]} rotate-45`
                                : `-top-1.5 border-t border-l ${tooltipBorderColors[data.severity]} rotate-45`
                        } -translate-x-1/2`}
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
                </div>,
                document.body
            )}
        </div>
    );
}

export default ConditionBadge;
