'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Trash2, Plus, Pencil, ShieldCheck, KeyRound } from 'lucide-react'
import { ROLE_ZH } from '@/lib/incident-display'
import type { UserRole } from '@/types'

interface Factory { id: string; name: string }
interface ManagedUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  factory_id: string | null
  is_active: boolean
  created_at: string
}

const ROLES: UserRole[] = ['technician', 'supervisor', 'manager', 'director', 'admin']

const ROLE_BADGE: Record<UserRole, string> = {
  technician: 'bg-gray-100 text-gray-700',
  supervisor: 'bg-blue-100 text-blue-700',
  manager: 'bg-purple-100 text-purple-700',
  director: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
}

export default function UserManager({ currentUserId }: { currentUserId: string }) {
  const supabase = createClient()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [factories, setFactories] = useState<Factory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('technician')
  const [factoryId, setFactoryId] = useState('')

  useEffect(() => {
    supabase.from('factories').select('id, name').order('name').then(({ data }) => {
      setFactories(data ?? [])
    })
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '載入失敗')
      setUsers(json.users ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '載入使用者失敗')
    } finally {
      setLoading(false)
    }
  }

  function startAdd() {
    setEditingId(null)
    setEmail('')
    setPassword('')
    setFullName('')
    setRole('technician')
    setFactoryId(factories[0]?.id ?? '')
    setShowForm(true)
  }

  function startEdit(u: ManagedUser) {
    setEditingId(u.id)
    setEmail(u.email)
    setPassword('')
    setFullName(u.full_name)
    setRole(u.role)
    setFactoryId(u.factory_id ?? '')
    setShowForm(true)
  }

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setPassword('')
  }

  async function submit() {
    if (!editingId && (!email.trim() || !password)) {
      toast.error('帳號與密碼必填')
      return
    }
    setSubmitting(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/users/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName,
            role,
            factory_id: factoryId || null,
            ...(password ? { password } : {}),
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || '更新失敗')
        toast.success(password ? '已更新並重設密碼' : '已更新')
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email, password, full_name: fullName, role, factory_id: factoryId || null,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || '建立失敗')
        toast.success('已建立帳號')
      }
      resetForm()
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失敗')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(u: ManagedUser) {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !u.is_active }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '更新失敗')
      toast.success(u.is_active ? '已停用' : '已啟用')
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失敗')
    }
  }

  async function remove(u: ManagedUser) {
    if (u.id === currentUserId) { toast.error('無法刪除自己的帳號'); return }
    if (!confirm(`確認刪除帳號 ${u.email}？此動作無法復原。`)) return
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '刪除失敗')
      toast.success('已刪除帳號')
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '刪除失敗')
    }
  }

  const factoryName = (id: string | null) => factories.find(f => f.id === id)?.name ?? '—'

  if (loading) return <div className="text-center text-gray-500 text-sm py-4">載入中...</div>

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button onClick={startAdd} className="gap-2 w-full">
          <Plus className="w-4 h-4" /> 新增帳號
        </Button>
      )}

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {editingId ? '編輯帳號' : '新增帳號'}
          </p>

          <div>
            <Label>帳號 (Email)</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@company.com"
              disabled={!!editingId}
              className="mt-1"
            />
            {editingId && <p className="text-xs text-gray-400 mt-1">帳號 Email 不可修改</p>}
          </div>

          <div>
            <Label className="flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              {editingId ? '重設密碼（留空則不變更）' : '密碼'}
            </Label>
            <Input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={editingId ? '留空則維持原密碼' : '至少 6 碼'}
              className="mt-1 font-mono"
            />
          </div>

          <div>
            <Label>姓名</Label>
            <Input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="例如：王小明"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>角色</Label>
              <Select value={role} onValueChange={(v) => setRole((v ?? 'technician') as UserRole)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_ZH[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>工廠</Label>
              <Select value={factoryId} onValueChange={(v) => setFactoryId(v ?? '')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="選擇工廠" /></SelectTrigger>
                <SelectContent>
                  {factories.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? '更新' : '建立'}
            </Button>
            <Button variant="outline" onClick={resetForm}>取消</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {users.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">尚無帳號</p>
        ) : (
          users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg bg-white gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{u.full_name || u.email}</p>
                  <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role]}`}>
                    {ROLE_ZH[u.role]}
                  </span>
                  {!u.is_active && (
                    <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500">已停用</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                <p className="text-xs text-gray-400">{factoryName(u.factory_id)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive(u)}
                  title={u.is_active ? '停用' : '啟用'}
                  className={u.is_active ? 'text-green-600' : 'text-gray-400'}
                >
                  <ShieldCheck className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => startEdit(u)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => remove(u)}
                  disabled={u.id === currentUserId}
                >
                  <Trash2 className={`w-4 h-4 ${u.id === currentUserId ? 'text-gray-300' : 'text-red-600'}`} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
