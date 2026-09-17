"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import CharacterCreationWizard from "./CharacterCreationWizard";

import { Suspense } from "react";

export default function CreateCharacterPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return null; // Or a loading spinner
    }

    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#0c0d12] flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
                    <p className="font-lora text-sm text-[#d1cdb8]/70 italic">Preparing Character Creation Forge...</p>
                </div>
            }
        >
            <CharacterCreationWizard />
        </Suspense>
    );
}
