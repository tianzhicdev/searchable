import { useEffect } from 'react';
import darkCloudSvgBg from '../assets/images/dark-cloud-svg-bg.svg';

const DARK_COLOR = '#09090F';

const useDarkBackground = () => {
  useEffect(() => {
    const prevBodyBg = document.body.style.backgroundColor;
    const prevBodyBgImage = document.body.style.backgroundImage;
    const prevBodyBgSize = document.body.style.backgroundSize;
    const prevBodyBgPos = document.body.style.backgroundPosition;
    const prevBodyBgRepeat = document.body.style.backgroundRepeat;
    const prevBodyBgAttachment = document.body.style.backgroundAttachment;
    const prevHtmlBg = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = DARK_COLOR;
    document.body.style.backgroundImage = `url(${darkCloudSvgBg})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center top';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    document.documentElement.style.backgroundColor = DARK_COLOR;

    return () => {
      document.body.style.backgroundColor = prevBodyBg;
      document.body.style.backgroundImage = prevBodyBgImage;
      document.body.style.backgroundSize = prevBodyBgSize;
      document.body.style.backgroundPosition = prevBodyBgPos;
      document.body.style.backgroundRepeat = prevBodyBgRepeat;
      document.body.style.backgroundAttachment = prevBodyBgAttachment;
      document.documentElement.style.backgroundColor = prevHtmlBg;
    };
  }, []);
};

export default useDarkBackground;
