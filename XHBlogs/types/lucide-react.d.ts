// lucide-react@1.x 该版本发布时遗漏了 .d.ts 类型文件（package.json 的 types 指向不存在的文件），
// 这里提供最小类型声明，覆盖本项目使用到的图标。
declare module 'lucide-react' {
  import type { ComponentType, SVGProps } from 'react';

  type LucideIconProps = SVGProps<SVGSVGElement> & {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  };
  type LucideIcon = ComponentType<LucideIconProps>;

  export const Bold: LucideIcon;
  export const Italic: LucideIcon;
  export const Strikethrough: LucideIcon;
  export const Heading1: LucideIcon;
  export const Heading2: LucideIcon;
  export const Heading3: LucideIcon;
  export const List: LucideIcon;
  export const ListOrdered: LucideIcon;
  export const ListTodo: LucideIcon;
  export const Quote: LucideIcon;
  export const Link2: LucideIcon;
  export const Image: LucideIcon;
  export const Code: LucideIcon;
  export const CodeXml: LucideIcon;
  export const Sigma: LucideIcon;
  export const Table: LucideIcon;
  export const Minus: LucideIcon;
}
