import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component that wraps page content and provides a smooth transition effect
 * when navigating between routes
 */
function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage('fadeOut');

      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('fadeIn');
      }, 300); // This should match the CSS transition duration

      return () => clearTimeout(timer);
    }
  }, [children, displayChildren]);

  return (
    <div className={`transition-opacity duration-300 ${transitionStage === 'fadeIn' ? 'opacity-100' : 'opacity-0'}`}>
      {displayChildren}
    </div>
  );
}

export default PageTransition; 