'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Department, Profile, UserRole, ROLE_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Pencil, Check, X, KeyRound } from 'lucide-react'

interface Props {
  departments: Department[]
  profiles: (Profile & { department?: Department })[]
}

const ROLES: UserRole[] = ['applicant', 'dept_manager', 'general_manager', 'director', 'purchasing']

export default function AdminClient({ departments: initDepts, profiles: initProfiles }: Props) {
  const supabase = createClient()

  // Departments
  const [departments, setDepartments] = useState(initDepts)
  const [newDeptName, setNewDeptName] = useState('')
  const [editingDept, setEditingDept] = useState<{ id: string; name: string } | null>(null)
  const [deptLoading, setDeptLoading] = useState(false)

  // Profiles
  const [profiles, setProfiles] = useState(initProfiles)
  const [editingProfile, setEditingProfile] = useState<string | null>(null)
  const [profileEdits, setProfileEdits] = useState<{ full_name: string; role: UserRole; department_id: string | null }>({ full_name: '', role: 'applicant', department_id: '' })
  const [profileLoading, setProfileLoading] = useState(false)

  // Reset password dialog
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Create user
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('applicant')
  const [newUserDept, setNewUserDept] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  async function createUser() {
    if (!newUserEmail.trim() || !newUserName.trim() || !newUserPassword.trim()) {
      toast.error('Email, name, and password required')
      return
    }
    if (newUserPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setCreateLoading(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newUserEmail.trim(),
        password: newUserPassword,
        full_name: newUserName.trim(),
        role: newUserRole,
        department_id: newUserDept || null,
      }),
    })
    setCreateLoading(false)
    if (!res.ok) { toast.error((await res.json()).error); return }
    const newProfile = await res.json()
    setProfiles(p => [...p, newProfile])
    setShowCreateUser(false)
    setNewUserEmail('')
    setNewUserName('')
    setNewUserPassword('')
    setNewUserRole('applicant')
    setNewUserDept('')
    toast.success('User created')
  }

  async function addDept() {
    if (!newDeptName.trim()) return
    setDeptLoading(true)
    const { data, error } = await supabase.from('departments').insert({ name: newDeptName.trim() }).select().single()
    setDeptLoading(false)
    if (error) { toast.error(error.message); return }
    setDepartments(d => [...d, data])
    setNewDeptName('')
    toast.success('Department added')
  }

  async function saveDept() {
    if (!editingDept) return
    setDeptLoading(true)
    const { error } = await supabase.from('departments').update({ name: editingDept.name }).eq('id', editingDept.id)
    setDeptLoading(false)
    if (error) { toast.error(error.message); return }
    setDepartments(d => d.map(x => x.id === editingDept.id ? { ...x, name: editingDept.name } : x))
    setEditingDept(null)
    toast.success('Department updated')
  }

  async function deleteDept(id: string) {
    if (!confirm('Delete this department?')) return
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setDepartments(d => d.filter(x => x.id !== id))
    toast.success('Department deleted')
  }

  function startEditProfile(p: Profile & { department?: Department }) {
    setEditingProfile(p.id)
    setProfileEdits({ full_name: p.full_name, role: p.role, department_id: p.department_id ?? '' })
  }

  async function saveProfile(id: string) {
    setProfileLoading(true)
    const { error } = await supabase.from('profiles').update({
      full_name: profileEdits.full_name,
      role: profileEdits.role,
      department_id: profileEdits.department_id || null,
    }).eq('id', id)
    setProfileLoading(false)
    if (error) { toast.error(error.message); return }
    setProfiles(p => p.map(x => x.id === id ? {
      ...x,
      full_name: profileEdits.full_name,
      role: profileEdits.role,
      department_id: profileEdits.department_id || null,
      department: departments.find(d => d.id === profileEdits.department_id),
    } : x))
    setEditingProfile(null)
    toast.success('User updated')
  }

  async function resetPassword() {
    if (!resetTarget || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setResetLoading(true)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: resetTarget.id, password: newPassword }),
    })
    setResetLoading(false)
    if (!res.ok) { toast.error((await res.json()).error); return }
    toast.success(`Password updated for ${resetTarget.name}`)
    setResetTarget(null)
    setNewPassword('')
  }

  async function deleteUser() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: deleteTarget.id }),
    })
    setDeleteLoading(false)
    if (!res.ok) { toast.error((await res.json()).error); return }
    setProfiles(p => p.filter(x => x.id !== deleteTarget.id))
    toast.success(`${deleteTarget.name} deleted`)
    setDeleteTarget(null)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>

      {/* Departments */}
      <section className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Departments</h2>

        <div className="flex gap-3 mb-6">
          <Input
            placeholder="New department name"
            value={newDeptName}
            onChange={e => setNewDeptName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addDept()}
            className="flex-1 h-12 text-base"
          />
          <Button onClick={addDept} disabled={deptLoading} className="px-6 h-12">
            {deptLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span className="hidden sm:inline ml-2">Add</span>
          </Button>
        </div>

        <div className="space-y-3">
          {departments.map(dept => (
            <div key={dept.id} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
              {editingDept?.id === dept.id ? (
                <>
                  <Input
                    value={editingDept.name}
                    onChange={e => setEditingDept({ ...editingDept, name: e.target.value })}
                    className="flex-1 h-10 text-base"
                    autoFocus
                  />
                  <Button size="sm" onClick={saveDept} disabled={deptLoading} className="h-10 px-4">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingDept(null)} className="h-10 px-4">
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-base font-medium text-gray-800">{dept.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => setEditingDept({ id: dept.id, name: dept.name })} className="h-10 px-4">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 h-10 px-4" onClick={() => deleteDept(dept.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Users */}
      <section className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Users ({profiles.length})</h2>
          <Button onClick={() => setShowCreateUser(true)} className="px-6 h-12">
            {<Plus className="w-5 h-5" />}
            <span className="ml-2">Add User</span>
          </Button>
        </div>

        <div className="space-y-4">
          {profiles.map(p => (
            <div key={p.id} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
              {editingProfile === p.id ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Full Name</Label>
                    <Input
                      value={profileEdits.full_name}
                      onChange={e => setProfileEdits(x => ({ ...x, full_name: e.target.value }))}
                      className="mt-2 h-11 text-base"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-base font-semibold">Role</Label>
                      <Select value={profileEdits.role} onValueChange={v => setProfileEdits(x => ({ ...x, role: v as UserRole }))}>
                        <SelectTrigger className="mt-2 h-11 text-base"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-base font-semibold">Department</Label>
                      <Select value={profileEdits.department_id ?? ''} onValueChange={v => setProfileEdits(x => ({ ...x, department_id: v || null }))}>
                        <SelectTrigger className="mt-2 h-11 text-base"><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <Button variant="ghost" onClick={() => setEditingProfile(null)} className="h-10">Cancel</Button>
                    <Button onClick={() => saveProfile(p.id)} disabled={profileLoading} className="h-10 px-6">
                      {profileLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900">{p.full_name}</p>
                    <p className="text-base text-gray-600 mt-0.5">{p.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                        {ROLE_LABELS[p.role]}
                      </span>
                      {p.department && (
                        <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                          {p.department.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="ghost" title="Edit" onClick={() => startEditProfile(p)} className="h-10 w-10 p-0">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Reset password" onClick={() => { setResetTarget({ id: p.id, name: p.full_name }); setNewPassword('') }} className="h-10 w-10 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                      <KeyRound className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Delete user" onClick={() => setDeleteTarget({ id: p.id, name: p.full_name })} className="h-10 w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={() => { setResetTarget(null); setNewPassword('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password — {resetTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-base font-semibold">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="h-11 text-base"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && resetPassword()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetTarget(null); setNewPassword('') }}>Cancel</Button>
            <Button onClick={resetPassword} disabled={resetLoading || newPassword.length < 6} className="bg-orange-600 hover:bg-orange-700">
              {resetLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Set Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-base text-gray-700 py-2">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?<br />
            <span className="text-red-600 text-sm mt-1 block">This action cannot be undone.</span>
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={deleteUser} disabled={deleteLoading} className="bg-red-600 hover:bg-red-700">
              {deleteLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-base font-semibold">Email</Label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
                className="mt-2 h-11 text-base"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-base font-semibold">Full Name</Label>
              <Input
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                placeholder="John Doe"
                className="mt-2 h-11 text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base font-semibold">Role</Label>
                <Select value={newUserRole} onValueChange={v => setNewUserRole(v as UserRole)}>
                  <SelectTrigger className="mt-2 h-11 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base font-semibold">Department</Label>
                <Select value={newUserDept} onValueChange={v => setNewUserDept(v)}>
                  <SelectTrigger className="mt-2 h-11 text-base"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-base font-semibold">Password</Label>
              <Input
                type="password"
                value={newUserPassword}
                onChange={e => setNewUserPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="mt-2 h-11 text-base"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUser(false)}>Cancel</Button>
            <Button onClick={createUser} disabled={createLoading || !newUserEmail.trim() || !newUserName.trim() || newUserPassword.length < 6} className="h-11 px-6">
              {createLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
