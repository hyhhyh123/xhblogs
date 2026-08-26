// 照片墙数据
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    id: "life",
    title: "随手拍",
    description: "手机镜头下的碎碎片片",
    cover: "/photos/Camera_XHS_17478973033031040g2sg317u64q76kae05n160cuhrn64of9736g.jpg",
    date: "2026-08-26",
    photos: [
      { url: "/photos/Camera_XHS_17478973033031040g2sg317u64q76kae05n160cuhrn64of9736g.jpg" },
      { url: "/photos/IMG20190412103311.jpg" },
      { url: "/photos/IMG20190412104133.jpg" },
      { url: "/photos/IMG20190412105251.jpg" },
      { url: "/photos/IMG20230116120201.jpg" },
      { url: "/photos/IMG20230905182053.jpg" },
      { url: "/photos/IMG20240424110714.jpg" },
      { url: "/photos/IMG20240425072353.jpg" },
      { url: "/photos/IMG20240425083731.jpg" },
      { url: "/photos/IMG20240425093326.jpg" },
      { url: "/photos/IMG20241205093753.jpg" },
      { url: "/photos/IMG20250504102741.jpg" },
      { url: "/photos/IMG20250524050846.jpg" },
      { url: "/photos/IMG20250524134857.jpg" },
      { url: "/photos/IMG20250524135257.jpg" },
      { url: "/photos/IMG20250524150422.jpg" },
      { url: "/photos/IMG20250524150434.jpg" },
      { url: "/photos/IMG_20211106_104339.jpg" },
    ]
  },
  {
    id: "wechat",
    title: "收藏",
    description: "微信聊天里保存的瞬间",
    cover: "/photos/mmexport1748084695656.jpg",
    date: "2026-08-26",
    photos: [
      { url: "/photos/mmexport1748084695656.jpg" },
      { url: "/photos/mmexport1748084698967.jpg" },
      { url: "/photos/mmexport1748084711821.jpg" },
      { url: "/photos/mmexport1748084745562.jpg" },
      { url: "/photos/mmexport1748084755860.jpg" },
      { url: "/photos/mmexport1748084757309.jpg" },
      { url: "/photos/mmexport1748084803544.jpg" },
      { url: "/photos/mmexport1748101024664.jpg" },
      { url: "/photos/wx_camera_1699002999597.jpg" },
      { url: "/photos/wx_camera_1746953695698.jpg" },
    ]
  },
  {
    id: "stock",
    title: "素材",
    description: "网上找到的图",
    cover: "/photos/u_288728150_195042008_fm_253_fmt_auto_app_138_f_JPEG.jpg",
    date: "2026-08-26",
    photos: [
      { url: "/photos/u_288728150_195042008_fm_253_fmt_auto_app_138_f_JPEG.jpg" },
      { url: "/photos/u_392158794_2996082364_fm_253_fmt_auto_app_138_f_JPEG.jpg" },
    ]
  },
];
