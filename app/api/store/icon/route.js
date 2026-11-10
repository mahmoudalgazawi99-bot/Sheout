import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wanted = Number(searchParams.get('size'));
  const size = [180, 192, 512].includes(wanted) ? wanted : 192;
  const variant = searchParams.get('variant');

  let background = '#141414';
  let color = '#b8924a';
  let letter = 'S';
  if (variant === 'admin') {
    background = '#b8924a';
    color = '#141414';
    letter = 'A';
  } else if (variant === 'courier') {
    background = '#2f5d50';
    color = '#faf6ef';
    letter = 'C';
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background,
          color,
          fontSize: Math.round(size * 0.6),
          fontWeight: 700,
        }}
      >
        {letter}
      </div>
    ),
    { width: size, height: size }
  );
}
