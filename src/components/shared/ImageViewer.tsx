'use client'

import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import Image from 'next/image'
import { Download } from 'lucide-react'

interface Props {
  paths: string[]
  supabaseUrl: string
  bucket?: string
}

export default function ImageViewer({ paths, supabaseUrl, bucket = 'incident-photos' }: Props) {
  if (!paths || paths.length === 0) return null

  function getUrl(path: string) {
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
  }

  return (
    <PhotoProvider
      toolbarRender={({ onScale, scale, images: imgs, index }) => (
        <div className="flex gap-3 text-white text-sm items-center">
          <button onClick={() => onScale(scale + 0.5)} className="hover:opacity-70">＋</button>
          <button onClick={() => onScale(scale - 0.5)} className="hover:opacity-70">－</button>
          <a href={(imgs as { src?: string }[])[index]?.src} download className="hover:opacity-70">
            <Download className="w-5 h-5" />
          </a>
        </div>
      )}
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {paths.map((path, i) => (
          <PhotoView key={path} src={getUrl(path)}>
            <div className="relative aspect-square rounded-lg overflow-hidden cursor-zoom-in bg-gray-100">
              <Image
                src={getUrl(path)}
                alt={`Foto ${i + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform"
                sizes="(max-width: 640px) 33vw, 25vw"
              />
            </div>
          </PhotoView>
        ))}
      </div>
    </PhotoProvider>
  )
}
