import { Button, type ButtonSize, type ButtonVariant } from "@devlog/ui/components/button"
import {
  RiAddLine,
  RiArrowRightLine,
  RiDeleteBinLine,
  RiSettings3Line,
} from "@remixicon/react"

const variants: ButtonVariant[] = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
]

const sizes: Exclude<ButtonSize, "icon">[] = ["sm", "default", "lg"]

export function Buttons() {
  return (
    <article className="flex max-h-full min-h-0 w-[430px] shrink-0 flex-col overflow-hidden rounded-[28px] border bg-card p-6">
      <h2 className="font-heading text-2xl font-medium">Button</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Actions with clear hierarchy, sizing, and feedback states.
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <Showcase title="Variants">
          {variants.map((variant) => (
            <Button key={variant} variant={variant}>
              {toLabel(variant)}
            </Button>
          ))}
        </Showcase>

        <Showcase title="Sizes">
          {sizes.map((size) => (
            <Button key={size} size={size} variant="outline">
              {toLabel(size)}
            </Button>
          ))}
          <Button aria-label="Settings" size="icon" variant="outline">
            <RiSettings3Line />
          </Button>
        </Showcase>

        <Showcase title="Composition">
          <Button>
            <RiAddLine />
            New entry
          </Button>
          <Button variant="secondary">
            Continue
            <RiArrowRightLine />
          </Button>
          <Button aria-label="Delete" size="icon" variant="destructive">
            <RiDeleteBinLine />
          </Button>
        </Showcase>

        <Showcase title="States">
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </Showcase>
      </div>
    </article>
  )
}

function Showcase({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="mt-8 border-t pt-5">
      <h3 className="font-heading text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

function toLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
