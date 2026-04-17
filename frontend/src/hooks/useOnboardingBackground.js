import { useEffect } from 'react';
import lightBg from '../assets/images/light-bg.jpeg';

const BG_COLOR = '#b8c8e8';

const useOnboardingBackground = () => {
  useEffect(() => {
    const prevBodyBg = document.body.style.backgroundColor;
    const prevBodyBgImage = document.body.style.backgroundImage;
    const prevBodyBgSize = document.body.style.backgroundSize;
    const prevBodyBgPos = document.body.style.backgroundPosition;
    const prevBodyBgRepeat = document.body.style.backgroundRepeat;
    const prevHtmlBg = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = BG_COLOR;
    document.body.style.backgroundImage = `url(${lightBg})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.documentElement.style.backgroundColor = BG_COLOR;

    return () => {
      document.body.style.backgroundColor = prevBodyBg;
      document.body.style.backgroundImage = prevBodyBgImage;
      document.body.style.backgroundSize = prevBodyBgSize;
      document.body.style.backgroundPosition = prevBodyBgPos;
      document.body.style.backgroundRepeat = prevBodyBgRepeat;
      document.documentElement.style.backgroundColor = prevHtmlBg;
    };
  }, []);
};

export default useOnboardingBackground;
