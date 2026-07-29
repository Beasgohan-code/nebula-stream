import { useSearchParams, useNavigate } from 'react-router-dom'
import EmbedViewer from '../components/EmbedViewer'

export default function EmbedPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const url = params.get('url') || ''
  const title = params.get('title') || ''
  const subtitle = params.get('subtitle') || ''

  if (!url) {
    return (
      <div className="text-center py-20">
        <p className="glow-text-pink mb-4">No URL to preview</p>
        <button className="action-btn" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    )
  }

  return (
    <EmbedViewer
      url={decodeURIComponent(url)}
      title={decodeURIComponent(title)}
      subtitle={subtitle ? decodeURIComponent(subtitle) : undefined}
      onBack={() => navigate(-1)}
    />
  )
}
