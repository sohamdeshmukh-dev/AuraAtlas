"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getCollegeLogoUrl } from "@/lib/collegeList";

interface LeaderboardEntry {
    id: string;
    display_name?: string;
    unique_code: string;
    avatar_url?: string;
    entries: number;
    smile_points: number;
    isCurrentUser?: boolean;
    college_id?: string;
    college_name?: string;
    latest_mood?: string;
}

export default function Leaderboard() {
    const [friendsData, setFriendsData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchLeaderboard = useCallback(async (currentUserId: string | null) => {
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, display_name, unique_code, avatar_url, total_journals, smile_points, latest_mood, college_id, colleges(name)')
                .order('smile_points', { ascending: false })
                .limit(10);

            if (data) {
                setFriendsData(data.map((profile: any) => ({
                    ...profile,
                    entries: profile.total_journals || 0,
                    smile_points: profile.smile_points || 0,
                    isCurrentUser: currentUserId ? profile.id === currentUserId : false,
                    college_name: profile.colleges?.name,
                    latest_mood: profile.latest_mood || "neutral"
                })));
            }
        } catch (err) {
            console.error("Failed to fetch leaderboard", err);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        let currentUserId: string | null = null;

        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                currentUserId = user.id;
                setUserId(user.id);
            }
            await fetchLeaderboard(currentUserId);
        }
        init();

        const profileSubscription = supabase
            .channel('leaderboard-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles'
                },
                () => {
                    // Refetch totally on update so the order shifts correctly
                    fetchLeaderboard(currentUserId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(profileSubscription);
        };
    }, [supabase, fetchLeaderboard]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <div className="h-8 w-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (friendsData.length === 0) {
        return (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-slate-400 text-sm">
                    No users found!
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 mt-6">
            {/* 👇 ADD THIS .sort() FUNCTION RIGHT HERE 👇 */}
            {friendsData
                .sort((a, b) => b.entries - a.entries)
                .map((friend, index) => {

                    // The exact math: 30 Points per entry!
                    const calculatedPoints = friend.entries * 30;

                    return (
                        <div key={friend.id} className={`relative bg-black/40 backdrop-blur-md border p-4 rounded-2xl flex items-center justify-between shadow-lg transition-all ${friend.isCurrentUser ? "border-teal-500/50 shadow-teal-500/10" : "border-neutral-800"
                            }`}>

                            {/* Rank Badge (Gold for 1st, Silver for 2nd, Bronze for 3rd) */}
                            <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-lg ${index === 0 ? "bg-yellow-400 text-yellow-900 border-2 border-yellow-200" :
                                    index === 1 ? "bg-slate-300 text-slate-800 border-2 border-slate-100" :
                                        index === 2 ? "bg-amber-600 text-amber-100 border-2 border-amber-400" :
                                            "bg-neutral-800 text-neutral-400 border border-neutral-600"
                                }`}>
                                #{index + 1}
                            </div>

                            <div className="flex items-center gap-4 ml-4">
                                <div className="relative">
                                    <div className="h-12 w-12 shrink-0 rounded-full bg-slate-800 border border-purple-500/50 overflow-hidden flex items-center justify-center">
                                        {friend.avatar_url ? (
                                            <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg text-slate-500">👤</span>
                                        )}
                                    </div>
                                    {friend.college_id && (
                                        <img
                                            src={getCollegeLogoUrl(friend.college_id, 32)}
                                            alt="College"
                                            className="w-4 h-4 rounded-full absolute -bottom-0.5 -right-0.5 border border-slate-900 bg-white shadow-sm"
                                        />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-white font-bold text-lg truncate">
                                        {friend.isCurrentUser ? "You" : (friend.display_name || "Aura User")}
                                        <span className="text-neutral-500 text-sm font-normal ml-2">#{friend.unique_code}</span>
                                    </h3>
                                    <p className="text-xs text-neutral-400 tracking-wide uppercase mt-1 truncate">
                                        🎓 {friend.college_name || "Self-Study"} • {friend.entries} entries • Feeling: <span className="text-purple-400">{friend.latest_mood}</span>
                                    </p>
                                </div>
                            </div>

                            {/* The Gamified Smile Points */}
                            <div className="text-right">
                                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-rose-400 drop-shadow-md animate-fade-in">
                                    {calculatedPoints}
                                </div>
                                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
                                    Smile Points
                                </div>
                            </div>

                        </div>
                    );
                })}
        </div>
    );
}

