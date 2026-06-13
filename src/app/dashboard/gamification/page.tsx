'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BADGE_CONFIG } from '@/lib/utils'

export default function GamificationPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const [{ data: p }, { data: a }, { data: lb }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('achievements').select('*').eq('user_id', session.user.id),
      supabase.from('profiles').select('full_name, xp_points, streak_days').order('xp_points', { ascending: false }).limit(10),
    ])
    setProfile(p)
    setAchievements(a ?? [])
    setLeaderboard(lb ?? [])
  }

  const earnedKeys = achievements.map(a => a.badge_key)
  const level = Math.floor((profile?.xp_points ?? 0) / 500) + 1
  const xpInLevel = (profile?.xp_points ?? 0) % 500
  const xpProgress = (xpInLevel / 500) * 100

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Achievements & Gamification</h1>

      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center text-2xl font-bold text-brand">
            {level}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Level {level}</p>
            <p className="text-sm text-gray-500 mb-2">{xpInLevel} / 500 XP to next level</p>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand">{profile?.xp_points ?? 0}</p>
            <p className="text-xs text-gray-500">Total XP</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xl font-bold text-orange-500">🔥 {profile?.streak_days ?? 0}</p>
            <p className="text-xs text-gray-500">Day Streak</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-purple-600">{achievements.length}</p>
            <p className="text-xs text-gray-500">Badges Earned</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">{Object.keys(BADGE_CONFIG).length}</p>
            <p className="text-xs text-gray-500">Total Badges</p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Badges</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(BADGE_CONFIG).map(([key, badge]) => {
            const earned = earnedKeys.includes(key)
            return (
              <div key={key} className={`p-4 rounded-xl border-2 transition-all ${earned ? 'border-brand/20 bg-brand/5' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                <div className="text-3xl mb-2">{badge.icon}</div>
                <p className={`text-sm font-semibold ${earned ? 'text-gray-900' : 'text-gray-400'}`}>{badge.label}</p>
                {earned && <span className={`badge mt-1 ${badge.color}`}>Earned</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">🏆 Leaderboard</h2>
        <div className="space-y-2">
          {leaderboard.map((user, i) => (
            <div key={i} className={`flex items-center gap-4 p-3 rounded-lg ${user.full_name === profile?.full_name ? 'bg-brand/5 border border-brand/20' : 'bg-gray-50'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-400 text-orange-900' : 'bg-gray-100 text-gray-600'}`}>
                {i + 1}
              </span>
              <p className="flex-1 text-sm font-medium text-gray-900">{user.full_name}</p>
              <div className="text-right">
                <p className="text-sm font-bold text-brand">{user.xp_points} XP</p>
                <p className="text-xs text-gray-400">🔥 {user.streak_days}d</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
