import { Plus } from 'lucide-react'
import ComingSoon from '@/components/shared/ComingSoon'

// Placeholder for the high-frequency "open new inspection" flow (Phase 1 next
// wave). Route reserved so the centre bottom-nav tab already lands somewhere.
export default function InspectPage() {
  return <ComingSoon icon={Plus} titleKey="inspect.title" descKey="inspect.description" />
}
