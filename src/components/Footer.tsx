import { OpenInNewIcon } from './NavIcons';

export function Footer() {
  return (
    <footer className="app-footer">
      <span>Kainan Guerra</span>
      <a href="https://www.linkedin.com/in/kainan-guerra" target="_blank" rel="noopener noreferrer">
        LinkedIn
        <OpenInNewIcon size={12} />
      </a>
      <a href="https://github.com/tc2-fiap" target="_blank" rel="noopener noreferrer">
        GitHub
        <OpenInNewIcon size={12} />
      </a>
    </footer>
  );
}
