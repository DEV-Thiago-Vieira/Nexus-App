import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/app-icon-art";

const SIZES = [32, 192, 512];

export function generateImageMetadata() {
  return SIZES.map((s) => ({ id: String(s), contentType: "image/png", size: { width: s, height: s } }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  return new ImageResponse(<AppIconArt size={size} />, { width: size, height: size });
}
