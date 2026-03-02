import Image from "next/image";

export default function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="FitTrack"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
      priority
    />
  );
}
