import { useEffect } from 'react';
import cloudSvgBg from '../assets/images/cloud-svg-bg.svg';

const SKY_COLOR = '#89CFF0';

const useOnboardingBackground = () => {
  useEffect(() => {
    const prevBodyBg = document.body.style.backgroundColor;
    const prevBodyBgImage = document.body.style.backgroundImage;
    const prevBodyBgSize = document.body.style.backgroundSize;
    const prevBodyBgPos = document.body.style.backgroundPosition;
    const prevBodyBgRepeat = document.body.style.backgroundRepeat;
    const prevHtmlBg = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = SKY_COLOR;
    document.body.style.backgroundImage = `url(${cloudSvgBg})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center top';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.documentElement.style.backgroundColor = SKY_COLOR;

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
