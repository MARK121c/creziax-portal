import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const ClientSplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000); 
    }, 3000); // 3 seconds total

    return () => clearTimeout(timer);
  }, [onComplete]);

  const containerVariants = {
    exit: {
      opacity: 0,
      scale: 1.1,
      filter: 'blur(20px)',
      transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + i * 0.1,
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1]
      }
    })
  };

  const logoVariants = {
    hidden: { opacity: 0, y: 15, rotateX: 45 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        delay: 0.8 + (i * 0.1),
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1]
      }
    })
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={containerVariants}
          exit="exit"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
        >
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative z-10 text-center px-6">
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={textVariants}
              className="text-brand-500 font-bold tracking-[0.4em] uppercase text-[10px] mb-6 opacity-80"
            >
              Creziax Elite Portal
            </motion.div>
            
            <h1 className="flex flex-col gap-1">
              <motion.span
                custom={1}
                initial="hidden"
                animate="visible"
                variants={textVariants}
                className="text-4xl md:text-6xl font-black text-white tracking-tighter"
              >
                Welcome to the World of
              </motion.span>
              <motion.span
                custom={2}
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-white to-indigo-400 bg-300% animate-gradient py-4 flex justify-center flex-row"
                dir="ltr"
                style={{
                  textShadow: '0 0 50px rgba(245, 158, 11, 0.4)',
                  filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.1))'
                }}
              >
                {"Creziax".split('').map((char, index) => (
                  <motion.span
                    key={index}
                    variants={logoVariants}
                    custom={index}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.span>
            </h1>

            <motion.p
              custom={3}
              initial="hidden"
              animate="visible"
              variants={textVariants}
              className="text-slate-400 text-lg md:text-2xl font-medium tracking-tight mt-4 italic opacity-80"
            >
              Your Vision, Our Reality
            </motion.p>

            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={textVariants}
              className="mt-8 flex items-center justify-center gap-4"
            >
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-brand-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping"></div>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-brand-500/50"></div>
            </motion.div>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes gradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animate-gradient {
              background-size: 300% 300%;
              animation: gradient 8s ease infinite;
            }
          `}} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClientSplashScreen;
