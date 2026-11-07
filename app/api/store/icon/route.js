import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wanted = Number(searchParams.get('size'));
  const size = [180, 192, 512].includes(wanted) ? wanted : 192;
  const admin = searchParams.get('variant') === 'admin';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: admin ? '#b8924a' : '#141414',
          color: admin ? '#141414' : '#b8924a',
          fontSize: Math.round(size * 0.6),
          fontWeight: 700,
        }}
      >
        {admin ? 'A' : 'S'}
      </div>
    ),
    { width: size, height: size }
  );
}
