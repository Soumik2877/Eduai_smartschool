'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database.types'

interface SettingsFormProps {
  profile: any
  parentProfile?: { full_name: string; email: string } | null
  childrenList?: { id: string; full_name: string; email: string }[]
  classesList?: { id: string; name: string }[]
  teacherClasses?: any[]
}

export default function SettingsForm({ 
  profile, 
  parentProfile: initialParent, 
  childrenList = [],
  classesList = [],
  teacherClasses = []
}: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // Profile fields state
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [classId, setClassId] = useState(profile.class_id || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' })

  // Parent linking state
  const [parentEmail, setParentEmail] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkMessage, setLinkMessage] = useState({ text: '', type: '' })
  const [currentParent, setCurrentParent] = useState(initialParent)

  // Child linking state (for parents)
  const [childEmail, setChildEmail] = useState('')
  const [childLinkLoading, setChildLinkLoading] = useState(false)
  const [childLinkMsg, setChildLinkMsg] = useState({ text: '', type: '' })
  const [children, setChildren] = useState<any[]>(childrenList)

  // Teacher class mappings state
  const [activeTC, setActiveTC] = useState<any[]>(teacherClasses)
  const [newClassId, setNewClassId] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [tcLoading, setTcLoading] = useState(false)
  const [tcMsg, setTcMsg] = useState({ text: '', type: '' })

  // Handle Profile Update
  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMessage({ text: '', type: '' })

    try {
      const payload: any = { full_name: fullName }
      if (profile.role === 'student') {
        payload.class_id = classId || null
      }

      const { error } = await (supabase.from('profiles') as any)
        .update(payload)
        .eq('id', profile.id)

      if (error) throw error

      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' })
      router.refresh()
    } catch (err: any) {
      setProfileMessage({ text: err.message || 'Failed to update profile.', type: 'error' })
    } finally {
      setProfileSaving(false)
    }
  }

  // Handle Parent Link
  async function handleParentLink(e: React.FormEvent) {
    e.preventDefault()
    if (!parentEmail.trim()) return

    setLinkLoading(true)
    setLinkMessage({ text: '', type: '' })

    try {
      const res = await fetch('/api/profile/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.')
      }

      setLinkMessage({ text: `Successfully linked to ${data.parentName}!`, type: 'success' })
      setCurrentParent({ full_name: data.parentName, email: parentEmail })
      setParentEmail('')
      router.refresh()
    } catch (err: any) {
      setLinkMessage({ text: err.message, type: 'error' })
    } finally {
      setLinkLoading(false)
    }
  }

  // Handle Parent Unlink
  async function handleParentUnlink() {
    if (!confirm('Are you sure you want to unlink your parent account? they will no longer see your dashboard.')) {
      return
    }

    setLinkLoading(true)
    setLinkMessage({ text: '', type: '' })

    try {
      const res = await fetch('/api/profile/link', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.')
      }

      setLinkMessage({ text: 'Successfully unlinked parent account.', type: 'success' })
      setCurrentParent(null)
      router.refresh()
    } catch (err: any) {
      setLinkMessage({ text: err.message, type: 'error' })
    } finally {
      setLinkLoading(false)
    }
  }

  // Handle Teacher Class Add
  async function handleAddTC(e: React.FormEvent) {
    e.preventDefault()
    if (!newClassId || !newSubject.trim()) return

    setTcLoading(true)
    setTcMsg({ text: '', type: '' })

    try {
      const { data, error } = await (supabase.from('teacher_classes') as any)
        .insert({
          teacher_id: profile.id,
          class_id: newClassId,
          subject_name: newSubject.trim()
        })
        .select('*, classes(name)')
        .single()

      if (error) throw error

      setActiveTC(p => [...p, data])
      setNewClassId('')
      setNewSubject('')
      setTcMsg({ text: 'Class and subject added successfully!', type: 'success' })
      router.refresh()
    } catch (err: any) {
      setTcMsg({ text: err.message || 'Failed to add class mapping.', type: 'error' })
    } finally {
      setTcLoading(false)
    }
  }

  // Handle Teacher Class Remove
  async function handleRemoveTC(id: string) {
    if (!confirm('Are you sure you want to remove this class and subject association?')) return

    try {
      const { error } = await (supabase.from('teacher_classes') as any)
        .delete()
        .eq('id', id)

      if (error) throw error

      setActiveTC(p => p.filter(x => x.id !== id))
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to remove class mapping.')
    }
  }

  // Handle Child Link (for parents)
  async function handleChildLink(e: React.FormEvent) {
    e.preventDefault()
    if (!childEmail.trim()) return

    setChildLinkLoading(true)
    setChildLinkMsg({ text: '', type: '' })

    try {
      const res = await fetch('/api/profile/link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.')
      }

      setChildLinkMsg({ text: `Successfully linked ${data.childName}!`, type: 'success' })
      setChildren(p => [...p, { id: data.childId, full_name: data.childName, email: childEmail }])
      setChildEmail('')
      router.refresh()
    } catch (err: any) {
      setChildLinkMsg({ text: err.message, type: 'error' })
    } finally {
      setChildLinkLoading(false)
    }
  }

  // Handle Child Unlink (for parents)
  async function handleChildUnlink(childId: string, childName: string) {
    if (!confirm(`Are you sure you want to unlink ${childName}? They will no longer be visible on your portal.`)) {
      return
    }

    setChildLinkLoading(true)
    setChildLinkMsg({ text: '', type: '' })

    try {
      const res = await fetch('/api/profile/link-child', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.')
      }

      setChildLinkMsg({ text: `Successfully unlinked ${childName}.`, type: 'success' })
      setChildren(p => p.filter(c => c.id !== childId))
      router.refresh()
    } catch (err: any) {
      setChildLinkMsg({ text: err.message, type: 'error' })
    } finally {
      setChildLinkLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account profile and linkage connections.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* PROFILE CARD */}
        <div className="card p-5 md:col-span-2 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg border-b pb-3 border-gray-50">Profile Details</h2>
          
          <form onSubmit={handleProfileSave} className="space-y-4">
            {profileMessage.text && (
              <div className={`text-xs px-3 py-2 rounded-lg font-medium ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'}`}>
                {profileMessage.text}
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input mt-1"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Email Address (Read-only)</label>
                <input
                  type="text"
                  className="input mt-1 bg-gray-50 text-gray-400 cursor-not-allowed"
                  value={profile.email}
                  disabled
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Account Role (Read-only)</label>
                <input
                  type="text"
                  className="input mt-1 bg-gray-50 text-gray-400 cursor-not-allowed capitalize"
                  value={profile.role}
                  disabled
                />
              </div>

              {profile.role === 'student' && (
                <div>
                  <label className="label">Class / Grade</label>
                  <select
                    className="input mt-1 bg-white cursor-pointer font-semibold text-gray-750"
                    value={classId}
                    onChange={e => setClassId(e.target.value)}
                  >
                    <option value="">-- No Class Selected --</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="btn-primary"
              >
                {profileSaving ? 'Saving Changes…' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* ROLE SPECIFIC CARD (Parent Link or Children List or Teacher School Info) */}
        <div className="space-y-6">
          
          {/* STUDENT: Parent Linking UI */}
          {profile.role === 'student' && (
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-gray-900 text-lg border-b pb-3 border-gray-50">Parent Link</h2>
              
              {linkMessage.text && (
                <div className={`text-xs px-3 py-2 rounded-lg font-medium ${linkMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'}`}>
                  {linkMessage.text}
                </div>
              )}

              {currentParent ? (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                    <p className="text-gray-400 uppercase font-bold tracking-wider">Linked Parent</p>
                    <p className="font-bold text-gray-800 text-sm">{currentParent.full_name}</p>
                    <p className="text-gray-500">{currentParent.email}</p>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    This parent is connected to your account and can monitor your study hours, attendance, assignments, and test outcomes.
                  </p>

                  <button
                    type="button"
                    onClick={handleParentUnlink}
                    disabled={linkLoading}
                    className="w-full text-center px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {linkLoading ? 'Unlinking…' : 'Unlink Parent Account'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleParentLink} className="space-y-4">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Connect a parent to allow them to view your focus progress, attendance, homework, and quiz marks.
                  </p>

                  <div>
                    <label className="label">Parent's Account Email</label>
                    <input
                      type="email"
                      required
                      placeholder="parent@example.com"
                      className="input mt-1"
                      value={parentEmail}
                      onChange={e => setParentEmail(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={linkLoading}
                    className="w-full btn-primary justify-center text-xs py-2"
                  >
                    {linkLoading ? 'Linking Account…' : 'Link Parent'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* PARENT: Child Linking & Linked List UI */}
          {profile.role === 'parent' && (
            <div className="card p-5 space-y-5">
              <h2 className="font-bold text-gray-900 text-lg border-b pb-3 border-slate-100">Linked Children</h2>
              
              {childLinkMsg.text && (
                <div className={`text-xs px-3.5 py-2.5 rounded-xl font-semibold border ${childLinkMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-700'} animate-in fade-in`}>
                  {childLinkMsg.text}
                </div>
              )}

              {/* Link Child Form */}
              <form onSubmit={handleChildLink} className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60">
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Link Child Account</p>
                <div className="space-y-2.5">
                  <div>
                    <label className="label text-[10px]">Student Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="student@example.com"
                      className="input text-xs py-1.5"
                      value={childEmail}
                      onChange={e => setChildEmail(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={childLinkLoading}
                    className="w-full btn-primary text-xs justify-center py-2"
                  >
                    {childLinkLoading ? 'Linking...' : 'Connect Student'}
                  </button>
                </div>
              </form>

              {/* List of Active linked children */}
              <div className="space-y-2.5">
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Active Links</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {children.map(child => (
                    <div key={child.id} className="flex justify-between items-center p-3.5 bg-slate-50/30 border border-slate-100 rounded-2xl text-xs hover:border-slate-200 transition-colors">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800">{child.full_name}</span>
                        <span className="block text-[10px] text-gray-400 font-medium">{child.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChildUnlink(child.id, child.full_name)}
                        className="text-gray-400 hover:text-rose-650 font-bold transition-colors px-1 text-base leading-none"
                        title="Remove link"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {children.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs italic bg-slate-50/10 rounded-2xl border border-dashed border-slate-200 p-4 space-y-1">
                      <p className="font-semibold">No children linked yet</p>
                      <p className="text-[10px] leading-normal not-italic max-w-[200px] mx-auto">
                        Type your child's email address above to link their account.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TEACHER: Class & Subject Mappings */}
          {profile.role === 'teacher' && (
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-gray-900 text-lg border-b pb-3 border-gray-50 font-sans">My Classes & Subjects</h2>
              
              {tcMsg.text && (
                <div className={`text-xs px-3 py-2 rounded-lg font-medium ${tcMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'}`}>
                  {tcMsg.text}
                </div>
              )}

              <form onSubmit={handleAddTC} className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Add Class & Subject</p>
                <div className="space-y-2">
                  <div>
                    <label className="label text-[10px]">Select Class</label>
                    <select
                      className="input mt-1 bg-white cursor-pointer font-semibold text-gray-700 text-xs py-1.5"
                      value={newClassId}
                      onChange={e => setNewClassId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Class --</option>
                      {classesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-[10px]">Subject Name</label>
                    <input
                      type="text"
                      className="input mt-1 text-xs py-1.5"
                      placeholder="e.g. Physics"
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={tcLoading}
                  className="w-full btn-primary text-xs justify-center py-2 mt-1"
                >
                  {tcLoading ? 'Adding...' : 'Add Mapping'}
                </button>
              </form>

              <div className="space-y-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">My Active Classes</p>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {activeTC.map(tc => (
                    <div key={tc.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-gray-800">{tc.classes?.name || 'Unknown Class'}</span>
                        <span className="block text-[9px] text-indigo-650 font-black uppercase tracking-wider">{tc.subject_name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTC(tc.id)}
                        className="text-gray-400 hover:text-red-650 font-bold transition-colors"
                        title="Remove Mapping"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {activeTC.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-4 bg-slate-50/20 rounded-xl border border-dashed">No active classes linked yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}
