// Função de easing para uma aceleração e desaceleração suaves (ease-in-out)
const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
  t /= d / 2;
  if (t < 1) return (c / 2) * t * t + b;
  t--;
  return (-c / 2) * (t * (t - 2) - 1) + b;
};

// Nova função de rolagem suave personalizada
const smoothScrollTo = (targetPosition: number, duration: number) => {
  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  let startTime: number | null = null;

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  };

  requestAnimationFrame(animation);
};

export const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    // Calcula a posição do elemento na página
    const targetPosition = element.offsetTop;
    // Usa nossa nova função com uma duração de 800ms para uma animação suave
    smoothScrollTo(targetPosition, 800);
  }
};

export const handleHashNavigation = (hash: string) => {
  if (hash.startsWith('#')) {
    const sectionId = hash.substring(1);
    // Small delay to ensure the page has loaded
    setTimeout(() => {
      scrollToSection(sectionId);
    }, 100);
  }
};