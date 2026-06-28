import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import TelegramSettings from '@/components/settings/TelegramSettings'
import FactoryManager from '@/components/settings/FactoryManager'
import AreaManager from '@/components/settings/AreaManager'
import AssetManager from '@/components/settings/AssetManager'
import IncidentTypeManager from '@/components/settings/IncidentTypeManager'
import UserManager from '@/components/settings/UserManager'
import { isTelegramConfigured } from '@/lib/telegram'
import {
  SettingsHeading,
  SettingsSectionHeader,
  NoFactoryMessage,
} from '@/components/settings/SettingsSectionHeader'

export const metadata = { title: '設定 | 維修系統' }

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isAdmin = user.role === 'admin'

  return (
    <div className="space-y-5">
      <SettingsHeading />

      {/* User Management — admin only */}
      {isAdmin && (
        <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <SettingsSectionHeader titleKey="settings.userSectionTitle" descKey="settings.userSectionDesc" />
          <UserManager currentUserId={user.id} />
        </section>
      )}

      {/* Asset Management */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <SettingsSectionHeader titleKey="settings.assetSectionTitle" descKey="settings.assetSectionDesc" />
        <AssetManager />
      </section>

      {/* Area Management */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <SettingsSectionHeader titleKey="settings.areaSectionTitle" descKey="settings.areaSectionDesc" />
        <AreaManager />
      </section>

      {/* Factory Management */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <SettingsSectionHeader titleKey="settings.factorySectionTitle" descKey="settings.factorySectionDesc" />
        <FactoryManager />
      </section>

      {/* Incident Type Management */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <SettingsSectionHeader titleKey="settings.incidentTypeSectionTitle" descKey="settings.incidentTypeSectionDesc" />
        <IncidentTypeManager />
      </section>

      {/* Telegram Notifications */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <SettingsSectionHeader titleKey="settings.telegramSectionTitle" descKey="settings.telegramSectionDesc" />
        {user.factory_id ? (
          <TelegramSettings factoryId={user.factory_id} configured={isTelegramConfigured()} />
        ) : (
          <NoFactoryMessage />
        )}
      </section>
    </div>
  )
}
