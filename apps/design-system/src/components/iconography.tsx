import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiFileCopyLine,
  RiHexagonLine,
  RiLoader4Line,
  RiMoreLine,
  RiSearchLine,
  RiShareLine,
  RiShoppingBagLine,
  RiSubtractLine,
} from "@remixicon/react"

const icons = [
  RiFileCopyLine,
  RiErrorWarningLine,
  RiDeleteBinLine,
  RiShareLine,
  RiShoppingBagLine,
  RiMoreLine,
  RiLoader4Line,
  RiAddLine,
  RiSubtractLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiSearchLine,
  RiHexagonLine,
] as const

export function Iconography() {
  return (
    <article className="w-[430px] shrink-0 rounded-[28px] border bg-card p-6">
      <h2 className="font-heading text-2xl font-medium">Iconography</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Remix Icon line symbols used across DevLog interfaces.
      </p>
      <div className="mt-8 grid grid-cols-8 gap-2">
        {icons.map((Icon, index) => (
          <div
            className="grid aspect-square place-items-center rounded-xl border bg-background text-foreground"
            key={index}
          >
            <Icon aria-hidden size={20} />
          </div>
        ))}
      </div>
    </article>
  )
}
