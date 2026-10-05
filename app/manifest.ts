import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "რეაბილიტაციის ცენტრი",
    short_name: "Rehab Center",
    description: "რეაბილიტაციის ცენტრის ონლაინ ჩაწერა და ადმინისტრაცია",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8f6",
    theme_color: "#0f5a53",
    lang: "ka",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
