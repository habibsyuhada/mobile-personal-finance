// Empty state ilustratif per modul — emoji + tagline yang berbeda tiap modul
// sehingga tiap "tempat" terasa berbeda. Pakai CSS `data-module` di <html>
// untuk warna aksen dari accent modul.

import { IonIcon } from '@ionic/react';
import type { ReactNode } from 'react';

interface Props {
  emoji: string;
  title: string;
  body?: string;
  icon?: ReactNode;
}

export default function ModuleEmpty({ emoji, title, body, icon }: Props) {
  return (
    <div className="module-empty">
      {icon ?? <div className="emoji" aria-hidden="true">{emoji}</div>}
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

export { IonIcon };
