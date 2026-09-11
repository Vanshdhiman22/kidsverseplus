import React, { useEffect } from 'react'
import { motion } from 'motion/react'
import { Pause, Play, Volume2 } from 'lucide-react'
import { useNovaVoice } from '../lib/voice.js'

/** Reusable animated Nova presenter. The lesson supplies the visual and words;
 * Nova's appearance and motion stay consistent in every subject. */
export default function NovaTeacher({ image, imageAlt = '', speech, step = 1, autoSpeak = false }) {
  const voice = useNovaVoice()

  useEffect(() => {
    if (autoSpeak) voice.say(speech)
    return voice.stop
  }, [autoSpeak, speech]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleVoice = () => voice.speaking ? voice.stop() : voice.say(speech)

  return (
    <div className="relative w-full h-full overflow-hidden bg-[linear-gradient(145deg,#eef8ff_0%,#f5f0ff_48%,#fff8df_100%)]">
      <div className="absolute inset-0 overflow-hidden">
        {image && <img src={image} alt={imageAlt} className="w-full h-full object-cover object-center opacity-45" />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.06),rgba(245,240,255,.34)_56%,rgba(245,240,255,.82)_100%)]" />
      </div>

      <div className="absolute top-4 left-4 z-20 rounded-full px-4 py-2 text-[12px] font-extrabold tracking-[0.12em] text-white bg-[rgba(35,27,94,.72)] backdrop-blur-md">
        NOVA TEACHES · STEP {step}
      </div>

      <motion.div
        className="absolute right-4 top-[150px] z-20 w-[250px] rounded-[22px] border border-white/80 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-md"
        animate={voice.speaking ? { y: [0, -4, 0], scale: [1, 1.015, 1] } : { y: 0, scale: 1 }}
        transition={{ duration: 0.85, repeat: voice.speaking ? Infinity : 0, ease: 'easeInOut' }}
      >
        <div className="text-[12px] font-extrabold tracking-[0.12em] text-primary-ink">NOVA SAYS</div>
        <p className="mt-1 max-h-[104px] overflow-y-auto pr-1 text-[14px] font-bold leading-snug text-ink-2 text-pretty">{speech}</p>
        <span className="absolute -left-3 bottom-8 w-6 h-6 rotate-45 border-l border-b border-white/80 bg-white/90" />
      </motion.div>

      <motion.div
        className="absolute left-[12px] bottom-[-18px] z-10 w-[275px] origin-bottom"
        animate={voice.speaking
          ? { y: [0, -8, 0], rotate: [-1.5, 1.5, -1.5], scaleY: [1, 1.012, 1] }
          : { y: [0, -5, 0], rotate: [-0.7, 0.7, -0.7] }}
        transition={{ duration: voice.speaking ? 0.75 : 3.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src="/art/hd/nova-guide.webp" alt="Nova, your animated AI learning buddy" className="w-full h-auto object-contain drop-shadow-[0_22px_24px_rgba(48,37,120,.25)]" draggable={false} />
        {voice.speaking && (
          <motion.span
            className="absolute left-[118px] top-[210px] w-[43px] h-[43px] rounded-full border-[4px] border-cyan-300"
            initial={{ opacity: .8, scale: .7 }} animate={{ opacity: 0, scale: 1.65 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.div>

      <motion.button
        type="button"
        onClick={toggleVoice}
        className="absolute right-5 bottom-5 z-30 h-[54px] px-5 rounded-full flex items-center gap-3 text-white font-extrabold shadow-xl"
        style={{ background: 'var(--grad-primary)' }}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: .96 }}
        aria-label={voice.speaking ? 'Pause Nova' : 'Hear Nova teach'}
      >
        {voice.speaking ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}
        {voice.speaking ? 'PAUSE NOVA' : 'HEAR NOVA'}
        {!voice.speaking && <Volume2 size={19} />}
      </motion.button>
    </div>
  )
}
