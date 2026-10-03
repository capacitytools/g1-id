import { ReactNode } from 'react';
import G1BottomNav from './G1BottomNav';

export default function G1Layout({ children }: { children: ReactNode }) {
  return (
    <div className="glayout">
      <main className="glayout__main">{children}</main>
      <G1BottomNav />
    </div>
  );
}