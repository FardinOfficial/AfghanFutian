import Capabilities from '@/sections/Capabilities'
import GlobalNetwork from '@/sections/GlobalNetwork'
import Hero from '@/sections/Hero'
import Introduction from '@/sections/Introduction'
import Process from '@/sections/Process'
import WhyAfghanFutian from '@/sections/WhyAfghanFutian'

/**
 * Homepage.
 *
 * Stage 1 delivered the design system, the navigation shell and the cinematic
 * hero. Stage 2 added the narrative that follows it — the Introduction and the
 * Capabilities index. Stage 3 completed the argument: where the operation
 * happens (Global Network), how it runs (Process), and why it is worth
 * choosing (Why Afghan Futian).
 *
 * The closing call to action is deliberately *not* here: it belongs to every
 * page, so it is rendered by `MainLayout` immediately after this route's
 * content. That keeps one ask, in one place, for the whole site.
 *
 * Ground rhythm, in order: ink → canvas → canvas → ink → canvas → surface →
 * ink (closing CTA) → ink (footer). The dark sections bracket the narrative —
 * one at each end of the page's opening statement and its geography — and
 * `surface` gives the closing argument a ground of its own without adding a
 * colour.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Introduction />
      <Capabilities />
      <GlobalNetwork />
      <Process />
      <WhyAfghanFutian />
    </>
  )
}
