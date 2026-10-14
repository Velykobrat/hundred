import type { ReactNode, SVGProps } from "react";

export type IconName = "home" | "resource" | "settings" | "back" | "chevron" | "more" | "edit" | "trash" | "copy" | "download" | "upload" | "plus" | "layers";

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h5v-6h4v6h5V9" /></>,
  resource: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M13 3v18M13 12h8" /></>,
  settings: <><path d="M9.4 4.2 10 2h4l.6 2.2 1.8 1 2.2-.6 2 3.4-1.6 1.6v2l1.6 1.6-2 3.4-2.2-.6-1.8 1L14 20h-4l-.6-2.2-1.8-1-2.2.6-2-3.4L5 12.4v-2L3.4 8.8l2-3.4 2.2.6z" /><circle cx="12" cy="11" r="3" /></>,
  back: <path d="m14 6-6 6 6 6M8 12h12" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  edit: <><path d="m16 3 5 5-12 12-6 1 1-6zM14 5l5 5" /></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" /></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6" /></>,
  upload: <><path d="M12 15V3m-5 5 5-5 5 5M4 15v6h16v-6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  layers: <><path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" /></>,
};

export default function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}
