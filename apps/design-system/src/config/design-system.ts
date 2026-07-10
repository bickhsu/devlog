export const designSystemMeta = {
  name: "DevLog",
  style: "Rhea",
  baseColor: "Zinc",
  theme: "Lime",
  headingFont: "Geist Mono",
  bodyFont: "Geist",
  iconLibrary: "Remix Icon",
  radius: "Small",
} as const

export type DesignSystemMeta = typeof designSystemMeta
