import { ImageResponse } from 'next/og'

export const alt = 'Tapak — Personal Watch Journal'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#14141a',
          color: '#f3f4f6',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Footprint Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          <svg width="84" height="84" viewBox="0 0 32 32" fill="none">
            <path fill="#d97757" d="M16 11c-3.314 0-6 4.03-6 9 0 4.97 2.686 9 6 9s6-4.03 6-9c0-4.97-2.686-9-6-9z"/>
            <circle cx="11.5" cy="8.5" r="1.8" fill="#d97757"/>
            <circle cx="14.5" cy="6.5" r="1.8" fill="#d97757"/>
            <circle cx="17.5" cy="6.5" r="1.8" fill="#d97757"/>
            <circle cx="20.5" cy="8.5" r="1.8" fill="#d97757"/>
          </svg>
          <span style={{ fontSize: '76px', fontWeight: '800', letterSpacing: '-0.03em', color: '#ffffff' }}>
            Tapak
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '34px',
            fontWeight: '700',
            color: '#d97757',
            marginBottom: '16px',
          }}
        >
          Every Watch Leaves a Footprint.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '20px',
            color: '#9ca3af',
            maxWidth: '650px',
            textAlign: 'center',
            lineHeight: '1.5',
          }}
        >
          Catat progress tontonan anime, series, dan film. Track episode, status, rating, dan catatan pribadi.
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
