import { GitHubIcon, LinkedInIcon, OpenInNewIcon } from './NavIcons';

export function Footer() {
  return (
    <footer className="app-footer">
      <span>Made by Kainan Guerra</span>
      <a href="https://www.linkedin.com/in/kainan-guerra" target="_blank" rel="noopener noreferrer">
        <LinkedInIcon size={14} />
        LinkedIn
        <OpenInNewIcon size={12} />
      </a>
      <a href="https://github.com/tc2-fiap" target="_blank" rel="noopener noreferrer">
        <GitHubIcon size={14} />
        GitHub
        <OpenInNewIcon size={12} />
      </a>
    </footer>
  );
}
