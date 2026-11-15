import type { AnchorHTMLAttributes } from 'react';
import { isPlainClick, navigate } from './router.ts';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** A real link whose plain left clicks navigate without reloading the page. */
export function Link({ href, onClick, ...rest }: Props) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!isPlainClick(event) || rest.target) return;
        event.preventDefault();
        navigate(href);
      }}
    />
  );
}
