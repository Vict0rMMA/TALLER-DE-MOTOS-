import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(
  _req: Request,
  { params }: { params: { size: string } },
) {
  const size = Math.min(512, Math.max(16, parseInt(params.size) || 192));

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: size * 0.2,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: size * 0.48,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 1,
          }}
        >
          M
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
