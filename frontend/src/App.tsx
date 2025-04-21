import { useState, useEffect } from 'react'
import { useSession } from './context/SessionContext'
import UserOnboardingModal from './components/UserOnboardingModal'
import ChatApp from './components/Chat/ChatApp'
import { motion, AnimatePresence } from 'framer-motion'
// import './App.css'

/**
 * Root application component.
 * Handles the display logic between the user onboarding modal and the main chat application.
 */
function App() {
  const { sessionId } = useSession()
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(!!sessionId)

  useEffect(() => {
    setIsOnboardingComplete(!!sessionId)
  }, [sessionId])

  // Define animation variants for fading
  const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <AnimatePresence mode="wait"> 
        {!isOnboardingComplete ? (
          <motion.div
            key="onboarding"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full max-w-md"
          >
            <UserOnboardingModal onSuccess={() => { /* Onboarding success is now handled by useEffect */ }} />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="h-full w-full max-w-7xl"
          >
            <ChatApp />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App



