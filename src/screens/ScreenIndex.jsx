import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, ArrowRight } from 'lucide-react'
import Page from '../components/Page.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import { SCREENS } from '../App.jsx'

export default function ScreenIndex() {
  const nav = useNavigate()
  const screens = SCREENS.filter(([path]) => path !== '/screens')
  return (
    <Page>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(124,92,255,.34),transparent_34%),linear-gradient(135deg,#0b1038,#17165d_58%,#1d0d47)]" />
      <div className="absolute left-[105px] top-[68px] w-[1460px] z-10">
        <div className="flex items-center gap-4 text-sky-200"><LayoutGrid size={26} /><span className="text-[15px] font-extrabold tracking-[.18em] uppercase">Developer walkthrough</span></div>
        <h1 className="mt-3 font-display font-extrabold text-[56px] leading-none text-white">Screen Index</h1>
        <p className="mt-3 text-[19px] font-semibold text-indigo-100">Open any Kidsverse screen individually for your screen-by-screen testing video.</p>
        <Panel className="mt-7 h-[680px] p-6 overflow-auto" initial="hidden" animate="show">
          <div className="grid grid-cols-3 gap-4">
            {screens.map(([path, label]) => <Card key={path} hover className="h-[94px] p-4 flex items-center gap-4 cursor-pointer" onClick={() => nav(path)}>
              <span className="w-[42px] h-[42px] rounded-[14px] grid place-items-center shrink-0 text-white font-display font-extrabold text-[16px]" style={{ background: 'var(--grad-primary)' }}>{label.match(/^\d+/)?.[0] ?? '•'}</span>
              <span className="min-w-0 flex-1 leading-tight"><span className="block font-display font-extrabold text-[18px] text-ink truncate">{label}</span><span className="block mt-1 font-mono text-[12px] text-ink-3 truncate">{path}</span></span>
              <ArrowRight className="text-primary-ink shrink-0" size={20} />
            </Card>)}
          </div>
        </Panel>
      </div>
    </Page>
  )
}
