import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['director', 'purchasing'].includes(profile.role)) return null
  return user
}

// DELETE /api/admin/users — body: { userId }
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (userId === admin.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// PATCH /api/admin/users — body: { userId, password }
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { userId, password } = await req.json()
  if (!userId || !password) return NextResponse.json({ error: 'userId and password required' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(userId, { password })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// POST /api/admin/users — body: { email, password, full_name, role, department_id }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { email, password, full_name, role, department_id } = await req.json()
  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: 'email, password, full_name, and role required' }, { status: 400 })
  }
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const adminClient = createAdminClient()
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Trigger auto-creates profile, so we UPDATE instead of INSERT
  const { data: updatedProfile, error: profileError } = await adminClient
    .from('profiles')
    .update({
      full_name,
      role,
      department_id: department_id || null,
    })
    .eq('id', newUser.user.id)
    .select()
    .single()

  if (profileError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json(updatedProfile)
}
