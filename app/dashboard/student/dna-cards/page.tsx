"use client";

import { motion } from "framer-motion";
import { Cpu, Dna, Lock } from "lucide-react";

export default function DNACardsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold font-sora">Skill DNA Cards</h1>
                <p className="text-text-secondary mt-1">Exportable, verifiable proof-of-skill cards built from your AI interviews.</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-secondary border border-border-color rounded-[2.5rem] p-12 text-center shadow-2xl space-y-6"
            >
                <div className="w-20 h-20 bg-accent-purple/10 rounded-full flex items-center justify-center mx-auto">
                    <Dna className="w-10 h-10 text-accent-purple" />
                </div>

                <h2 className="text-2xl font-bold font-sora">Coming Soon</h2>
                <p className="text-text-secondary max-w-md mx-auto leading-relaxed">
                    We are currently analyzing your interview history to generate cryptographically verifiable DNA signature blocks. These cards will soon be ready to embed into your portfolio or LinkedIn.
                </p>

                <div className="pt-8">
                    <div className="inline-flex items-center gap-2 bg-bg-card px-4 py-2 rounded-xl text-xs font-bold text-text-secondary border border-border-color">
                        <Lock className="w-4 h-4" /> Feature Locked
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
