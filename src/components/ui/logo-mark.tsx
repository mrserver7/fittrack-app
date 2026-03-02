// eslint-disable-next-line @next/next/no-img-element
export default function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="FitTrack"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
    />
  );
}
